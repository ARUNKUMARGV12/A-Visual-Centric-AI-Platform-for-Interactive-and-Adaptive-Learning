import os
from typing import Dict, Any, List, Optional
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
import google.generativeai as genai
import json

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

class ExplanationService:
    """
    Service that generates personalized explanations based on instructions from the personalization agent.
    """

    def __init__(self, model_name: str = "gemini-2.0-flash"):
        """
        Initialize the explanation service.

        Args:
            model_name: Name of the Gemini model to use
        """
        self.model_name = model_name
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=GEMINI_API_KEY,
            temperature=0.7
        )

        # Create the prompt for explanations
        self.explanation_prompt = PromptTemplate(
            input_variables=["concept", "personalization_instructions"],
            template="""
            You are an expert educational AI assistant that provides personalized explanations to students.

            # Personalization Instructions
            {personalization_instructions}

            # Concept to Explain
            {concept}

            Based on the personalization instructions above, provide a tailored explanation of the concept.
            Your explanation should:
            1. Match the specified level (beginner/intermediate/advanced)
            2. Use the preferred learning styles
            3. Emphasize the aspects mentioned in the instructions
            4. Address any knowledge gaps
            5. Make connections to previously understood concepts

            Format your response in a clear, engaging way. If visual learning is preferred, describe diagrams or
            visualizations in detail (these will be generated separately). If code examples are preferred, include
            them with proper formatting and comments.

            Remember: The goal is to provide an explanation that is specifically tailored to this student's needs and preferences.
            """
        )

        # Create the visual specification prompt
        self.visual_prompt = PromptTemplate(
            input_variables=["concept", "explanation", "personalization_instructions"],
            template="""
            You are an expert educational AI assistant that creates specifications for visualizations to accompany explanations.

            # Personalization Instructions
            {personalization_instructions}

            # Concept
            {concept}

            # Explanation
            {explanation}

            Based on the concept, explanation, and personalization instructions, create a detailed specification for
            a visualization that would help the student understand the concept better.

            Your specification should include:
            1. The type of visualization (diagram, chart, animation, etc.)
            2. The key elements to include
            3. How the elements relate to each other
            4. Any labels or annotations needed
            5. Any interactive elements that would be helpful

            Format your response as a JSON object with the following structure:
            {{
                "visualization_type": "The type of visualization",
                "title": "A descriptive title for the visualization",
                "elements": [
                    {{
                        "name": "Name of element 1",
                        "description": "Description of element 1",
                        "position": "Position or relationship to other elements"
                    }},
                    ...
                ],
                "annotations": [
                    {{
                        "text": "Text of annotation 1",
                        "target": "Element or area being annotated",
                        "importance": "high/medium/low"
                    }},
                    ...
                ],
                "interactive_elements": [
                    {{
                        "name": "Name of interactive element 1",
                        "description": "Description of what it does",
                        "purpose": "Educational purpose of this interaction"
                    }},
                    ...
                ]
            }}
            """
        )        # Create runnable sequences for explanations and visuals
        from langchain.schema.runnable import RunnablePassthrough
        
        self.explanation_chain = (
            {"prompt": RunnablePassthrough()} 
            | self.explanation_prompt 
            | self.llm
        )
        
        self.visual_chain = (
            {"prompt": RunnablePassthrough()} 
            | self.visual_prompt 
            | self.llm
        )
    
    def _create_personalization_instructions(self, personalization_data: Dict[str, Any]) -> str:
        """
        Create personalization instructions based on the personalization data.
        
        Args:
            personalization_data: Personalization data from the personalization agent
            
        Returns:
            A string containing personalization instructions
        """
        personalization_details = []
        
        # Add level information
        level = personalization_data.get("level", "beginner")
        personalization_details.append(f"Level: {level}")
        
        # Add learning style information
        learning_styles = personalization_data.get("learning_style", ["visual", "textual"])
        personalization_details.append(f"Preferred learning styles: {', '.join(learning_styles)}")
        
        # Add emphasis areas
        emphasis = personalization_data.get("emphasis", [])
        if emphasis:
            personalization_details.append(f"Emphasize these aspects: {', '.join(emphasis)}")
            
        # Add knowledge gaps
        knowledge_gaps = personalization_data.get("knowledge_gaps", [])
        if knowledge_gaps:
            personalization_details.append(f"Address these knowledge gaps: {', '.join(knowledge_gaps)}")
            
        # Add connections to previous concepts
        connections = personalization_data.get("connections", [])
        if connections:
            personalization_details.append(f"Connect to these previously understood concepts: {', '.join(connections)}")
            
        # Add tailored instruction if available
        tailored_instruction = personalization_data.get("tailored_instruction", "")
        if tailored_instruction:
            personalization_details.append(f"Specific instruction: {tailored_instruction}")
            
        return "\n".join(personalization_details)
        
    async def generate_explanation(self, concept: str, personalization_data: Dict[str, Any]) -> str:
        """
        Generate a personalized explanation for a concept.
        
        Args:
            concept: The concept to explain
            personalization_data: Personalization data from the personalization agent
            
        Returns:
            A personalized explanation of the concept
        """
        try:
            logger.info(f"Generating explanation for concept: '{concept}'")
            
            # Create personalization instructions
            personalization_instructions = self._create_personalization_instructions(personalization_data)
            
            # Generate the explanation
            explanation = self.explanation_chain.run(
                concept=concept,
                personalization_instructions=personalization_instructions
            )
            
            logger.info(f"Generated explanation for '{concept}' (first 100 chars): {explanation[:100]}...")
            return explanation
            
        except Exception as e:
            logger.error(f"Error generating explanation for '{concept}': {e}")
            return f"I apologize, but I couldn't generate an explanation for {concept} at this time. Please try again later."
            
    async def generate_visual_specification(self, concept: str, explanation: str, personalization_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a specification for a visualization to accompany an explanation.
        
        Args:
            concept: The concept being explained
            explanation: The explanation of the concept
            personalization_data: Personalization data from the personalization agent
            
        Returns:
            A specification for a visualization
        """
        try:
            logger.info(f"Generating visual specification for concept: '{concept}'")
            
            # Create personalization instructions
            personalization_instructions = self._create_personalization_instructions(personalization_data)
            
            # Generate the visual specification
            visual_spec_json = self.visual_chain.run(
                concept=concept,
                explanation=explanation,
                personalization_instructions=personalization_instructions
            )
            
            # Parse the JSON
            try:
                visual_spec = json.loads(visual_spec_json)
                logger.info(f"Generated visual specification for '{concept}'")
                return visual_spec
            except json.JSONDecodeError:
                logger.error(f"Error parsing visual specification JSON: {visual_spec_json}")
                return {
                    "error": "Failed to parse visual specification",
                    "visualization_type": "text",
                    "title": f"Visualization for {concept}",
                    "elements": [
                        {
                            "name": "Error message",
                            "description": "There was an error generating the visualization specification.",
                            "position": "center"
                        }
                    ]
                }
            
        except Exception as e:
            logger.error(f"Error generating visual specification for '{concept}': {e}")
            return {
                "error": str(e),
                "visualization_type": "text",
                "title": f"Visualization for {concept}",
                "elements": [
                    {
                        "name": "Error message",
                        "description": f"There was an error generating the visualization: {str(e)}",
                        "position": "center"
                    }
                ]
            } 