import os
import json
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Any
import logging

# Import for Gemini client (type hinting)
import google.generativeai as genai

# Removed Azure imports as they are no longer used
# from azure.ai.inference import ChatCompletionsClient
# from azure.ai.inference.models import SystemMessage, UserMessage

# --- Pydantic Models ---
class AnalysisRequest(BaseModel):
    user_text: str
    # Potentially add context_text if available and useful for the analyzer
    # context_text: str | None = None 

class PreliminaryPlan(BaseModel):
    topic: str = Field(..., description="The main topic identified from the user text.")
    overall_visual_goal: str = Field(..., description="What the visual aims to achieve for the student.")
    key_elements_to_highlight: List[str] = Field(
        ..., 
        description="Key components, sub-topics, or distinct items from the text that should be individually addressed or visualized."
    )
    # We can add other general high-level plan items here if needed for specific visual types
    # e.g., for data_visualization: initial_data_description: str | None = None

class AnalysisResponse(BaseModel):
    chosen_visual_type: str
    justification: str
    preliminary_plan: PreliminaryPlan 

# --- Visual Types (from visual_types_reference.md) ---
# Numbering corrected for consistency
VALID_VISUAL_TYPES = [
    "interactive_simulation",           # 1
    "animated_diagram",                 # 2
    "static_image_with_annotations",    # 3
    "step_by_step_process",             # 4
    "data_visualization",               # 5
    "concept_map",                      # 6
    "code_walkthrough_animation",       # 7
    "3d_visualization",                 # 8
    "timeline_visualization",           # 9
    "network_visualization"             # 10
]

logger = logging.getLogger(__name__)

# --- Updated Dependency Function to get Gemini Client ---
def get_gemini_client(request: Request) -> genai.GenerativeModel:
    if not hasattr(request.app.state, 'gemini_client') or request.app.state.gemini_client is None:
        logger.error("Gemini client not found on app.state in analyzer_agent")
        raise HTTPException(status_code=503, detail="LLM service (Gemini) not available. Client not found on app state.")
    return request.app.state.gemini_client

