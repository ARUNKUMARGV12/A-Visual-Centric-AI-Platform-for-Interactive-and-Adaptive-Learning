import json
import logging

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

# Configure logging
logger = logging.getLogger(__name__)

# Pydantic models for the Explainer Agent
class ExplainTopicRequest(BaseModel):
    user_text: str
    include_related_questions: bool = True
    user_context: dict = None  # Add user context for personalization

class ExplanationAndSuggestionsResponse(BaseModel):
    explanation: str
    suggested_visual_methods: list[str]

router = APIRouter()

def get_gemini_client(request: Request) -> genai.GenerativeModel:
    """Dependency to get the Gemini client from app state."""
    gemini_client = getattr(request.app.state, 'gemini_client', None)
    if not gemini_client:
        logger.error("Gemini client not found on app.state for explainer_agent.")
        raise HTTPException(status_code=503, detail="LLM service (Gemini) not available.")
    return gemini_client

@router.post("/explain-topic", response_model=ExplanationAndSuggestionsResponse)
async def explain_topic_endpoint(
    req_body: ExplainTopicRequest,
    gemini_client: genai.GenerativeModel = Depends(get_gemini_client)
):
    logger.info(f"Explainer Agent: Received request to explain topic: {req_body.user_text}")

    valid_visual_types_context = (
        "Valid Visualization Types for Reference:\n"
        "1. interactive_simulation - For dynamic systems, processes, or algorithms.\n"
        "2. animated_diagram - For showing changes over time, flows, or complex static diagrams with sequential explanations.\n"
        "3. static_image_with_annotations - For clear, labeled diagrams, schematics, or concept illustrations.\n"
        "4. step_by_step_process - For breaking down a procedure into visual steps.\n"
        "5. data_visualization - For representing data, trends, or comparisons (e.g., plots, charts, graphs).\n"
        "6. concept_map - For illustrating relationships between concepts or ideas.\n"
        "7. code_walkthrough_animation - For visually explaining code snippets, execution flow, or data changes.\n"
        "8. 3d_visualization - For spatial, structural, or volumetric concepts.\n"
        "9. timeline_visualization - For chronological data or project evolution.\n"
        "10. network_visualization - For systems represented as nodes and edges.\n"
    )

    # Build personalization instructions based on user context
    personalization_instructions = ""
    if req_body.user_context:
        user_profile = req_body.user_context.get('user', {})
        learning_style = user_profile.get('learningStyle', 'unknown')
        skill_level = user_profile.get('skillLevel', 'beginner')
        preferred_difficulty = user_profile.get('preferredDifficulty', 'medium')
        
        personalization_instructions = f"\n\nPERSONALIZATION CONTEXT:\n"
        personalization_instructions += f"- User's Learning Style: {learning_style}\n"
        personalization_instructions += f"- User's Skill Level: {skill_level}\n"
        personalization_instructions += f"- Preferred Difficulty: {preferred_difficulty}\n"
        
        if learning_style == 'visual':
            personalization_instructions += "- Adapt explanation to be more visual-friendly with emphasis on diagrams and examples\n"
        elif learning_style == 'auditory':
            personalization_instructions += "- Use clear, step-by-step verbal explanations suitable for reading aloud\n"
        elif learning_style == 'kinesthetic':
            personalization_instructions += "- Focus on hands-on examples and practical applications\n"
        
        if skill_level == 'beginner':
            personalization_instructions += "- Explain from basics, avoid jargon, use simple analogies\n"
        elif skill_level == 'intermediate':
            personalization_instructions += "- Include moderate complexity with practical applications\n"
        elif skill_level == 'advanced':
            personalization_instructions += "- Focus on advanced concepts and best practices\n"
        
        recent_topics = user_profile.get('recentTopics', [])
        if recent_topics:
            personalization_instructions += f"- Build upon recent topics: {', '.join(recent_topics[:3])}\n"

    prompt = (
        f"You are an expert AI assistant. Your primary goal is to explain a topic to a student and then suggest relevant ways to visualize that explanation.\\n\\n"
        f"User's Topic/Request: {req_body.user_text}\\n\\n"
        f"{personalization_instructions}"
        f"--------------------\\n"
        f"REFERENCE - VALID VISUALIZATION CATEGORIES:\\n"
        f"{valid_visual_types_context}\\n"
        f"--------------------\\n\\n"
        f"INSTRUCTIONS:\\n\\n"
        f"PART 1: GENERATE THE EXPLANATION\\n"
        f"First, provide a clear, comprehensive, and easy-to-understand explanation of the User's Topic/Request. This explanation is for a student and should be suitable for someone learning about the topic for the first time. Consider any specific questions or desired formats (like 'flowchart') mentioned in the user's request while formulating your explanation, but ensure the textual explanation itself is complete before you think about visuals.\\n\\n"
        f"PART 2: ANALYZE AND SUGGEST VISUALIZATIONS\\n"
        f"After you have constructed the full explanation in PART 1, critically review THE EXPLANATION YOU JUST WROTE. Also, re-examine the User's Topic/Request for any explicit visual preferences (e.g., 'can you give me a flowchart', 'simulate this', 'show a diagram').\\n"
        f"Based on your analysis of YOUR OWN EXPLANATION and any user preferences, suggest 2-3 distinct visualization methods that would effectively help a student understand the explanation. \\n"
        f"   - Your suggestions should align with or be examples of the REFERENCE - VALID VISUALIZATION CATEGORIES provided above. \\n"
        f"   - If the user requested a specific type of visual (e.g., flowchart, simulation), one of your suggestions should address this directly if it's appropriate for the topic explained.\\n"
        f"   - The names of your suggested methods should be descriptive (e.g., 'Interactive Flowchart of React Learning Path', 'Animated Diagram of Photosynthesis').\\n\\n"
        f"PART 3: FORMAT YOUR OUTPUT\\n"
        f"Present your entire response as follows:\\n"
        f"1. The full textual explanation generated in PART 1.\\n"
        f"2. Followed IMMEDIATELY by the visualization suggestions formatted as a JSON array of strings, enclosed in specific markers. Example:\\n"
        f"   ---JSON_VISUAL_SUGGESTIONS_START--- \\n"
        f'   ["Interactive Timeline of Roman History", "Concept Map of Key Roman Emperors", "3D Model of the Colosseum"] \\n'
        f"   ---JSON_VISUAL_SUGGESTIONS_END--- \\n"
        f"   It is absolutely crucial that you include this JSON block with the start and end markers. If, after careful consideration, no visualization methods are suitable for the explanation, provide an empty array [] within the markers.\\n\\n"
        f"Final Output Structure:\\n"
        f"[Your Explanation Text from PART 1]\\n"
        f"---JSON_VISUAL_SUGGESTIONS_START---\\n"
        f"[JSON array of string suggestions or an empty array []]\\n"
        f"---JSON_VISUAL_SUGGESTIONS_END---\\n"
    )

    try:
        response = await gemini_client.generate_content_async(prompt)
        
        full_text_response = ""
        if hasattr(response, 'parts') and response.parts:
            full_text_response = ' '.join(part.text for part in response.parts if hasattr(part, 'text'))
        elif hasattr(response, 'text') and response.text:
             full_text_response = response.text
        else:
            logger.error(f"No text found in Gemini response for topic: {req_body.user_text}. Response: {response}")
            raise HTTPException(status_code=500, detail="Failed to get a valid response from LLM.")

        if not full_text_response.strip():
            logger.warning(f"LLM returned an empty response for topic: {req_body.user_text}")
            return ExplanationAndSuggestionsResponse(explanation="I couldn't generate specific information for this topic at the moment.", suggested_visual_methods=[])

        # --- Parse the response ---
        explanation_text = full_text_response # Default to full response
        suggested_methods = []

        try:
            # Attempt to extract JSON block for suggestions
            start_marker = "---JSON_VISUAL_SUGGESTIONS_START---"
            end_marker = "---JSON_VISUAL_SUGGESTIONS_END---"
            
            start_index = full_text_response.find(start_marker)
            end_index = full_text_response.find(end_marker)

            if start_index != -1 and end_index != -1 and start_index < end_index:
                # The explanation is everything BEFORE the start_marker
                explanation_text = full_text_response[:start_index].strip()
                
                json_str_start = start_index + len(start_marker)
                json_str = full_text_response[json_str_start:end_index].strip()
                
                if json_str:
                    try:
                        parsed_methods = json.loads(json_str)
                        if isinstance(parsed_methods, list) and all(isinstance(item, str) for item in parsed_methods):
                            suggested_methods = parsed_methods
                        else:
                            logger.warning(f"Parsed JSON for suggestions is not a list of strings for topic: {req_body.user_text}. JSON string: '{json_str}'")
                    except json.JSONDecodeError as je:
                        logger.warning(f"Failed to decode JSON for suggestions: {je}. JSON string: '{json_str}' for topic: {req_body.user_text}")
            else: 
                logger.warning(f"Could not find JSON suggestion markers for topic: {req_body.user_text}. The entire response will be treated as explanation. Full response: {full_text_response}")
                explanation_text = full_text_response.strip() # Ensure it's clean

        except Exception as e:
            logger.error(f"Error during parsing of LLM response: {e} for topic: {req_body.user_text}. Full response: {full_text_response}", exc_info=True)
            explanation_text = full_text_response.strip()
            suggested_methods = []

        # If explanation text became empty after attempting to extract JSON, but full response wasn't, use full response.
        if not explanation_text.strip() and full_text_response.strip():
            logger.warning(f"Explanation text ended up empty after parsing, but full response was not. Using full response for explanation. Topic: {req_body.user_text}")
            explanation_text = full_text_response.strip()

        # Final check for truly empty explanation
        if not explanation_text.strip():
             explanation_text = "Could not generate a clear explanation for this topic. Please try rephrasing."

        logger.info(f"Explainer Agent: Successfully processed explanation and suggestions for topic: {req_body.user_text}. Methods: {suggested_methods}")
        return ExplanationAndSuggestionsResponse(explanation=explanation_text, suggested_visual_methods=suggested_methods)

    except HTTPException as he:
        raise he # Re-raise HTTPException
    except Exception as e:
        logger.error(f"Explainer Agent: Error calling Gemini API for topic {req_body.user_text}: {e}", exc_info=True)
        if "429" in str(e): # Simplistic check for rate limit
            raise HTTPException(status_code=429, detail="LLM service is currently busy. Please try again later.")
        raise HTTPException(status_code=500, detail=f"An error occurred while generating the explanation: {str(e)}") 