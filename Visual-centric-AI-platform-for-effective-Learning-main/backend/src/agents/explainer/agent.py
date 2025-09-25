import os
import json
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import HTTPException

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Gemini API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

class ExplainerAgent:
    """
    Agent that generates personalized explanations for educational topics and suggests
    relevant visualizations based on the topic and personalization data.
    """
    
    def __init__(self, model_name: str = "gemini-2.0-flash"):
        """
        Initialize the ExplainerAgent instance.
        
        Args:
            model_name: Name of the Gemini model to use
        """
        self.model_name = model_name
        
        try:
            self.gemini_client = genai.GenerativeModel(model_name)
            logger.info(f"ExplainerAgent initialized with {model_name} model")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            self.gemini_client = None
    
    async def explain_topic(self, topic: str, personalization_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a personalized explanation for a topic and suggest relevant visualizations.
        
        Args:
            topic: The topic/concept to explain
            personalization_data: Personalization data from the personalization agent
            
        Returns:
            Dictionary with explanation and suggested visualization methods
        """
        if self.gemini_client is None:
            logger.error("Gemini client not initialized.")
            raise HTTPException(status_code=503, detail="LLM service (Gemini) not available")
        
        # Create personalization instructions based on provided data
        personalization_instructions = self._create_personalization_instructions(personalization_data)
        
        # Define valid visualization types
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

        # Create the prompt for Gemini
        prompt = (
            f"You are an expert AI educational assistant. Your primary goal is to explain a topic to a student and then suggest relevant ways to visualize that explanation.\n\n"
            f"PERSONALIZATION INSTRUCTIONS:\n{personalization_instructions}\n\n"
            f"User's Topic/Request: {topic}\n\n"
            f"--------------------\n"
            f"REFERENCE - VALID VISUALIZATION CATEGORIES:\n"
            f"{valid_visual_types_context}\n"
            f"--------------------\n\n"
            f"INSTRUCTIONS:\n\n"
            f"PART 1: GENERATE THE EXPLANATION\n"
            f"First, provide a clear, comprehensive, and easy-to-understand explanation of the User's Topic/Request. "
            f"This explanation should be tailored based on the PERSONALIZATION INSTRUCTIONS above. "
            f"Consider any specific questions or desired formats mentioned in the user's request while formulating your explanation, "
            f"but ensure the textual explanation itself is complete before you think about visuals.\n\n"
            f"PART 2: ANALYZE AND SUGGEST VISUALIZATIONS\n"
            f"After you have constructed the full explanation in PART 1, critically review THE EXPLANATION YOU JUST WROTE. "
            f"Also, re-examine the User's Topic/Request for any explicit visual preferences (e.g., 'can you give me a flowchart', 'simulate this', 'show a diagram').\n"
            f"Based on your analysis of YOUR OWN EXPLANATION and any user preferences, suggest 2-3 distinct visualization methods that would effectively help a student understand the explanation. \n"
            f"   - Your suggestions should align with or be examples of the REFERENCE - VALID VISUALIZATION CATEGORIES provided above. \n"
            f"   - If the user requested a specific type of visual (e.g., flowchart, simulation), one of your suggestions should address this directly if it's appropriate for the topic explained.\n"
            f"   - The names of your suggested methods should be descriptive (e.g., 'Interactive Flowchart of React Learning Path', 'Animated Diagram of Photosynthesis').\n\n"
            f"PART 3: FORMAT YOUR OUTPUT\n"
            f"Present your entire response as follows:\n"
            f"1. The full textual explanation generated in PART 1.\n"
            f"2. Followed IMMEDIATELY by the visualization suggestions formatted as a JSON array of strings, enclosed in specific markers. Example:\n"
            f"   ---JSON_VISUAL_SUGGESTIONS_START--- \n"
            f'   ["Interactive Timeline of Roman History", "Concept Map of Key Roman Emperors", "3D Model of the Colosseum"] \n'
            f"   ---JSON_VISUAL_SUGGESTIONS_END--- \n"
            f"   It is absolutely crucial that you include this JSON block with the start and end markers. If, after careful consideration, no visualization methods are suitable for the explanation, provide an empty array [] within the markers.\n\n"
            f"Final Output Structure:\n"
            f"[Your Explanation Text from PART 1]\n"
            f"---JSON_VISUAL_SUGGESTIONS_START---\n"
            f"[JSON array of string suggestions or an empty array []]\n"
            f"---JSON_VISUAL_SUGGESTIONS_END---\n"
        )

        try:
            # Generate content using Gemini
            logger.info(f"Generating explanation for topic: {topic}")
            response = await self.gemini_client.generate_content_async(
                prompt,
                generation_config={
                    "max_output_tokens": 10240,
                    "temperature": 0.8,
                    "top_p": 0.1
                }
            )
            
            # Extract text from response
            full_text_response = ""
            if hasattr(response, 'parts') and response.parts:
                full_text_response = ' '.join(part.text for part in response.parts if hasattr(part, 'text'))
            elif hasattr(response, 'text') and response.text:
                full_text_response = response.text
            else:
                logger.error(f"No text found in Gemini response for topic: {topic}")
                raise HTTPException(status_code=500, detail="Failed to get a valid response from LLM.")

            # Handle empty responses
            if not full_text_response.strip():
                logger.warning(f"LLM returned an empty response for topic: {topic}")
                return {
                    "explanation": "I couldn't generate specific information for this topic at the moment.",
                    "suggested_visual_methods": []
                }

            # Parse the response to extract explanation and visual suggestions
            explanation_text = full_text_response  # Default to full response
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
                                logger.warning(f"Parsed JSON for suggestions is not a list of strings for topic: {topic}. JSON string: '{json_str}'")
                        except json.JSONDecodeError as je:
                            logger.warning(f"Failed to decode JSON for suggestions: {je}. JSON string: '{json_str}' for topic: {topic}")
                else: 
                    logger.warning(f"Could not find JSON suggestion markers for topic: {topic}. The entire response will be treated as explanation.")
                    explanation_text = full_text_response.strip()  # Ensure it's clean

            except Exception as e:
                logger.error(f"Error during parsing of LLM response: {e} for topic: {topic}", exc_info=True)
                explanation_text = full_text_response.strip()
                suggested_methods = []

            # If explanation text became empty after attempting to extract JSON, but full response wasn't, use full response.
            if not explanation_text.strip() and full_text_response.strip():
                logger.warning(f"Explanation text ended up empty after parsing, but full response was not. Using full response for explanation. Topic: {topic}")
                explanation_text = full_text_response.strip()

            # Final check for truly empty explanation
            if not explanation_text.strip():
                explanation_text = "Could not generate a clear explanation for this topic. Please try rephrasing."

            logger.info(f"Successfully generated explanation for topic: {topic}. Suggested {len(suggested_methods)} visualization methods.")
            return {
                "explanation": explanation_text,
                "suggested_visual_methods": suggested_methods
            }

        except Exception as e:
            logger.error(f"Error generating explanation for topic {topic}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")

    def _create_personalization_instructions(self, personalization_data: Dict[str, Any] = None) -> str:
        """
        Create personalization instructions based on the personalization data.
        
        Args:
            personalization_data: Personalization data from the personalization agent
            
        Returns:
            A string containing personalization instructions
        """
        if not personalization_data:
            return "Provide a clear and general explanation suitable for a beginner audience."
            
        # Determine the level
        level = personalization_data.get("level", "beginner")
        
        # Get learning styles
        learning_styles = personalization_data.get("learning_style", ["visual", "textual"])
        learning_style_str = ", ".join(learning_styles)
        
        # Get emphasis areas
        emphasis = personalization_data.get("emphasis", [])
        emphasis_str = ""
        if emphasis:
            emphasis_str = "Emphasize the following aspects: " + ", ".join(emphasis) + "."
            
        # Get knowledge gaps
        knowledge_gaps = personalization_data.get("knowledge_gaps", [])
        gaps_str = ""
        if knowledge_gaps:
            gaps_str = "Address these potential knowledge gaps: " + ", ".join(knowledge_gaps) + "."
            
        # Get connections to previous concepts
        connections = personalization_data.get("connections", [])
        connections_str = ""
        if connections:
            connections_str = "Connect the explanation to these previously understood concepts: " + ", ".join(connections) + "."
            
        # Get tailored instruction if available
        tailored_instruction = personalization_data.get("tailored_instruction", "")
        
        # Build the personalization instructions
        personalization_instructions = (
            f"Create a {level}-level explanation that primarily uses {learning_style_str} approaches. {emphasis_str} {gaps_str} {connections_str}"
            f"\n\n{tailored_instruction}"
        ).strip()
        
        return personalization_instructions 