# --- Agent Logic ---
async def analyze_text_and_plan_visual(
    text: str,
    gemini_client: genai.GenerativeModel
) -> AnalysisResponse:
    visual_types_list_str = "\\n".join([f"- {v_type}" for v_type in VALID_VISUAL_TYPES])

    # Note: Gemini prefers direct instructions, and the prompt structure might need adjustment.
    # For Gemini, we'll construct a single prompt string.
    # JSON output instruction is critical for Gemini.
    prompt = f"""You are an expert AI assistant specializing in educational content and visualization planning. 
Your task is to analyze the user-provided text to:
1. Determine the single most effective visual representation type from the provided list to help a student understand the core concepts in the text.
2. Provide a justification for your choice of visual type.
3. Create a preliminary plan for the visualization.

Available visual types:
{visual_types_list_str}

User-provided text:
'''{text}'''

Your response MUST be a single, valid JSON object with three keys:
1.  "chosen_visual_type": A string representing the single most appropriate visual type from the list.
2.  "justification": A brief (1-2 sentences) explanation for why this visual type was chosen. This should explain how it helps in understanding.
3.  "preliminary_plan": A JSON object containing the following sub-keys:
    a. "topic": A concise string identifying the main subject or topic of the user text.
    b. "overall_visual_goal": A string describing what the overall visual should aim to achieve for the student (e.g., 'Illustrate the process of X', 'Compare Y and Z', 'Show the components of A').
    c. "key_elements_to_highlight": A list of strings. These are the key individual concepts, components, steps, items, or sub-topics within the user text that should be distinctly represented, explained, or focused on within the chosen visual. For example, if the text describes multiple ancient water systems, list each system. If it describes steps in a process, list each step. If it describes parts of a mechanism, list each part.

Example for "preliminary_plan" structure if the text is about different historical architectural styles:
{{ 
  "topic": "Historical Architectural Styles",
  "overall_visual_goal": "To visually differentiate key historical architectural styles and their defining features.",
  "key_elements_to_highlight": ["Greek Doric Columns", "Roman Arches", "Gothic Flying Buttresses", "Renaissance Domes"]
}}

Example for "preliminary_plan" if the text is about photosynthesis for an 'animated_diagram':
{{ 
  "topic": "Photosynthesis Process",
  "overall_visual_goal": "To animate and explain the key stages and components involved in photosynthesis.",
  "key_elements_to_highlight": ["Light-dependent reactions (thylakoids, water splitting, ATP/NADPH production)", "Calvin cycle (stroma, CO2 fixation, sugar production)", "Chloroplast structure overview"]
}}

Ensure the entire output is a single, valid JSON object only. Do not include any explanatory text before or after the JSON object.
"""

    # Get temperature and max_tokens from environment variables, with defaults
    # These might need different considerations for Gemini compared to DeepSeek
    try:
        agent_temperature = float(os.getenv("ANALYZER_AGENT_TEMPERATURE", "0.3")) # Adjusted default for Gemini
    except ValueError:
        agent_temperature = 0.3
    
    # max_tokens for Gemini is configured differently (output tokens) if needed, usually not set for generate_content
    # We will rely on Gemini's default output token limits unless issues arise.
    # For Gemini, generation_config is used for temperature, top_p, top_k, max_output_tokens
    generation_config = genai.types.GenerationConfig(
        temperature=agent_temperature,
        # max_output_tokens=1500 # Let's test without explicit max_output_tokens first
    )

    try:
        logger.info(f"Sending request to Gemini for AnalyzerAgent. Prompt length: {len(prompt)}")
        response = await gemini_client.generate_content_async(
            prompt, 
            generation_config=generation_config
        )

        if response.text:
            content = response.text
            logger.debug(f"Gemini raw response for AnalyzerAgent: {content}")
            try:
                # The LLM might sometimes wrap JSON in ```json ... ``` or just ``` ... ```
                if content.strip().startswith("```json"):
                    content = content.strip()[7:-3].strip() # Remove ```json and ```
                elif content.strip().startswith("```") and content.strip().endswith("```"):
                    content = content.strip()[3:-3].strip() # Remove ``` and ```
                
                parsed_json = json.loads(content)

                # Validate top-level keys
                if not all(key in parsed_json for key in ["chosen_visual_type", "justification", "preliminary_plan"]):
                    logger.error(f"Missing required top-level keys in Gemini JSON. Got: {parsed_json.keys()}")
                    raise ValueError("Missing one or more required top-level keys in LLM JSON response.")
                
                # Validate chosen_visual_type
                if parsed_json["chosen_visual_type"] not in VALID_VISUAL_TYPES:
                    logger.warning(f"Gemini chose an invalid visual type: {parsed_json['chosen_visual_type']}. Valid: {VALID_VISUAL_TYPES}")
                    # Fallback or error. For now, raise an error.
                    raise ValueError(f"LLM chose an invalid visual type: {parsed_json['chosen_visual_type']}")
                
                # Validate preliminary_plan structure
                plan = parsed_json.get("preliminary_plan")
                if not isinstance(plan, dict) or not all(key in plan for key in ["topic", "overall_visual_goal", "key_elements_to_highlight"]):
                    logger.error(f"Missing keys in preliminary_plan. Got: {plan.keys() if isinstance(plan, dict) else 'Not a dict'}")
                    raise ValueError("Missing one or more required keys in 'preliminary_plan'. Expected 'topic', 'overall_visual_goal', 'key_elements_to_highlight'.")
                if not isinstance(plan.get("key_elements_to_highlight"), list):
                    logger.error(f"key_elements_to_highlight is not a list. Got: {type(plan.get('key_elements_to_highlight'))}")
                    raise ValueError("'key_elements_to_highlight' in preliminary_plan must be a list.")

                return AnalysisResponse(**parsed_json)
            
            except json.JSONDecodeError as e:
                logger.error(f"Gemini response was not valid JSON: {content}, Error: {e}")
                raise HTTPException(status_code=500, detail=f"LLM response was not valid JSON. Content: {content}. Error: {e}")
            except ValueError as e:
                logger.error(f"Gemini JSON response validation error: {e}. Content: {parsed_json if 'parsed_json' in locals() else content}")
                raise HTTPException(status_code=500, detail=f"LLM JSON response validation error: {e}")
        else:
            logger.error(f"Received no text content from Gemini. Response: {response}")
            # Check for prompt feedback or safety ratings if applicable
            if response.prompt_feedback:
                logger.error(f"Gemini prompt feedback: {response.prompt_feedback}")
                raise HTTPException(status_code=400, detail=f"Request blocked by Gemini due to: {response.prompt_feedback.block_reason}")
            if response.candidates and response.candidates[0].finish_reason != 'STOP':
                 logger.error(f"Gemini generation finished due to: {response.candidates[0].finish_reason}")
                 raise HTTPException(status_code=500, detail=f"LLM generation finished unexpectedly: {response.candidates[0].finish_reason}")
            raise HTTPException(status_code=500, detail="No content received from LLM (Gemini).")

    except Exception as e:
        logger.error(f"Error during Gemini LLM call in Analyzer Agent: {e}", exc_info=True)
        # Consider more specific error handling based on Gemini client exceptions
        raise HTTPException(status_code=500, detail=f"An error occurred while communicating with the LLM (Gemini): {str(e)}")

# --- FastAPI Router ---
router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_for_visual(
    analysis_request: AnalysisRequest,
    gemini_llm_client: genai.GenerativeModel = Depends(get_gemini_client)
):
    """
    Analyzes user-provided text to determine the most suitable visual type 
    and a preliminary plan for visualization using Gemini.
    """
    if not analysis_request.user_text.strip():
        raise HTTPException(status_code=400, detail="user_text cannot be empty.")

    return await analyze_text_and_plan_visual(text=analysis_request.user_text, gemini_client=gemini_llm_client)

# Ensure logger is configured in main.py (e.g., logging.basicConfig)

# Example of how to add logging if you have a logger configured
# import logging
# logger = logging.getLogger(__name__)
# In main.py, you'd configure logging.basicConfig(level=logging.INFO) or similar. 