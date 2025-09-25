import json
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from agents.explainer.agent import ExplainerAgent
from agents.personalization.agent import PersonalizationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Create an instance of the explainer agent
explainer_agent = ExplainerAgent()

# Pydantic models
class ExplainTopicRequest(BaseModel):
    user_id: str
    topic: str
    personalization_data: Optional[Dict[str, Any]] = None

class ExplanationResponse(BaseModel):
    explanation: str
    suggested_visual_methods: List[str]
    personalization_applied: bool

async def get_personalization_data(user_id: str, topic: str) -> Dict[str, Any]:
    """
    Get personalization data for a user and topic.
    
    Args:
        user_id: User identifier
        topic: The topic to explain
        
    Returns:
        A dictionary of personalization data
    """
    try:
        # Create a personalization agent for this user
        personalization_agent = PersonalizationAgent(user_id)
        
        # Get personalization data for this topic
        personalization_data = personalization_agent.process_query(topic)
        
        # If this is an educational query, use the personalization data
        if personalization_data.get("query_type") == "educational":
            logger.info(f"Got personalization data for user {user_id} and topic {topic}")
            return personalization_data
        else:
            # For non-educational queries, return a basic personalization data
            logger.info(f"Got non-educational query for user {user_id} and topic {topic}")
            return {
                "query_type": "educational",  # Treat as educational for explanation purposes
                "level": "beginner",
                "learning_style": ["visual", "textual"],
                "emphasis": ["core concepts"],
                "knowledge_gaps": [],
                "connections": [],
                "tailored_instruction": f"Provide a clear, beginner-friendly explanation of {topic}.",
                "tailored_query": topic
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
            "tailored_instruction": f"Explain the concept of {topic} in a clear, straightforward manner."
        }

@router.post("/explain-topic", response_model=ExplanationResponse)
async def explain_topic_endpoint(request: ExplainTopicRequest):
    """
    Generate a personalized explanation for a topic and suggest relevant visualizations.
    
    Args:
        request: The explanation request
        
    Returns:
        An explanation and suggested visualization methods
    """
    try:
        logger.info(f"Received explain-topic request for user {request.user_id}, topic: {request.topic}")
        
        # Get personalization data if not provided
        personalization_data = request.personalization_data
        personalization_applied = False
        
        if personalization_data is None:
            personalization_data = await get_personalization_data(request.user_id, request.topic)
            personalization_applied = True
            
        # Get the tailored topic if available
        topic = personalization_data.get("tailored_query", request.topic) if personalization_applied else request.topic
            
        # Generate the explanation
        result = await explainer_agent.explain_topic(topic, personalization_data)
        
        logger.info(f"Generated explanation for user {request.user_id}, topic: {request.topic}")
        return ExplanationResponse(
            explanation=result["explanation"],
            suggested_visual_methods=result["suggested_visual_methods"],
            personalization_applied=personalization_applied
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in explanation endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing explanation request: {str(e)}")

@router.get("/visual-types")
async def get_visual_types():
    """
    Get a list of supported visualization types and their descriptions.
    
    Returns:
        A list of valid visualization types
    """
    visual_types = [
        {"id": "interactive_simulation", "name": "Interactive Simulation", "description": "Dynamic systems, processes, or algorithms that users can interact with."},
        {"id": "animated_diagram", "name": "Animated Diagram", "description": "Showing changes over time, flows, or complex static diagrams with sequential explanations."},
        {"id": "static_image_with_annotations", "name": "Static Image with Annotations", "description": "Clear, labeled diagrams, schematics, or concept illustrations."},
        {"id": "step_by_step_process", "name": "Step-by-Step Process", "description": "Breaking down a procedure into visual steps."},
        {"id": "data_visualization", "name": "Data Visualization", "description": "Representing data, trends, or comparisons (e.g., plots, charts, graphs)."},
        {"id": "concept_map", "name": "Concept Map", "description": "Illustrating relationships between concepts or ideas."},
        {"id": "code_walkthrough_animation", "name": "Code Walkthrough Animation", "description": "Visually explaining code snippets, execution flow, or data changes."},
        {"id": "3d_visualization", "name": "3D Visualization", "description": "Spatial, structural, or volumetric concepts."},
        {"id": "timeline_visualization", "name": "Timeline Visualization", "description": "Chronological data or project evolution."},
        {"id": "network_visualization", "name": "Network Visualization", "description": "Systems represented as nodes and edges."}
    ]
    
    return {"visual_types": visual_types} 