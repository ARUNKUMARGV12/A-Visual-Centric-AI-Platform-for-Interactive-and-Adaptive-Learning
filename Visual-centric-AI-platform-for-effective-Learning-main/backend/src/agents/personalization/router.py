from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import json
from fastapi.responses import JSONResponse

from agents.personalization.agent import PersonalizationAgent
from agents.personalization.user_context import get_user_context, create_context_for_request
from agents.personalization.recommendations import get_personalized_recommendations, adapt_response_for_user

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
    
class UserContextUpdateRequest(BaseModel):
    user_id: str
    updates: Dict[str, Any]
    
class UserQueryRequest(BaseModel):
    user_id: str
    query: str
    response: Optional[str] = None
    
class UserContextResponse(BaseModel):
    user_id: str
    context: Dict[str, Any]

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

@router.post("/user-context")
async def get_or_create_user_context(request: Dict[str, Any]):
    """
    Get or create a user context object for the specified user.
    
    Args:
        request: Request containing user_id
        
    Returns:
        User context object
    """
    try:
        user_id = request.get("user_id", "guest")
        logger.info(f"Getting user context for user {user_id}")
        
        # Get the user context
        user_context = get_user_context(user_id)
        
        return JSONResponse(
            status_code=200,
            content={
                "user_id": user_id,
                "context": user_context.context
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user context: {str(e)}")

@router.post("/update-context")
async def update_user_context(request: UserContextUpdateRequest):
    """
    Update a user's context with new information.
    
    Args:
        request: Update request containing user_id and updates
        
    Returns:
        Updated user context
    """
    try:
        logger.info(f"Updating user context for user {request.user_id}")
        
        # Get the user context and update it
        user_context = get_user_context(request.user_id)
        updated_context = user_context.update_context(request.updates)
        
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "context": updated_context
            }
        )
        
    except Exception as e:
        logger.error(f"Error updating user context: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating user context: {str(e)}")

@router.post("/track-query")
async def track_user_query(request: UserQueryRequest):
    """
    Track a user query to update context and learning patterns.
    
    Args:
        request: Query request containing user_id, query, and optional response
        
    Returns:
        Updated user context
    """
    try:
        logger.info(f"Tracking query for user {request.user_id}")
        
        # Get the user context and update from query
        user_context = get_user_context(request.user_id)
        user_context.update_from_query(request.query, request.response)
        
        return JSONResponse(
            status_code=200,
            content={
                "user_id": request.user_id,
                "message": "Query tracked successfully",
                "context": user_context.context
            }
        )
        
    except Exception as e:
        logger.error(f"Error tracking user query: {e}")
        raise HTTPException(status_code=500, detail=f"Error tracking user query: {str(e)}")

@router.post("/dashboard-widgets")
async def get_dashboard_widgets(request: Dict[str, Any]):
    """
    Get personalized dashboard widgets for a user.
    
    Args:
        request: Request containing user_id
        
    Returns:
        Personalized dashboard widgets
    """
    try:
        user_id = request.get("user_id", "guest")
        logger.info(f"Getting dashboard widgets for user {user_id}")
        
        # Get personalized recommendations
        recommendations = get_personalized_recommendations(user_id)
        dashboard_widgets = recommendations.get_dashboard_widgets()
        
        return JSONResponse(
            status_code=200,
            content=dashboard_widgets
        )
        
    except Exception as e:
        logger.error(f"Error getting dashboard widgets: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting dashboard widgets: {str(e)}")

@router.post("/sidebar-widgets")
async def get_sidebar_widgets(request: Dict[str, Any]):
    """
    Get personalized sidebar widgets for a user.
    
    Args:
        request: Request containing user_id
        
    Returns:
        Personalized sidebar widgets
    """
    try:
        user_id = request.get("user_id", "guest")
        logger.info(f"Getting sidebar widgets for user {user_id}")
        
        # Get personalized recommendations
        recommendations = get_personalized_recommendations(user_id)
        sidebar_widgets = recommendations.get_sidebar_widgets()
        
        return JSONResponse(
            status_code=200,
            content=sidebar_widgets
        )
        
    except Exception as e:
        logger.error(f"Error getting sidebar widgets: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting sidebar widgets: {str(e)}")

@router.post("/adapt-response")
async def adapt_response(request: Dict[str, Any]):
    """
    Adapt an AI response for a specific user's learning style.
    
    Args:
        request: Request containing user_id, response, and optional query
        
    Returns:
        Adapted response
    """
    try:
        user_id = request.get("user_id", "guest")
        response = request.get("response", "")
        query = request.get("query")
        
        logger.info(f"Adapting response for user {user_id}")
        
        # Adapt the response
        adapted_response = adapt_response_for_user(user_id, response, query)
        
        return JSONResponse(
            status_code=200,
            content={
                "original": response,
                "adapted": adapted_response
            }
        )
        
    except Exception as e:
        logger.error(f"Error adapting response: {e}")
        raise HTTPException(status_code=500, detail=f"Error adapting response: {str(e)}")

@router.post("/context-for-request")
async def get_context_for_request(request: Dict[str, Any]):
    """
    Get a formatted user context object for inclusion in AI requests.
    
    Args:
        request: Request containing user information
        
    Returns:
        Formatted context object for AI models
    """
    try:
        logger.info(f"Creating context for request")
        
        # Create context for AI model
        context = create_context_for_request(request)
        
        return JSONResponse(
            status_code=200,
            content=context
        )
        
    except Exception as e:
        logger.error(f"Error creating context for request: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating context for request: {str(e)}")
