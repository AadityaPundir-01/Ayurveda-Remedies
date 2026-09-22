import logging
from typing import Dict, Any

from langgraph.graph import StateGraph, START, END

from app.agent.state import AgentState
from app.agent.nodes import (
    analyze_symptoms_node,
    retrieve_remedies_node,
    formulate_prescription_node,
    precaution_guard_node,
    synthesize_response_node
)

logger = logging.getLogger(__name__)


def build_consultation_graph():
    """Builds and compiles the LangGraph state machine for medical home remedy consultations."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("analyze_symptoms", analyze_symptoms_node)
    workflow.add_node("retrieve_remedies", retrieve_remedies_node)
    workflow.add_node("formulate_prescription", formulate_prescription_node)
    workflow.add_node("precaution_guard", precaution_guard_node)
    workflow.add_node("synthesize_response", synthesize_response_node)
    
    # Add edges
    workflow.add_edge(START, "analyze_symptoms")
    workflow.add_edge("analyze_symptoms", "retrieve_remedies")
    workflow.add_edge("retrieve_remedies", "formulate_prescription")
    workflow.add_edge("formulate_prescription", "precaution_guard")
    workflow.add_edge("precaution_guard", "synthesize_response")
    workflow.add_edge("synthesize_response", END)
    
    return workflow.compile()


# Compiled singleton graph
consultation_app = build_consultation_graph()


def run_consultation_agent(user_query: str, patient_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """Executes the agentic workflow given a user query and patient profile."""
    initial_state: AgentState = {
        "user_query": user_query,
        "patient_profile": patient_profile or {},
        "extracted_symptoms": [],
        "patient_risk_factors": [],
        "retrieved_docs": [],
        "formulated_prescription": {},
        "safety_evaluation": {},
        "final_advice_markdown": "",
        "error": None
    }
    
    logger.info(f"Running consultation agent for query: {user_query[:50]}...")
    result_state = consultation_app.invoke(initial_state)
    return result_state
