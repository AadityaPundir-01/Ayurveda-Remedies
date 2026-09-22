import json
import logging
import re
from typing import Dict, Any, List

from langchain_core.messages import SystemMessage, HumanMessage

from app.agent.state import AgentState
from app.agent.llm_factory import get_llm
from app.agent.prompts import (
    SYMPTOM_EXTRACTION_SYSTEM_PROMPT,
    FORMULATION_SYSTEM_PROMPT,
    SAFETY_PRECAUTION_GUARD_SYSTEM_PROMPT,
    SYNTHESIZER_SYSTEM_PROMPT,
)
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def extract_text_from_content(content: Any) -> str:
    """Extracts raw text string whether LLM returns a string or list of content blocks."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        texts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)
        return "".join(texts)
    return str(content)


def clean_json_response(content: Any) -> str:
    """Strips markdown code fences from LLM responses to ensure valid JSON parsing."""
    cleaned = extract_text_from_content(content).strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0]
    return cleaned.strip()


def analyze_symptoms_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Analyzes user query and extracts clinical symptoms and patient risk factors."""
    logger.info("Executing analyze_symptoms_node...")
    llm = get_llm()
    
    user_query = state.get("user_query", "")
    profile = state.get("patient_profile", {})
    
    prompt_input = (
        f"User Message: {user_query}\n"
        f"Patient Profile: {json.dumps(profile, default=str)}"
    )
    
    response = llm.invoke([
        SystemMessage(content=SYMPTOM_EXTRACTION_SYSTEM_PROMPT),
        HumanMessage(content=prompt_input)
    ])
    
    try:
        data = json.loads(clean_json_response(response.content))
        symptoms = data.get("symptoms", [])
        risks = data.get("patient_risk_factors", [])
    except Exception as e:
        logger.warning(f"Error parsing symptom JSON: {e}. Falling back to default extraction.")
        symptoms = [s.strip() for s in user_query.split(",") if s.strip()]
        risks = []
        
    return {
        "extracted_symptoms": symptoms,
        "patient_risk_factors": risks
    }


def retrieve_remedies_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Performs semantic similarity search in Qdrant vector database for matching home remedies."""
    logger.info("Executing retrieve_remedies_node...")
    symptoms = state.get("extracted_symptoms", [])
    query_text = " ".join(symptoms) if symptoms else state.get("user_query", "")
    
    vector_store = get_vector_store()
    
    try:
        results = vector_store.similarity_search_with_score(query_text, k=4)
        retrieved = []
        for doc, score in results:
            retrieved.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "similarity_score": float(score)
            })
        logger.info(f"Retrieved {len(retrieved)} relevant remedy documents from Qdrant.")
    except Exception as e:
        logger.error(f"Error querying vector store: {e}")
        retrieved = []
        
    return {"retrieved_docs": retrieved}


def formulate_prescription_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Formulates matching remedies, ingredients, dosages, and preparation instructions."""
    logger.info("Executing formulate_prescription_node...")
    llm = get_llm()
    
    symptoms = state.get("extracted_symptoms", [])
    risks = state.get("patient_risk_factors", [])
    docs = state.get("retrieved_docs", [])
    
    context_str = "\n\n---\n\n".join([d["content"] for d in docs]) if docs else "No specific database match found."
    
    prompt_input = (
        f"Identified Symptoms: {', '.join(symptoms)}\n"
        f"Patient Risk Factors: {', '.join(risks) if risks else 'None reported'}\n\n"
        f"Database Remedy Knowledge:\n{context_str}\n"
    )
    
    response = llm.invoke([
        SystemMessage(content=FORMULATION_SYSTEM_PROMPT),
        HumanMessage(content=prompt_input)
    ])
    
    try:
        prescription_data = json.loads(clean_json_response(response.content))
    except Exception as e:
        logger.warning(f"Error parsing prescription JSON: {e}")
        prescription_data = {
            "remedies": [],
            "reasoning": response.content
        }
        
    return {"formulated_prescription": prescription_data}


def precaution_guard_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Evaluates proposed formulation against safety rules, contraindications, and who should avoid it."""
    logger.info("Executing precaution_guard_node...")
    llm = get_llm()
    
    formulation = state.get("formulated_prescription", {})
    profile = state.get("patient_profile", {})
    risks = state.get("patient_risk_factors", [])
    docs = state.get("retrieved_docs", [])
    
    # Extract documented database contraindications
    db_contraindications = []
    for d in docs:
        meta = d.get("metadata", {})
        if "who_should_avoid" in meta and isinstance(meta["who_should_avoid"], list):
            db_contraindications.extend(meta["who_should_avoid"])
        if "precautions_and_contraindications" in meta and isinstance(meta["precautions_and_contraindications"], list):
            db_contraindications.extend(meta["precautions_and_contraindications"])
            
    prompt_input = (
        f"Proposed Remedies Formulation:\n{json.dumps(formulation, indent=2)}\n\n"
        f"Patient Profile: {json.dumps(profile, default=str)}\n"
        f"Identified Patient Risks: {', '.join(risks) if risks else 'None'}\n"
        f"Database Documented Warnings: {'; '.join(set(db_contraindications)) if db_contraindications else 'None'}\n"
    )
    
    response = llm.invoke([
        SystemMessage(content=SAFETY_PRECAUTION_GUARD_SYSTEM_PROMPT),
        HumanMessage(content=prompt_input)
    ])
    
    try:
        safety_data = json.loads(clean_json_response(response.content))
    except Exception as e:
        logger.warning(f"Error parsing safety JSON: {e}")
        safety_data = {
            "safety_status": "CAUTION",
            "patient_specific_warnings": [],
            "who_should_avoid": ["Infants under 12 months", "Pregnant or nursing women without doctor approval"],
            "critical_precautions": ["Do not exceed stated doses", "Discontinue immediately if allergic symptoms appear"],
            "emergency_red_flags": ["Difficulty breathing", "High fever above 102F", "Severe allergic swelling"]
        }
        
    return {"safety_evaluation": safety_data}


def synthesize_response_node(state: AgentState) -> Dict[str, Any]:
    """Node 5: Synthesizes complete advice into structured Markdown with clear warning callouts."""
    logger.info("Executing synthesize_response_node...")
    llm = get_llm()
    
    symptoms = state.get("extracted_symptoms", [])
    formulation = state.get("formulated_prescription", {})
    safety = state.get("safety_evaluation", {})
    
    prompt_input = (
        f"Identified Symptoms: {', '.join(symptoms)}\n\n"
        f"Formulation:\n{json.dumps(formulation, indent=2)}\n\n"
        f"Safety Evaluation & Precautions:\n{json.dumps(safety, indent=2)}\n"
    )
    
    response = llm.invoke([
        SystemMessage(content=SYNTHESIZER_SYSTEM_PROMPT),
        HumanMessage(content=prompt_input)
    ])
    
    return {"final_advice_markdown": extract_text_from_content(response.content)}
