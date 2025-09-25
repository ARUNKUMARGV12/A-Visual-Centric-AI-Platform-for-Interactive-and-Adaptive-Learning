import os
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.schema import SystemMessage, HumanMessage
import google.generativeai as genai
import json
from dotenv import load_dotenv

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

class PersonalizationAgent:
    """
    A personalization agent that learns from student interactions and provides
    tailored instructions to other agents on how to explain concepts.
    """
    
    def __init__(self, user_id: str, model_name: str = "gemini-2.0-flash"):
        """
        Initialize the PersonalizationAgent instance.

        Args:
            user_id: The user identifier
            model_name: The name of the LLM model to use
        """
        self.user_id = user_id
        self.model_name = model_name

        # Initialize Gemini client
        genai.configure(api_key=GEMINI_API_KEY)
        
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=GEMINI_API_KEY,
            temperature=0.7
        )

        # Load or create user profile
        self.user_profile = self._load_user_profile(user_id)
        logger.info(f"Loaded profile for user {user_id} with {self.user_profile['interactions_count']} interactions")

        self.memory = ConversationBufferMemory(
            memory_key="chat_history"
        )
        
        # Create the prompt for the personalization chain
        self.personalization_prompt = PromptTemplate(
            input_variables=["user_profile", "query", "chat_history"],
            template="""
            You are an advanced personalization agent that helps tailor educational content to students' specific needs and handles various types of user interactions.
            
            # Student Profile
            {user_profile}
            
            # Chat History
            {chat_history}
            
            # Current Query
            {query}
            
            First, analyze the query to determine if it's:
            1. A greeting or casual interaction (e.g., "hello", "how are you?", "what's your name?")
            2. A non-educational question (e.g., about yourself, the system, etc.)
            3. An educational query (about concepts, topics, etc.)
            
            For greetings/casual interactions:
            - Return a brief, friendly response
            - Include query_type: "greeting"
            
            For non-educational questions:
            - Return a brief, helpful response
            - Include query_type: "non_educational"
            
            For educational queries, provide detailed instructions on how to explain the concept effectively:
            - Include query_type: "educational"
            - What level of detail is appropriate (beginner, intermediate, advanced)
            - What learning style would be most effective (visual, textual, code examples, diagrams, etc.)
            - What aspects of the concept should be emphasized
            - Any past knowledge or gaps that should be addressed
            - How to connect this concept to previously understood ideas from the chat history
            - A tailored query that may improve the RAG system's response (reformulating the query to be more specific)
            
            Format your response as a JSON with different fields based on the query type:
            
            For greetings/casual:
            ```json
            {
                "query_type": "greeting",
                "response": "Brief response to the greeting or casual question"
            }
            ```
            
            For non-educational:
            ```json
            {
                "query_type": "non_educational",
                "response": "Brief answer to the non-educational question"
            }
            ```
            
            For educational:
            ```json
            {
                "query_type": "educational",
                "level": "beginner/intermediate/advanced",
                "learning_style": ["visual", "textual", "code_examples", "diagrams", "interactive"],
                "emphasis": ["aspects to emphasize"],
                "knowledge_gaps": ["concepts that may need reinforcement"],
                "connections": ["connections to previous concepts"],
                "tailored_instruction": "detailed instruction for explaining this concept",
                "tailored_query": "reformulated query that may improve RAG results"
            }
            ```
            
            Return ONLY the JSON object, nothing else.
            """
        )
        
        # Create the LLM chain
        self.chain = LLMChain(
            llm=self.llm,
            prompt=self.personalization_prompt,
            verbose=True,
            memory=self.memory
        )
        
    def _load_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Load a user's profile from storage, or create a new one if it doesn't exist.
        
        Args:
            user_id: The user identifier
            
        Returns:
            The user's profile data
        """
        profile_path = os.path.join("user_profiles", f"{user_id}.json")
        default_profile_path = os.path.join("user_profiles", "default.json")
        
        if os.path.exists(profile_path):
            # Load existing profile
            try:
                with open(profile_path, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error loading profile for {user_id}: {e}")
                # Fall back to default or create new
        
        # Try to load the default profile first
        if os.path.exists(default_profile_path):
            try:
                with open(default_profile_path, "r") as f:
                    default_profile = json.load(f)
                    logger.info(f"Creating new profile for user {user_id} based on default template")
                    # Clone the default profile for this user
                    default_profile["created_at"] = datetime.now().isoformat()
                    self._save_user_profile(user_id, default_profile)
                    return default_profile
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error loading default profile: {e}")
                # Fall back to creating a new profile
        
        # Create a new profile if no default exists or it couldn't be loaded
        logger.info(f"Creating new profile for user {user_id} from scratch")
        new_profile = {
            "created_at": datetime.now().isoformat(),
            "interactions_count": 0,
            "preferred_learning_styles": ["visual", "textual"],
            "skill_level": "beginner",
            "knowledge_areas": {},
            "strengths": [],
            "areas_for_improvement": [],
            "session_history": [],
            "topic_interests": [],
            "interaction_types": {
                "greeting": 0,
                "non_educational": 0,
                "educational": 0
            },
            "learning_patterns": {
                "avg_session_duration_minutes": 0,
                "preferred_time_of_day": "unknown",
                "engagement_metrics": {
                    "visual_content_engagement": 0,
                    "text_content_engagement": 0,
                    "interactive_content_engagement": 0
                }
            },
            "feedback": []
        }
        self._save_user_profile(user_id, new_profile)
        return new_profile
        
    def _save_user_profile(self, user_id: str, profile: Dict[str, Any]) -> None:
        """
        Save a user's profile to storage.
        
        Args:
            user_id: The user identifier
            profile: The profile data to save
        """
        # Ensure user_profiles directory exists
        os.makedirs("user_profiles", exist_ok=True)
        profile_path = os.path.join("user_profiles", f"{user_id}.json")
        
        try:
            with open(profile_path, "w") as f:
                json.dump(profile, f, indent=2)
            logger.info(f"Saved profile for user {user_id}")
        except IOError as e:
            logger.error(f"Error saving profile for {user_id}: {e}")
    
    def _update_profile_from_interaction(self, query: str, response: Dict[str, Any]) -> None:
        """
        Update the user profile based on the current interaction.
        
        Args:
            query: The user's query
            response: The agent's response
        """
        # Update interaction count
        self.user_profile["interactions_count"] += 1
        
        # Get query type from the response
        query_type = response.get("query_type", "educational")  # Default to educational
        
        # Add to session history
        session_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "query_type": query_type
        }
        
        # Update interaction type count
        if query_type in self.user_profile["interaction_types"]:
            self.user_profile["interaction_types"][query_type] += 1
        else:
            self.user_profile["interaction_types"][query_type] = 1
            
        # For educational queries, update additional profile information
        if query_type == "educational":
            topic = self._infer_topic(query)
            
            # Add to session entry
            session_entry["topic"] = topic
            
            # Update knowledge areas
            if topic not in self.user_profile["knowledge_areas"]:
                self.user_profile["knowledge_areas"][topic] = {
                    "interactions": 1,
                    "last_interaction": datetime.now().isoformat(),
                    "estimated_skill": "beginner"
                }
            else:
                self.user_profile["knowledge_areas"][topic]["interactions"] += 1
                self.user_profile["knowledge_areas"][topic]["last_interaction"] = datetime.now().isoformat()
                
            # Add to topic interests if not already there
            if topic not in self.user_profile["topic_interests"]:
                self.user_profile["topic_interests"].append(topic)
                
        # Add session entry to history (limited to last 100 entries)
        self.user_profile["session_history"].append(session_entry)
        if len(self.user_profile["session_history"]) > 100:
            self.user_profile["session_history"] = self.user_profile["session_history"][-100:]
            
        # Save the updated profile
        self._save_user_profile(self.user_id, self.user_profile)
        
    def _infer_topic(self, query: str) -> str:
        """
        Infer the educational topic from the user's query.
        
        Args:
            query: The user's query
            
        Returns:
            The inferred topic
        """
        # A more sophisticated implementation would use NLP or the LLM to extract topics
        # This is a simplified placeholder implementation
        if "python" in query.lower():
            return "python"
        elif "javascript" in query.lower() or "js" in query.lower():
            return "javascript"
        elif "math" in query.lower() or "calculus" in query.lower():
            return "mathematics"
        elif "history" in query.lower():
            return "history"
        elif "physics" in query.lower():
            return "physics"
        elif "chemistry" in query.lower():
            return "chemistry"
        elif "biology" in query.lower():
            return "biology"
        else:
            return "general"
    
    def _is_greeting_or_casual(self, query: str) -> bool:
        """Simple heuristic to identify greetings or casual interactions"""
        greetings = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
                    "good evening", "how are you", "what's up"]
        query_lower = query.lower()
        return any(greeting in query_lower for greeting in greetings)
    
    def _is_non_educational(self, query: str) -> bool:
        """Simple heuristic to identify non-educational questions"""
        non_educational = ["your name", "who are you", "what can you do", "help me", 
                          "created you", "made you", "about you", "how do you work"]
        query_lower = query.lower()
        return any(term in query_lower for term in non_educational)
    
    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a user query and return personalization information.
        
        Args:
            query: The user's query
            
        Returns:
            A dictionary containing personalization data and response instructions
        """
        logger.info(f"Processing query for personalization: {query}")
        
        # Simple pre-processing to quickly identify query type
        if self._is_greeting_or_casual(query):
            logger.info(f"Identified greeting: {query}")
            response = {
                "query_type": "greeting",
                "response": f"Hello! How can I help with your learning today?"
            }
            self._update_profile_from_interaction(query, response)
            return response
            
        if self._is_non_educational(query):
            logger.info(f"Identified non-educational query: {query}")
            response = {
                "query_type": "non_educational",
                "response": "I'm your AI learning assistant, designed to help you understand educational concepts in a personalized way."
            }
            self._update_profile_from_interaction(query, response)
            return response
        
        # For more complex queries, use the LLM chain
        try:
            chain_response = self.chain.run(
                user_profile=json.dumps(self.user_profile, indent=2),
                query=query
            )
            
            # Parse the response (it should be a JSON string)
            try:
                parsed_response = json.loads(chain_response)
                logger.info(f"LLM chain response: {parsed_response}")
                
                # Update user profile based on this interaction
                self._update_profile_from_interaction(query, parsed_response)
                
                return parsed_response
            except json.JSONDecodeError:
                # If parsing fails, return a basic response
                logger.error(f"Failed to parse LLM chain response as JSON: {chain_response}")
                basic_response = {
                    "query_type": "educational",
                    "level": self.user_profile["skill_level"],
                    "learning_style": self.user_profile["preferred_learning_styles"],
                    "tailored_instruction": "Explain this concept clearly with examples.",
                    "tailored_query": query
                }
                
                # Still update the profile
                self._update_profile_from_interaction(query, basic_response)
                
                return basic_response
                
        except Exception as e:
            logger.error(f"Error running personalization LLM chain: {e}")
            # Return a basic personalized response based on what we know about the user
            basic_response = {
                "query_type": "educational",
                "level": self.user_profile["skill_level"],
                "learning_style": self.user_profile["preferred_learning_styles"],
                "tailored_instruction": "Explain this concept clearly with examples.",
                "tailored_query": query
            }
            
            # Still update the profile
            self._update_profile_from_interaction(query, basic_response)
            
            return basic_response
    
    def provide_feedback(self, query: str, was_helpful: bool, feedback: str = None) -> None:
        """
        Record user feedback on a response to improve future personalization.
        
        Args:
            query: The original query
            was_helpful: Whether the response was helpful
            feedback: Optional feedback text
        """
        # Add feedback to the user profile
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "was_helpful": was_helpful,
            "feedback_text": feedback
        }
        
        self.user_profile["feedback"].append(feedback_entry)
        
        # Limit the feedback history to the last 100 entries
        if len(self.user_profile["feedback"]) > 100:
            self.user_profile["feedback"] = self.user_profile["feedback"][-100:]
        
        # Update some learning metrics based on feedback
        if not was_helpful:
            topic = self._infer_topic(query)
            if topic in self.user_profile["knowledge_areas"]:
                # If the response about a topic wasn't helpful, we may need to adjust our
                # understanding of the user's skill level for that topic
                # This is a simplified approach - a more sophisticated agent would use more factors
                if self.user_profile["knowledge_areas"][topic]["estimated_skill"] != "beginner":
                    self.user_profile["knowledge_areas"][topic]["estimated_skill"] = "beginner"
            
            # Add to areas for improvement if not already there
            if topic not in self.user_profile["areas_for_improvement"]:
                self.user_profile["areas_for_improvement"].append(topic)
                
        # Save the updated profile
        self._save_user_profile(self.user_id, self.user_profile) 