import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.consult import ConsultRequest, ConsultResponse, RemedyRecommendation
from app.agent.graph import run_consultation_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/consult", tags=["User Consultation"])


@router.post("", response_model=ConsultResponse)
def consult_remedy(request: ConsultRequest):
    """User consultation endpoint: Runs the LangGraph agent to match symptoms,

    retrieve home remedies, formulate dosages, and apply safety guardrails.
    """
    try:
        profile_dict = request.patient_profile.model_dump() if request.patient_profile else {}
        agent_result = run_consultation_agent(
            user_query=request.query,
            patient_profile=profile_dict
        )
        
        extracted_symptoms = agent_result.get("extracted_symptoms", [])
        formulation = agent_result.get("formulated_prescription", {})
        safety = agent_result.get("safety_evaluation", {})
        markdown_advice = agent_result.get("final_advice_markdown", "")
        
        # Parse recommendations into structured objects
        remedy_items = []
        raw_remedies = formulation.get("remedies", [])
        for r in raw_remedies:
            remedy_items.append(
                RemedyRecommendation(
                    remedy_name=r.get("remedy_name", "Home Remedy Formulation"),
                    ingredients=r.get("ingredients", []),
                    preparation=r.get("preparation", ""),
                    dosage=r.get("dosage", ""),
                    benefits=r.get("benefits", "")
                )
            )
            
        return ConsultResponse(
            identified_symptoms=extracted_symptoms,
            patient_warnings=safety.get("patient_specific_warnings", []),
            recommended_remedies=remedy_items,
            critical_precautions=safety.get("critical_precautions", []),
            who_should_avoid=safety.get("who_should_avoid", []),
            when_to_seek_doctor=safety.get("emergency_red_flags", []),
            full_advice_markdown=markdown_advice
        )
        
    except ValueError as val_err:
        logger.error(f"Configuration or validation error during consultation: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Unexpected error in consultation agent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent consultation failed: {str(e)}"
        )
