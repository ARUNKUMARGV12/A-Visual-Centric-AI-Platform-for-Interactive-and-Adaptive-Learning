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
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase environment variables not set")
    raise ValueError("Supabase environment variables not set")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
        
        # If profile loading fails, create a default profile
        if self.user_profile is None:
            logger.warning(f"Failed to load profile for {user_id}, using default profile")
            self.user_profile = self._get_default_profile(user_id)
        
        logger.info(f"Loaded profile for user {user_id} with {self.user_profile.get('interactions_count', 0)} interactions")

        self.memory = ConversationBufferMemory(
            memory_key="chat_history"
        )
        
        # Create the prompt for the personalization chain
        self.personalization_prompt = PromptTemplate(
            input_variables=["user_profile", "query", "chat_history"],
            template="""
You are an advanced personalization agent that creates ENGAGING, FRIENDLY greetings and personalized educational responses for students.

# Student Profile
{user_profile}

# Chat History
{chat_history}

# Current Query
{query}

## CRITICAL REQUIREMENT: For ALL educational queries, you MUST generate a warm, personalized greeting!

Analyze the query to determine its type:

### 1. Greeting/Casual Interactions
Examples: "hello", "how are you?", "what's your name?", "hi there!"
Response: Brief, friendly acknowledgment

### 2. Profile/Memory Questions  
Examples: "what do you know about me?", "tell me about my profile", "what's in your memory?"
Response: Detailed profile summary with personalized insights

### 3. Non-Educational Questions
Examples: "what are you?", "how do you work?", "who created you?"
Response: Brief, helpful system information

### 4. Educational Queries (MOST IMPORTANT)
Examples: "explain machine learning", "what is Python?", "how does TCP/IP work?", "tell me about algorithms"

**For EVERY educational query, you MUST:**
- Generate a warm, personalized greeting that acknowledges the user and topic
- Make it contextual to their learning level and interests
- Vary the greeting style to avoid repetition
- Be encouraging and enthusiastic about learning

## GREETING EXAMPLES (Use these as inspiration, create new variations):

### For Beginners:
- "Hey there! I'm excited to help you discover the fascinating world of [topic]!"
- "Great question! Let's explore [topic] together - I think you'll find it really interesting!"
- "I love that you're curious about [topic]! Let me break it down in a way that's easy to understand."
- "Perfect timing to learn about [topic]! This is such a fundamental concept that will really help you."

### For Follow-up Questions:
- "I see you're diving deeper into [topic] - that's awesome! Let me expand on that."
- "Building on what we discussed, let's explore [specific aspect] now!"
- "Great follow-up question! This shows you're really thinking about [topic]."
- "I'm glad you're continuing to explore this - let's take it to the next level!"

### For Different Topics:
- **Programming**: "Ready to code? Let's unlock the power of [language/concept]!"
- **Science**: "Science time! Let's discover how [concept] works in our world!"
- **Math**: "Numbers tell amazing stories! Let me show you the beauty of [concept]."
- **Technology**: "Tech is incredible! Let's explore how [technology] is changing the world."

### Enthusiasm Variations:
- "This is such an interesting topic!"
- "I see you're exploring..."
- "Let's dive into..."
- "Great choice diving into..."
- "I love that you're curious about..."
- "Perfect timing to learn about..."
- "What an exciting question about..."
- "You've picked a fascinating topic..."

## JSON Response Format:

For educational queries:
{{
  "query_type": "educational",
  "level": "beginner/intermediate/advanced",
  "learning_style": ["visual", "textual", "code_examples", "diagrams", "interactive"],
  "emphasis": ["key concepts to highlight"],
  "knowledge_gaps": ["prerequisites that might need reinforcement"],
  "connections": ["links to previous topics or concepts"],
  "tailored_instruction": "Specific guidance for explaining this concept effectively",
  "tailored_query": "Enhanced query for better RAG results",
  "personalized_greeting": "REQUIRED: A warm, engaging, contextual greeting that starts the response. Must be unique and personalized based on user profile, topic, and interaction history. Examples: Hey there! Ready to explore machine learning? or Great question about Python! Let's dive into this powerful language together! Make it natural, encouraging, and topic-specific."
}}

For other query types:
{{
    "query_type": "greeting/non_educational/profile_query",
    "response": "Appropriate response for the query type"
}}

**REMEMBER: NEVER return an educational response without a personalized_greeting field. It is MANDATORY!**

Return ONLY the JSON object, nothing else.
"""
        )
        
        # Create the LLM chain with proper input variables
        self.chain = LLMChain(
            llm=self.llm,
            prompt=self.personalization_prompt,
            verbose=True
        )
        
    def _load_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a user's profile from Supabase, or create a new one if it doesn't exist.

        Args:
            user_id: The user identifier

        Returns:
            The user's profile data
        """
        try:
            response = supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()

            if response.data:
                logger.info(f"Profile loaded for {user_id}")
                return response.data
            else:
                logger.info(f"Profile not found for {user_id}, creating new.")
                return self._create_new_user_profile(user_id)
        except Exception as e:
            logger.error(f"Error loading profile for {user_id}: {e}")
            return None
    
    def _get_default_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get a default profile for a user (in-memory, doesn't save to database).
        
        Args:
            user_id: The user identifier
            
        Returns:
            A default user profile dictionary
        """
        return {
            "user_id": user_id,
            "email": user_id if '@' in user_id else f"{user_id}@guest.com",
            "name": user_id.split('@')[0] if '@' in user_id else "User",
            "skill_level": "beginner",
            "preferred_learning_styles": ["visual", "textual"],
            "knowledge_areas": {},
            "learning_preferences": {
                "style": "visual",
                "pace": "normal",
                "confidence": 0.5
            },
            "goals": [],
            "weak_topics": [],
            "total_interactions": 0,
            "interactions_count": 0,
            "interaction_types": {
                "educational": 0,
                "greeting": 0,
                "non_educational": 0
            },
            "session_history": [],
            "topic_interests": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "strengths": [],
            "areas_for_improvement": [],
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

    def _create_new_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Create a new user profile in Supabase database.
        
        Args:
            user_id: The user identifier
            
        Returns:
            The user's profile data
        """
        logger.info(f"Creating new profile for user {user_id} in Supabase")
        
        # Create a new profile with default values
        new_profile = {
            "user_id": user_id,
            "email": user_id if '@' in user_id else f"{user_id}@guest.com",
            "name": user_id.split('@')[0] if '@' in user_id else user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            
            # Learning preferences with default JSON structure
            "learning_preferences": {
                "style": "visual",
                "pace": "normal",
                "confidence": 0.5,
                "lastUpdated": datetime.now().isoformat()
            },
            
            # User goals as empty array
            "goals": [],
            
            # Areas for improvement
            "weak_topics": [],
            
            # User metrics
            "skill_level": "beginner",
            "total_interactions": 0,
            "learning_streak": 0,
            "preferred_difficulty": "medium",
            "time_spent_learning": 0,
            
            # Interaction tracking
            "interaction_types": {
                "chat": 0,
                "games": 0,
                "voice": 0,
                "visualize": 0,
                "quiz": 0,
                "greeting": 0,
                "non_educational": 0,
                "educational": 0
            },
            
            # Topic progress
            "topic_progress": {},
            
            # Achievements
            "achievements": [],
            
            # Onboarding status
            "onboarding_completed": False,
            
            # Timestamps
            "last_active": datetime.now().isoformat(),
            
            # Additional fields for personalization agent
            "interactions_count": 0,
            "preferred_learning_styles": ["visual", "textual"],
            "knowledge_areas": {},
            "strengths": [],
            "areas_for_improvement": [],
            "session_history": [],
            "topic_interests": [],
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
        
        try:
            # Insert the new profile into Supabase
            response = supabase.table("user_profiles").insert(new_profile).execute()
            if response.data and len(response.data) > 0:
                logger.info(f"Successfully created new profile for {user_id}")
                return response.data[0]
            else:
                logger.error(f"Failed to create profile for {user_id}: No data returned")
                return new_profile
        except Exception as e:
            logger.error(f"Error creating new profile for {user_id}: {e}")
            # Return the profile data even if save failed, so the agent can still work
            return new_profile
        
    def _save_user_profile(self, user_id: str, profile: Dict[str, Any]) -> None:
        """
        Save a user's profile to Supabase.

        Args:
            user_id: The user identifier
            profile: The profile data to save
        """
        try:
            supabase.table("user_profiles").upsert(profile, on_conflict=["user_id"]).execute()
            logger.info(f"Profile saved for {user_id}")
        except Exception as e:
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
        
        # Add additional fields based on query type
        if query_type == "educational":
            session_entry.update({
                "inferred_level": response.get("level", "beginner"),
                "inferred_learning_styles": response.get("learning_style", []),
                "topic": self._infer_topic(query)
            })
            
            # Update learning styles if provided
            if "learning_style" in response and response["learning_style"]:
                for style in response["learning_style"]:
                    if style not in self.user_profile["preferred_learning_styles"]:
                        self.user_profile["preferred_learning_styles"].append(style)
            
            # Update skill level
            if self.user_profile["interactions_count"] > 50:
                if response.get("level") == "advanced":
                    self.user_profile["skill_level"] = "advanced"
                elif response.get("level") == "intermediate" and self.user_profile["skill_level"] == "beginner":
                    self.user_profile["skill_level"] = "intermediate"
            elif self.user_profile["interactions_count"] > 20:
                if response.get("level") == "intermediate" and self.user_profile["skill_level"] == "beginner":
                    self.user_profile["skill_level"] = "intermediate"
        
        # For non-educational or greeting queries, track the interaction type
        if query_type in ["greeting", "non_educational"]:
            if "interaction_types" not in self.user_profile:
                self.user_profile["interaction_types"] = {}
            
            if query_type not in self.user_profile["interaction_types"]:
                self.user_profile["interaction_types"][query_type] = 0
                
            self.user_profile["interaction_types"][query_type] += 1
        
        # Add the session entry to history
        self.user_profile["session_history"].append(session_entry)
        
        # Save the updated profile
        self._save_user_profile(self.user_id, self.user_profile)
        
    def _infer_topic(self, query: str) -> str:
        """
        Infer the topic of a query.
        
        Args:
            query: The user's query
            
        Returns:
            The inferred topic
        """
        # This is a simplified implementation, could use topic modeling
        common_topics = [
            "algorithms", "data structures", "programming", "mathematics",
            "physics", "chemistry", "biology", "machine learning"
        ]
        
        for topic in common_topics:
            if topic.lower() in query.lower():
                return topic
                
        return "general"
    
    def _extract_topic_from_query(self, query: str) -> str:
        """
        Extract the main topic from a query for more natural greetings.
        
        Args:
            query: The user's query
            
        Returns:
            The extracted topic or a simplified version of the query
        """
        # Common topic patterns
        topic_map = {
            "machine learning": "machine learning",
            "artificial intelligence": "artificial intelligence", 
            "ai": "AI",
            "python": "Python programming",
            "javascript": "JavaScript",
            "programming": "programming",
            "data science": "data science",
            "algorithms": "algorithms",
            "data structures": "data structures",
            "neural networks": "neural networks",
            "deep learning": "deep learning",
            "web development": "web development",
            "database": "databases",
            "sql": "SQL",
            "cloud computing": "cloud computing",
            "cybersecurity": "cybersecurity",
            "blockchain": "blockchain",
            "quantum": "quantum computing",
            "nlp": "natural language processing",
            "natural language processing": "natural language processing"
        }
        
        query_lower = query.lower()
        
        # Check for direct topic matches
        for key, topic in topic_map.items():
            if key in query_lower:
                return topic
        
        # Extract topic from common question patterns
        if "what is" in query_lower:
            # Extract topic after "what is"
            parts = query_lower.split("what is")
            if len(parts) > 1:
                topic = parts[1].strip().rstrip("?")
                if topic:
                    return topic
        
        if "explain" in query_lower:
            # Extract topic after "explain"
            parts = query_lower.split("explain")
            if len(parts) > 1:
                topic = parts[1].strip().rstrip("?")
                # Remove common prefixes
                topic = topic.replace("to me", "").replace("how", "").strip()
                if topic:
                    return topic
        
        if "how does" in query_lower or "how do" in query_lower:
            # Extract topic from "how does X work" patterns
            if "how does" in query_lower:
                parts = query_lower.split("how does")
                if len(parts) > 1:
                    topic = parts[1].replace("work", "").strip().rstrip("?")
                    if topic:
                        return topic
        
        if "tell me about" in query_lower:
            # Extract topic after "tell me about"
            parts = query_lower.split("tell me about")
            if len(parts) > 1:
                topic = parts[1].strip().rstrip("?")
                if topic:
                    return topic
        
        # If no specific pattern found, try to clean up the query
        # Remove common question words
        clean_query = query.lower()
        for remove_word in ["what", "how", "why", "when", "where", "is", "are", "can", "you", "tell", "me", "about", "explain", "to", "the", "a", "an"]:
            clean_query = clean_query.replace(f" {remove_word} ", " ")
        
        clean_query = clean_query.strip().rstrip("?")
        
        # Take first few words as topic if it's reasonable length
        if len(clean_query) > 0 and len(clean_query) < 50:
            return clean_query
        
        # Final fallback
        return "this topic"
        
    def _is_greeting_or_casual(self, query: str) -> bool:
        """Check if a query is a greeting or casual interaction."""
        greetings = [
            "hi", "hello", "hey", "howdy", "greetings", 
            "how are you", "what's up", "good morning", "good afternoon", 
            "good evening", "good day", "nice to meet you"
        ]
        
        query_lower = query.lower()
        return any(greeting in query_lower for greeting in greetings)

    def _is_profile_or_memory_query(self, query: str) -> bool:
        """Check if a query is asking about user profile or memory."""
        memory_keywords = [
            "memory", "remember", "know about me", "tell me about myself", 
            "what do you know", "profile", "information about me", 
            "who am i", "about me", "my information", "what's in your memory",
            "do you remember me", "what do you remember", "my details", "my data",
            "my goals", "what are my goals", "my learning goals", "my objectives",
            "my skills", "what are my skills", "my interests", "my preferences",
            "my background", "my experience", "my education", "my job", "my work"
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in memory_keywords)
    
    def _is_non_educational(self, query: str) -> bool:
        """Check if a query is non-educational (about the system, capabilities, etc.)."""
        non_educational_keywords = [
            "who are you", "what are you", "your name", "tell me about yourself",
            "how do you work", "what can you do", "your capabilities", "help me",
            "weather", "news", "time", "date", "joke", "thanks", "thank you"
        ]
        
        query_lower = query.lower()
        # Exclude profile/memory queries from non-educational
        return any(keyword in query_lower for keyword in non_educational_keywords) and not self._is_profile_or_memory_query(query)

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a user query and provide personalized instructions or responses.
        
        Args:
            query: The user's query
            
        Returns:
            A dictionary containing personalization data or direct responses
        """
        try:
            logger.info(f"Processing query for user {self.user_id}: {query}")
            
            # Quick pre-check to potentially skip LLM for very obvious greetings
            if len(query.split()) <= 3 and self._is_greeting_or_casual(query):
                simple_response = {
                    "query_type": "greeting",
                    "response": f"Hello! How can I help you learn today?"
                }
                # Still update profile to track interactions
                self._update_profile_from_interaction(query, simple_response)
                return simple_response
            
            # Get personalized instructions from the LLM chain
            response = self.chain.run(
                user_profile=json.dumps(self.user_profile, indent=2),
                query=query,
                chat_history=""  # Empty chat history for now
            )
            
            # Parse the JSON response
            try:
                if isinstance(response, str):
                    # Extract JSON if the response contains other text
                    json_start = response.find("{")
                    json_end = response.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        response_dict = json.loads(response[json_start:json_end])
                    else:
                        raise ValueError("No JSON found in response")
                else:
                    response_dict = response
                    
                # Update the user profile based on this interaction
                self._update_profile_from_interaction(query, response_dict)
                
                return response_dict
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {e}\nResponse: {response}")
                # Fallback based on content
                if self._is_greeting_or_casual(query):
                    return {
                        "query_type": "greeting",
                        "response": f"Hello! How can I help you learn today?"
                    }
                elif self._is_non_educational(query):
                    return {
                        "query_type": "non_educational",
                        "response": f"I'm an AI educational assistant designed to help with your learning journey."
                    }
                else:
                    # Generate a personalized greeting for educational fallback
                    user_name = self.user_profile.get('name', 'there')
                    display_name = user_name if user_name != 'there' else 'there'
                    
                    # Extract topic from query for more natural greetings
                    topic = self._extract_topic_from_query(query)
                    
                    # Create varied greetings based on interaction count
                    interaction_count = self.user_profile.get('interactions_count', 0)
                    
                    if interaction_count == 0:
                        greeting = f"Hi {display_name}! Let's explore {topic} together - this is going to be interesting!"
                    elif interaction_count < 5:
                        greeting = f"Great question, {display_name}! I love that you're curious about {topic}."
                    else:
                        greeting = f"Welcome back, {display_name}! Ready to dive into {topic}?"
                    
                    # Fallback to a default educational response with greeting
                    default_response = {
                        "query_type": "educational",
                        "level": self.user_profile["skill_level"],
                        "learning_style": self.user_profile["preferred_learning_styles"] if self.user_profile["preferred_learning_styles"] else ["visual", "textual"],
                        "emphasis": ["core concepts"],
                        "knowledge_gaps": [],
                        "connections": [],
                        "tailored_instruction": f"Explain the concept of {topic} clearly at a {self.user_profile['skill_level']} level.",
                        "tailored_query": query,
                        "personalized_greeting": greeting
                    }
                    return default_response
                
        except Exception as e:
            logger.error(f"Error in personalization agent: {e}")
            # Provide a basic response based on query type
            if self._is_greeting_or_casual(query):
                return {
                    "query_type": "greeting",
                    "response": f"Hello! How can I help you learn today?"
                }
            elif self._is_non_educational(query):
                return {
                    "query_type": "non_educational",
                    "response": f"I'm an AI educational assistant designed to help with your learning journey."
                }
            else:
                # Basic educational response with greeting
                user_name = self.user_profile.get('name', 'there') if hasattr(self, 'user_profile') else 'there'
                greeting = f"Hi {user_name}! Let's explore {query} together!"
                
                return {
                    "query_type": "educational",
                    "level": "beginner",
                    "learning_style": ["visual", "textual"],
                    "emphasis": ["core concepts"],
                    "knowledge_gaps": [],
                    "connections": [],
                    "tailored_instruction": f"Explain the concept of {query} in a clear, straightforward manner.",
                    "tailored_query": query,
                    "personalized_greeting": greeting
                }
            
    def provide_feedback(self, query: str, was_helpful: bool, feedback: str = None) -> None:
        """
        Process feedback from the user to improve future personalization.
        
        Args:
            query: The original query
            was_helpful: Whether the response was helpful
            feedback: Optional textual feedback
        """
        # Add the feedback to the user profile
        if "feedback" not in self.user_profile:
            self.user_profile["feedback"] = []
            
        self.user_profile["feedback"].append({
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "was_helpful": was_helpful,
            "feedback": feedback
        })
        
        # Save the updated profile
        self._save_user_profile(self.user_id, self.user_profile)
        
        # Log the feedback
        logger.info(f"Received feedback for user {self.user_id} - Query: {query}, Helpful: {was_helpful}, Feedback: {feedback}") 