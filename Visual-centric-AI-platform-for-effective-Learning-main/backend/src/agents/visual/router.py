import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from agents.visual.agent import VisualAgent
from agents.personalization.agent import PersonalizationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Create an instance of the visual agent
visual_agent = VisualAgent()

# Pydantic models
class GenerateVisualizationRequest(BaseModel):
    user_id: str
    visualization_name: str
    explanation: str
    personalization_data: Optional[Dict[str, Any]] = None

class VisualizationResponse(BaseModel):
    visualization_name: str
    html_code: str
    css_code: str
    js_code: str

@router.post("/generate-visualization", response_model=VisualizationResponse)
async def generate_visualization_endpoint(request: GenerateVisualizationRequest):
    """
    Generate a visualization based on the explanation and visualization name.
    
    Args:
        request: The visualization generation request
        
    Returns:
        A visualization with HTML, CSS, and JS code
    """
    try:
        logger.info(f"Received generate-visualization request for user {request.user_id}, visualization: {request.visualization_name}")
        
        # Get personalization data if not provided
        personalization_data = request.personalization_data
        
        if personalization_data is None:
            try:
                # Create a personalization agent for this user
                personalization_agent = PersonalizationAgent(request.user_id)
                
                # Get personalization data with a generic topic
                personalization_data = personalization_agent.process_query(
                    f"Create a {request.visualization_name}"
                )
                
                # Adapt the type for visualization if needed
                if personalization_data.get("query_type") != "educational":
                    personalization_data["query_type"] = "educational"
                    
            except Exception as e:
                logger.error(f"Error getting personalization data: {e}")
                # Will use default None value
        
        # Generate the visualization
        result = await visual_agent.generate_visualization(
            request.visualization_name,
            request.explanation,
            personalization_data
        )
        
        logger.info(f"Generated visualization for user {request.user_id}, visualization: {request.visualization_name}")
        return VisualizationResponse(
            visualization_name=result["visualization_name"],
            html_code=result["html_code"],
            css_code=result["css_code"],
            js_code=result["js_code"]
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in visualization endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing visualization request: {str(e)}")

@router.get("/visualization-capabilities")
async def get_visualization_capabilities():
    """
    Get information about the visualization capabilities of the system.
    
    Returns:
        A dictionary with visualization capabilities information
    """
    visualization_types = [
        {
            "id": "interactive_simulation",
            "name": "Interactive Simulation",
            "description": "Dynamic systems, processes, or algorithms that users can interact with.",
            "examples": ["Physics simulations", "Algorithm visualizations", "Interactive data models"]
        },
        {
            "id": "animated_diagram", 
            "name": "Animated Diagram",
            "description": "Showing changes over time, flows, or complex static diagrams with sequential explanations.",
            "examples": ["Process flows", "State transitions", "Animated graphs"]
        },
        {
            "id": "concept_map", 
            "name": "Concept Map",
            "description": "Illustrating relationships between concepts or ideas.",
            "examples": ["Mind maps", "Knowledge graphs", "Hierarchical structures"]
        }
    ]
    
    return {
        "visualization_types": visualization_types,
        "status": "operational",
        "version": "0.1.0"
    } 