import os
import json
import asyncio # For running multiple LLM calls concurrently
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Any
import logging # Added logging

import google.generativeai as genai # Added for Gemini

# Removed Azure imports as they are no longer used
# from azure.ai.inference import ChatCompletionsClient
# from azure.ai.inference.models import SystemMessage, UserMessage

# Input to this agent: Output from AnalyzerAgent + original_user_text
from analyzer_agent import AnalysisResponse as AnalyzerAgentOutput

# --- Pydantic Models ---

class VisualPromptGeneratorRequest(BaseModel):
    analyzer_data: AnalyzerAgentOutput
    original_user_text: str

class LLMSubTask(BaseModel):
    task_id: str # e.g., "title_generation", "element_solar_panel_details", "overall_animation_sequence"
    prompt_for_llm: str = Field(..., description="The specific prompt to send to an LLM to get a piece of text.")
    # expected_output_description: str # Brief note on what this LLM call should return

class InternalDetailedPlan(BaseModel):
    visual_type_requested: str
    topic: str
    selected_text_summary: str
    overall_visual_goal: str
    parameter_justification: str
    key_elements_original: List[str]
    # This will now hold tasks that need to be executed by an LLM
    # to get the actual textual content for various parts of the final prompt.
    sub_tasks_for_llm: List[LLMSubTask]

class VisualPromptResponse(BaseModel):
    visual_generation_prompt: str = Field(
        ...,
        description="The final, detailed prompt to be sent to a code-generating LLM."
    )
    chosen_visual_type: str
    # We could also include the intermediate results here for debugging if needed
    # intermediate_llm_results: Dict[str, str] | None = None

logger = logging.getLogger(__name__) # Added logger instance

# --- Updated Dependency Function to get Gemini Client ---
def get_gemini_client(request: Request) -> genai.GenerativeModel:
    if not hasattr(request.app.state, 'gemini_client') or request.app.state.gemini_client is None:
        logger.error("Gemini client not found on app.state in visual_prompt_generator")
        raise HTTPException(status_code=503, detail="LLM service (Gemini) not available.")
    return request.app.state.gemini_client

# --- Helper for LLM calls (Updated for Gemini) ---
async def execute_llm_sub_task(gemini_client: genai.GenerativeModel, sub_task: LLMSubTask, context_text: str = "") -> str:
    full_prompt = sub_task.prompt_for_llm
    if context_text: # This context_text is currently not used in the main orchestrator, but kept for flexibility
        full_prompt = f"{context_text}\n\nTask: {sub_task.prompt_for_llm}"
    
    logger.info(f"Executing VPG Sub-task: {sub_task.task_id}")
    try:
        sub_task_temp = float(os.getenv("VPG_SUBTASK_TEMPERATURE", "0.6")) # Slightly higher for potentially creative sub-tasks
        # max_tokens is generally not needed for gemini_client.generate_content_async unless very specific control is required.
        generation_config = genai.types.GenerationConfig(temperature=sub_task_temp)

        response = await gemini_client.generate_content_async(full_prompt, generation_config=generation_config)
        
        if response.text:
            logger.debug(f"Sub-task {sub_task.task_id} response: {response.text[:100]}...") # Log snippet
            return response.text.strip()
        else:
            logger.warning(f"Gemini sub-task {sub_task.task_id} returned no text. Prompt Feedback: {response.prompt_feedback}, Finish Reason: {response.candidates[0].finish_reason if response.candidates else 'N/A'}")
            return "" # Return empty string or raise specific error
    except Exception as e:
        logger.error(f"Error executing Gemini sub-task {sub_task.task_id}: {e}", exc_info=True)
        return f"Error processing sub-task: {sub_task.task_id} due to {str(e)}" # Return error message in content

