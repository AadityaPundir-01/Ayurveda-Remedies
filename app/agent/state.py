from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """LangGraph state schema for medical & home remedy consultation."""
    user_query: str
    patient_profile: Dict[str, Any]
    
    # Extracted by Symptom Analyzer Node
    extracted_symptoms: List[str]
    patient_risk_factors: List[str]
    
    # Retrieved from Qdrant Vector Store
    retrieved_docs: List[Dict[str, Any]]
    
    # Formulated by Remedy Formulation Node
    formulated_prescription: Dict[str, Any]
    
    # Analyzed by Precaution Guardrail Node
    safety_evaluation: Dict[str, Any]
    
    # Final Synthesizer Node Output
    final_advice_markdown: str
    error: Optional[str]
