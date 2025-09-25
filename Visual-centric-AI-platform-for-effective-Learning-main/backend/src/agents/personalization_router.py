from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from fastapi.responses import JSONResponse

from personalization_agent import PersonalizationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# In-memory cache of agent instances
agent_cache = {}

# Pydantic models
class PersonalizationRequest(BaseModel):
    user_id: str
    query: str
    chat_history: Optional[List[Dict[str, Any]]] = None
    context: Optional[Dict[str, Any]] = None

class FeedbackRequest(BaseModel):
    user_id: str
    query: str
    was_helpful: bool
    feedback: Optional[str] = None

class PersonalizationResponse(BaseModel):
    level: str
    learning_style: List[str]
    emphasis: List[str]
    knowledge_gaps: List[str]
    connections: List[str]
    tailored_instruction: str

def get_agent(user_id: str) -> PersonalizationAgent:
    """
    Get or create a personalization agent for the user.
    
    Args:
        user_id: The user identifier
        
    Returns:
        A PersonalizationAgent instance
    """
    if user_id not in agent_cache:
        logger.info(f"Creating new personalization agent for user {user_id}")
        agent_cache[user_id] = PersonalizationAgent(user_id)
    return agent_cache[user_id]

@router.post("/personalize", response_model=PersonalizationResponse)
async def personalize_explanation(request: PersonalizationRequest):
    """
    Process a user query through the personalization agent to get tailored instructions.
    
    Args:
        request: The personalization request
        
    Returns:
        Personalization instructions for explaining the concept to the user
    """
    try:
        logger.info(f"Received personalization request for user {request.user_id}")
        
        # Get the agent for this user
        agent = get_agent(request.user_id)
        
        # Process the query
        response = agent.process_query(request.query)
        
        logger.info(f"Personalization agent response for user {request.user_id}: {response}")
        return PersonalizationResponse(**response)
        
    except Exception as e:
        logger.error(f"Error in personalization endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing personalization request: {str(e)}")

@router.post("/feedback")
async def provide_feedback(request: FeedbackRequest):
    """
    Submit feedback about a previous response to help improve personalization.
    
    Args:
        request: The feedback request
        
    Returns:
        Confirmation message
    """
    try:
        logger.info(f"Received feedback from user {request.user_id}")
        
        # Get the agent for this user
        agent = get_agent(request.user_id)
        
        # Process the feedback
        agent.provide_feedback(
            query=request.query,
            was_helpful=request.was_helpful,
            feedback=request.feedback
        )
        
        return JSONResponse(
            status_code=200,
            content={"message": "Feedback received and processed successfully"}
        )
        
    except Exception as e:
        logger.error(f"Error in feedback endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}") 