# --- Core Agent Logic (Updated for Gemini) ---
async def generate_visual_code_prompt_orchestrator(
    request_data: VisualPromptGeneratorRequest,
    gemini_client: genai.GenerativeModel # Updated type hint
) -> VisualPromptResponse:

    analyzer_output = request_data.analyzer_data
    original_user_text = request_data.original_user_text
    visual_type = analyzer_output.chosen_visual_type
    key_elements_str = "\n- " + "\n- ".join(analyzer_output.preliminary_plan.key_elements_to_highlight)

    # STEP A: Generate the InternalDetailedPlan using a Gemini LLM call
    expansion_prompt = f"""You are an expert AI assistant that plans detailed prompts for visual generation.
Given an initial analysis (topic, visual goal, chosen visual type, key elements), expand this into a structured list of sub-tasks. Each sub-task will be a prompt for another LLM call to generate specific text content (like a title, animation details for an element, etc.), which will then be used to build a final comprehensive prompt for a code-generating LLM.

Input from Initial Analysis:
- Chosen Visual Type: {visual_type}
- Topic: {analyzer_output.preliminary_plan.topic}
- Overall Visual Goal: {analyzer_output.preliminary_plan.overall_visual_goal}
- Key Elements to Highlight: {key_elements_str}
- Justification for Visual Type: {analyzer_output.justification}
- Original User Text for Summary: '''{original_user_text}'''

Your task is to generate a single JSON object representing an 'InternalDetailedPlan'. This plan should follow this general structure:
{{
  "visual_type_requested": "{visual_type}",
  "topic": "{analyzer_output.preliminary_plan.topic}",
  "selected_text_summary": "(Suggest a prompt for an LLM to generate a 1-2 sentence summary of the original_user_text here, e.g., 'Summarize the following text in 1-2 sentences, focusing on its core message for a visual explanation: '''{original_user_text}'''')",
  "overall_visual_goal": "{analyzer_output.preliminary_plan.overall_visual_goal}",
  "parameter_justification": "{analyzer_output.justification}",
  "key_elements_original": {json.dumps(analyzer_output.preliminary_plan.key_elements_to_highlight)},
  "sub_tasks_for_llm": [
    // Example sub-tasks. Adapt and add more as needed.
    {{ "task_id": "title_generation", "prompt_for_llm": "Generate an engaging and descriptive title (max 10 words) for a '{visual_type}' about '{analyzer_output.preliminary_plan.topic}'. Be creative and capture the essence of the topic." }},
    // For EACH key element from 'key_elements_to_highlight', create a sub_task.
    // The goal is to get descriptive text for each element that helps in visualizing it.
    // Example for an element 'XYZ':
    // {{ "task_id": "element_XYZ_details", "prompt_for_llm": "For the element 'XYZ' in a '{visual_type}' about '{analyzer_output.preliminary_plan.topic}', creatively describe its visual appearance and behavior. Consider its role in the overall visual goal: '{analyzer_output.preliminary_plan.overall_visual_goal}'. You can suggest animations, interactions, or annotations that would make it engaging and informative. Focus on conveying the concept effectively. Avoid giving direct coding instructions." }},
    // ... more element sub-tasks ...
    // Add a sub-task for overall sequence/layout, adapting based on visual_type:
    // If animated (e.g., animated_diagram, interactive_simulation):
    // {{ "task_id": "overall_animation_sequence", "prompt_for_llm": "Outline an engaging overall animation sequence and narrative flow for a '{visual_type}' on '{analyzer_output.preliminary_plan.topic}'. Describe how the key elements (input) should be introduced and transition. Suggest key textual annotations or narration ideas that enhance understanding and flow. Be creative with the storytelling." }},
    // If static (e.g., static_image_with_annotations, concept_map):
    // {{ "task_id": "overall_layout_composition", "prompt_for_llm": "Propose an optimal and visually appealing layout/composition for a static '{visual_type}' on '{analyzer_output.preliminary_plan.topic}'. Describe how key elements (input) should be arranged to best convey their relationships and the main message. Suggest styles for visual emphasis and clarity. Think about visual hierarchy and information design." }}
  ]
}}

Important for `sub_tasks_for_llm`:
- For each of these items: {key_elements_str}
  Create a specific sub-task. The `task_id` should be `element_[element_name_snake_case]_details`.
  The `prompt_for_llm` should inspire creative descriptions. For example: "Element: '[Element Name]'. In a '{visual_type}' about '{analyzer_output.preliminary_plan.topic}', describe its visual representation. What makes it stand out? How could it be animated or interacted with (if applicable for '{visual_type}')? What annotations or callouts would clarify its role in the visual's goal: '{analyzer_output.preliminary_plan.overall_visual_goal}'? Generate rich descriptive text to inspire a code generation LLM."
- Ensure the sub-task for overall sequence/layout is included and its `task_id` is either `overall_animation_sequence` or `overall_layout_composition` as appropriate for the visual type: '{visual_type}'. The prompt should encourage a creative approach to the overall structure and flow.

Output ONLY the single valid JSON object. No other text before or after.
"""
    logger.info(f"Attempting VPG Expansion Phase for topic: {analyzer_output.preliminary_plan.topic}")
    content = ""
    internal_plan_dict = {}
    try:
        expansion_temp = float(os.getenv("VPG_EXPANSION_TEMPERATURE", "0.4")) # Slightly higher for this creative planning task
        expansion_config = genai.types.GenerationConfig(temperature=expansion_temp)
        # max_tokens is not directly set for generate_content, allow model to decide based on prompt complexity.

        expansion_response = await gemini_client.generate_content_async(expansion_prompt, generation_config=expansion_config)
        
        if not expansion_response.text:
            logger.error(f"Gemini (Expansion Phase) returned no text. Feedback: {expansion_response.prompt_feedback}, Finish: {expansion_response.candidates[0].finish_reason if expansion_response.candidates else 'N/A'}")
            raise HTTPException(status_code=500, detail="LLM (Expansion Phase) returned no content.")
        
        content = expansion_response.text.strip()
        logger.debug(f"VPG Expansion phase raw JSON output: {content}")
        
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```") and content.endswith("```"):
            content = content[3:-3].strip()
        
        internal_plan_dict = json.loads(content)
        internal_detailed_plan = InternalDetailedPlan(**internal_plan_dict)
        logger.info(f"VPG Expansion Phase successful. Number of sub_tasks: {len(internal_detailed_plan.sub_tasks_for_llm)}")

    except json.JSONDecodeError as e:
        logger.error(f"LLM response (Expansion Phase) was not valid JSON. Content: {content}. Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM response (Expansion Phase) was not valid JSON. Content snippet: {content[:200]}. Error: {e}")
    except Exception as e:
        logger.error(f"Error in VPG Expansion Phase: {str(e)}. Content: {content[:200] if content else 'No content'}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error in Expansion Phase: {str(e)}. Content: {internal_plan_dict if internal_plan_dict else content[:200]}")

    # STEP B: Execute all sub_tasks_for_llm concurrently
    sub_task_results: Dict[str, str] = {}
    tasks_to_run = []
    if not internal_detailed_plan.sub_tasks_for_llm:
        logger.warning("No sub-tasks generated in the expansion phase. Final prompt might be incomplete.")
    else:
        for sub_task in internal_detailed_plan.sub_tasks_for_llm:
            tasks_to_run.append(execute_llm_sub_task(gemini_client, sub_task))
        
        try:
            logger.info(f"VPG: Starting execution of {len(tasks_to_run)} sub-tasks.")
            results = await asyncio.gather(*tasks_to_run)
            for i, sub_task in enumerate(internal_detailed_plan.sub_tasks_for_llm):
                sub_task_results[sub_task.task_id] = results[i]
            logger.info("VPG: All sub-tasks executed.")
        except Exception as e:
            logger.error(f"Error executing sub-tasks concurrently: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error executing LLM sub-tasks: {str(e)}")

    # STEP C: Assemble the final prompt for the code-generating LLM
    final_prompt_parts = [
        "You are an expert AI assistant specialized in generating interactive and educational visualizations using HTML, CSS, and JavaScript.",
        "Your task is to generate complete, self-contained, and runnable code for the requested visual.",
        "The code should be well-structured, commented where necessary, and visually appealing. Aim for a design that is modern and user-friendly.",
        "Ensure all necessary HTML structure, CSS styling, and JavaScript logic are included.",
        "IMPORTANT: The generated visualization MUST be responsive. It should adapt its layout and element sizes gracefully to different screen widths, from mobile to desktop. Use techniques like relative units (percentages, vw/vh), flexbox, grid, and media queries where appropriate to achieve this. Avoid fixed pixel widths for main containers where possible.",
        "If specific data isn't provided directly, use appropriate placeholder data or generate illustrative examples to make the visual functional and demonstrate its capabilities.",
        "Prioritize clarity, engagement, and educational value in the visual output. The visual should effectively communicate the core concepts.",
        "The visual should be responsive and adapt well to different screen sizes, if applicable to the type.",
        f"--- Overall Visual Context ---",
        f"Visual Type: {internal_detailed_plan.visual_type_requested}",
        f"Topic: {internal_detailed_plan.topic}",
        f"Summary of Content: {internal_detailed_plan.selected_text_summary}",
        f"Goal: {internal_detailed_plan.overall_visual_goal}",
        f"Title: {sub_task_results.get('title_generation', 'Default Title: ' + internal_detailed_plan.topic)}",
        "--- End of Overall Visual Context ---",
        "\n--- Detailed Visual Components & Sequence/Layout ---   ",
    ]

    for task_id, result_text in sub_task_results.items():
        if task_id != 'title_generation': # Title is already included above
            readable_section_name = task_id.replace('element_', '').replace('_details', '').replace('overall_', '').replace('_', ' ').capitalize().strip()
            if not readable_section_name:
                readable_section_name = "General Details"
            if task_id.startswith('element_'):
                 readable_section_name = f"Element: {readable_section_name}"
            elif task_id == 'overall_animation_sequence' or task_id == 'overall_layout_composition':
                 readable_section_name = "Overall Animation Sequence / Layout Composition"

            final_prompt_parts.append(f"\n## {readable_section_name}\n{result_text}")
    
    final_prompt_parts.append("\n--- Code Generation Guidance ---")
    final_prompt_parts.append("Based on all the details above, please generate the complete HTML, CSS, and JavaScript code.")
    final_prompt_parts.append("The generated code MUST be valid and error-free. Double-check for common issues like unclosed tags, correct CSS syntax, and JavaScript runtime errors.")
    final_prompt_parts.append("IMPORTANT: The output should ONLY be the core visualization itself. Do NOT include full HTML page boilerplate like <html>, <head>, <body> tags unless absolutely essential for a specific type of complex SVG or canvas rendering that requires it. Do NOT include external page elements such as navigation bars, site headers, or footers. The code will be embedded into an existing page structure.")
    final_prompt_parts.append("If the visualization is simple and can be contained within a few primary DIVs or a single SVG/Canvas, prefer that. Avoid unnecessary wrapper elements.")
    final_prompt_parts.append("Structure the code clearly. You can embed CSS (within <style> tags) and JavaScript (within <script> tags) directly within the HTML output for simplicity, as it will be rendered via srcDoc in an iframe.")
    final_prompt_parts.append("The primary goal is a functional, illustrative, and engaging visual. Feel free to use your creative expertise to enhance the visual beyond the specific descriptions if it serves the educational goal, but adhere strictly to the request for no extraneous page elements and error-free code.")
    final_prompt_parts.append("Please ensure the output is a single, runnable code block. If you are providing HTML, it should be ready to be placed inside a <body> tag or directly into an iframe via srcDoc. Start the code block directly, for example, with a `<div>` or `<svg>` or `<canvas>` tag. Do not use markdown like ```html before the code, just provide the raw HTML snippet.")

    final_assembled_prompt = "\n\n".join(final_prompt_parts)
    
    return VisualPromptResponse(
        visual_generation_prompt=final_assembled_prompt,
        chosen_visual_type=internal_detailed_plan.visual_type_requested
        # intermediate_llm_results=sub_task_results # Optional: for debugging
    )

# --- FastAPI Router ---
router = APIRouter() # Removed prefix and tags

@router.post("/generate-final-prompt", response_model=VisualPromptResponse)
async def generate_final_prompt_endpoint(
    request: VisualPromptGeneratorRequest,
    gemini_llm_client: genai.GenerativeModel = Depends(get_gemini_client) # Use new dependency
):
    """
    Orchestrates the generation of a highly detailed visual prompt for a code-gen LLM using Gemini.
    1. Expands AnalyzerAgent output into a plan of LLM sub-tasks.
    2. Executes these sub-tasks to get detailed textual components.
    3. Assembles these components into a final comprehensive prompt.
    """
    if not request.analyzer_data or not request.original_user_text:
        raise HTTPException(status_code=400, detail="analyzer_data and original_user_text are required.")
    
    return await generate_visual_code_prompt_orchestrator(request, gemini_llm_client) 