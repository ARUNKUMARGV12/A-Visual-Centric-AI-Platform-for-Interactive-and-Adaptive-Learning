from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from fastapi.responses import JSONResponse
import httpx

from agents.explanation.service import ExplanationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# In-memory cache of service instances
explanation_service = ExplanationService()

# Pydantic models
class ExplanationRequest(BaseModel):
    user_id: str
    concept: str
    personalization_data: Optional[Dict[str, Any]] = None

class VisualSpecificationRequest(BaseModel):
    user_id: str
    concept: str
    explanation: str
    personalization_data: Optional[Dict[str, Any]] = None

class ExplanationResponse(BaseModel):
    explanation: str

class VisualSpecificationResponse(BaseModel):
    specification: Dict[str, Any]

async def get_personalization_data(user_id: str, concept: str) -> Dict[str, Any]:
    """
    Get personalization data for a user and concept from the personalization agent.

    Args:
        user_id: The user identifier
        concept: The concept to explain

    Returns:
        Personalization data for the user and concept
    """
    try:
        # Make a request to the personalization agent
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/personalization/personalize",
                json={
                    "user_id": user_id,
                    "query": concept
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Error getting personalization data: {response.text}")
                # Return default personalization data
                return {
                    "level": "beginner",
                    "learning_style": ["visual", "textual"],
                    "emphasis": ["core concepts"],
                    "knowledge_gaps": [],
                    "connections": [],
                    "tailored_instruction": f"Explain the concept of {concept} in a clear, straightforward manner."
                }
    except Exception as e:
        logger.error(f"Error getting personalization data: {e}")
        # Return default personalization data
        return {
            "level": "beginner",
            "learning_style": ["visual", "textual"],
            "emphasis": ["core concepts"],
            "knowledge_gaps": [],
            "connections": [],
            "tailored_instruction": f"Explain the concept of {concept} in a clear, straightforward manner."
        }

@router.post("/explain", response_model=ExplanationResponse)
async def generate_explanation(request: ExplanationRequest):
    """
    Generate a personalized explanation for a concept.
    
    Args:
        request: The explanation request
        
    Returns:
        A personalized explanation for the concept
    """
    try:
        logger.info(f"Received explanation request for user {request.user_id}, concept: {request.concept}")
        
        # Get personalization data if not provided
        personalization_data = request.personalization_data
        
        if personalization_data is None:
            personalization_data = await get_personalization_data(request.user_id, request.concept)
            
        # Generate the explanation
        explanation = await explanation_service.generate_explanation(
            request.concept,
            personalization_data
        )
        
        logger.info(f"Generated explanation for user {request.user_id}, concept: {request.concept}")
        return ExplanationResponse(explanation=explanation)
        
    except Exception as e:
        logger.error(f"Error in explanation endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")

@router.post("/visual-specification", response_model=VisualSpecificationResponse)
async def generate_visual_specification(request: VisualSpecificationRequest):
    """
    Generate a visual specification for a concept based on an explanation.
    
    Args:
        request: The visual specification request
        
    Returns:
        A visual specification for the concept
    """
    try:
        logger.info(f"Received visual specification request for user {request.user_id}, concept: {request.concept}")
        
        # Get personalization data if not provided
        personalization_data = request.personalization_data
        
        if personalization_data is None:
            personalization_data = await get_personalization_data(request.user_id, request.concept)
            
        # Generate the visual specification
        specification = await explanation_service.generate_visual_specification(
            request.concept,
            request.explanation,
            personalization_data
        )
        
        logger.info(f"Generated visual specification for user {request.user_id}, concept: {request.concept}")
        return VisualSpecificationResponse(specification=specification)
        
    except Exception as e:
        logger.error(f"Error in visual specification endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating visual specification: {str(e)}") 