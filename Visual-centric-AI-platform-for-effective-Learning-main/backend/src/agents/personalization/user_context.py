import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import google.generativeai as genai
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
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Service role client for administrative operations
    service_role_supabase = None
    if SUPABASE_SERVICE_ROLE_KEY:
        service_role_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Get Gemini API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class UserContextManager:
    """
    Manager for user context objects that persist across sessions.
    Handles loading, updating, and persisting user information.
    """
    
    def __init__(self):
        """Initialize the UserContextManager"""
        self.user_contexts = {}  # Cache of user contexts
        self.fallback_directory = "user_profiles"  # Fallback to file system if database not available
        
        # Ensure the fallback directory exists
        os.makedirs(self.fallback_directory, exist_ok=True)
        
    def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Get a user's context object, either from cache, database or file.
        Creates a new one if it doesn't exist.
        
        Args:
            user_id: The user identifier
            
        Returns:
            The user context object
        """
        # Return from cache if available
        if user_id in self.user_contexts:
            return self.user_contexts[user_id]
            
        # Try to load from database
        user_context = self._load_from_database(user_id)
        
        # Fall back to file system if database fails
        if not user_context:
            user_context = self._load_from_file(user_id)
            
        # Create new context if none exists
        if not user_context:
            user_context = self._create_default_context(user_id)
            
        # Cache the context
        self.user_contexts[user_id] = user_context
        return user_context
    
    def update_user_context(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a user's context with new information.
        
        Args:
            user_id: The user identifier
            updates: Dictionary of fields to update
            
        Returns:
            The updated user context
        """
        # Get current context
        user_context = self.get_user_context(user_id)
        
        # Update context
        for key, value in updates.items():
            if key == "recentQuestions":
                # Special handling for recent questions - append to list and keep only the last 5
                if key not in user_context:
                    user_context[key] = []
                user_context[key].append(value)
                user_context[key] = user_context[key][-5:]
            elif key == "weakTopics" and isinstance(value, str):
                # If weakTopics is provided as a string, convert to list
                if key not in user_context:
                    user_context[key] = []
                if value not in user_context[key]:
                    user_context[key].append(value)
            elif key == "goals" and isinstance(value, str):
                # If goals is provided as a string, convert to list
                if key not in user_context:
                    user_context[key] = []
                if value not in user_context[key]:
                    user_context[key].append(value)
            else:
                # Regular update
                user_context[key] = value
        
        # Add update timestamp
        user_context["lastUpdated"] = datetime.now().isoformat()
        
        # Save the updated context
        self._save_user_context(user_id, user_context)
        
        # Update cache
        self.user_contexts[user_id] = user_context
        
        return user_context
    
    def _load_from_database(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Load user context from Supabase database.
        
        Args:
            user_id: The user identifier
            
        Returns:
            The user context if found, None otherwise
        """
        if not supabase:
            logger.warning("Supabase client not available. Cannot load from database.")
            return None
            
        try:
            # Try different options for finding the user
            client = service_role_supabase if service_role_supabase else supabase
            
            # Try using user_id directly
            response = client.table("user_profiles").select("*").eq("user_id", user_id).execute()
            
            if not response.data:
                # Try by email if user_id looks like an email
                if "@" in user_id:
                    response = client.table("user_profiles").select("*").eq("email", user_id).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"User context loaded from database for {user_id}")
                user_data = response.data[0]
                
                # Convert stored JSON strings to actual objects
                json_fields = [
                    'learning_style', 'learning_preferences', 'topics_of_interest', 'goals',
                    'weak_topics', 'current_skills', 'interests'
                ]
                
                for field in json_fields:
                    if field in user_data and isinstance(user_data[field], str):
                        try:
                            user_data[field] = json.loads(user_data[field])
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse JSON field {field} for user {user_id}")
                            if field in ['learning_preferences']:
                                user_data[field] = {}
                            else:
                                user_data[field] = []
                                
                # Create a standardized user context object
                user_context = self._standardize_user_data(user_data)
                return user_context
                
            return None
            
        except Exception as e:
            logger.error(f"Error loading user context from database: {e}")
            return None
    
    def _load_from_file(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Load user context from file system (fallback).
        
        Args:
            user_id: The user identifier
            
        Returns:
            The user context if found, None otherwise
        """
        # Sanitize user_id for filesystem
        safe_user_id = "".join(c if c.isalnum() or c in "._-@" else "_" for c in user_id)
        file_path = os.path.join(self.fallback_directory, f"user_{safe_user_id}.json")
        
        if os.path.exists(file_path):
            try:
                with open(file_path, "r") as f:
                    user_data = json.load(f)
                logger.info(f"User context loaded from file for {user_id}")
                return user_data
            except Exception as e:
                logger.error(f"Error loading user context from file: {e}")
                
        return None
    
    def _create_default_context(self, user_id: str) -> Dict[str, Any]:
        """
        Create a default user context.
        
        Args:
            user_id: The user identifier
            
        Returns:
            A default user context
        """
        logger.info(f"Creating default user context for {user_id}")
        
        # Create a new user context with default values
        username = user_id.split('@')[0] if '@' in user_id else user_id
        
        default_context = {
            "userId": user_id,
            "name": username,
            "createdAt": datetime.now().isoformat(),
            "lastUpdated": datetime.now().isoformat(),
            "preferences": {
                "learningStyle": "visual",
                "weakTopics": [],
                "goals": ["Master coding concepts"]
            },
            "lastActivity": None,
            "recentQuestions": [],
            "sessionData": {
                "startTime": datetime.now().isoformat(),
                "interactionCount": 0,
                "topics": []
            }
        }
        
        # Save the default context
        self._save_user_context(user_id, default_context)
        
        return default_context
    
    def _save_user_context(self, user_id: str, context: Dict[str, Any]) -> None:
        """
        Save the user context to both database and file system.
        
        Args:
            user_id: The user identifier
            context: The user context to save
        """
        # Try to save to database first
        if supabase:
            self._save_to_database(user_id, context)
            
        # Always save to file as backup
        self._save_to_file(user_id, context)
    
    def _save_to_database(self, user_id: str, context: Dict[str, Any]) -> None:
        """
        Save user context to Supabase database.
        
        Args:
            user_id: The user identifier
            context: The user context to save
        """
        if not supabase:
            return
            
        try:
            # Prepare data for Supabase format
            db_context = self._prepare_for_database(user_id, context)
            
            # Use the appropriate client
            client = service_role_supabase if service_role_supabase else supabase
            
            # Check if user exists
            response = client.table("user_profiles").select("*").eq("user_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                # Update existing user
                client.table("user_profiles").update(db_context).eq("user_id", user_id).execute()
                logger.info(f"Updated user context in database for {user_id}")
            else:
                # Insert new user
                client.table("user_profiles").insert(db_context).execute()
                logger.info(f"Inserted new user context in database for {user_id}")
                
        except Exception as e:
            logger.error(f"Error saving user context to database: {e}")
    
    def _save_to_file(self, user_id: str, context: Dict[str, Any]) -> None:
        """
        Save user context to file system (fallback).
        
        Args:
            user_id: The user identifier
            context: The user context to save
        """
        # Sanitize user_id for filesystem
        safe_user_id = "".join(c if c.isalnum() or c in "._-@" else "_" for c in user_id)
        file_path = os.path.join(self.fallback_directory, f"user_{safe_user_id}.json")
        
        try:
            with open(file_path, "w") as f:
                json.dump(context, f, indent=2)
            logger.info(f"User context saved to file for {user_id}")
        except Exception as e:
            logger.error(f"Error saving user context to file: {e}")
    
    def _standardize_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert database user data to standardized user context format.
        
        Args:
            user_data: Raw user data from database
            
        Returns:
            Standardized user context
        """
        # Build a standardized user context from database fields
        user_context = {
            "userId": user_data.get("user_id"),
            "name": user_data.get("name", ""),
            "email": user_data.get("email", ""),
            "createdAt": user_data.get("created_at", datetime.now().isoformat()),
            "lastUpdated": user_data.get("updated_at", datetime.now().isoformat()),
            "preferences": {
                "learningStyle": user_data.get("learning_style", ["visual"])[0] if isinstance(user_data.get("learning_style"), list) else "visual",
                "weakTopics": user_data.get("weak_topics", []),
                "goals": user_data.get("learning_goals", []) or user_data.get("goals", [])
            },
            "skillLevel": user_data.get("skill_level", "beginner"),
            "lastActivity": user_data.get("last_activity_date", None),
            "recentQuestions": [],  # This is typically maintained in memory
            "sessionData": {
                "startTime": datetime.now().isoformat(),
                "interactionCount": 0,
                "topics": []
            }
        }
        
        return user_context
    
    def _prepare_for_database(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert user context to database format.
        
        Args:
            user_id: The user identifier
            context: The user context
            
        Returns:
            Database-formatted user data
        """
        # Format JSON data for database storage
        db_context = {
            "user_id": user_id,
            "email": context.get("email", user_id if "@" in user_id else f"{user_id}@guest.com"),
            "name": context.get("name", user_id.split('@')[0] if '@' in user_id else user_id),
            "updated_at": datetime.now().isoformat(),
            
            # Convert complex fields to JSON strings if needed
            "learning_style": json.dumps([context.get("preferences", {}).get("learningStyle", "visual")]),
            "weak_topics": json.dumps(context.get("preferences", {}).get("weakTopics", [])),
            "learning_goals": json.dumps(context.get("preferences", {}).get("goals", [])),
            
            # Additional fields
            "skill_level": context.get("skillLevel", "beginner"),
            "last_activity_date": context.get("lastActivity", datetime.now().isoformat()),
            "learning_preferences": json.dumps({
                "style": context.get("preferences", {}).get("learningStyle", "visual"),
                "lastUpdated": datetime.now().isoformat()
            }),
            
            # Metadata
            "metadata": json.dumps({
                "lastUpdated": datetime.now().isoformat(),
                "source": "UserContextManager"
            })
        }
        
        return db_context

class UserContext:
    """
    Represents a user's context within the system.
    Provides methods for updating context and generating personalized recommendations.
    """
    
    def __init__(self, user_id: str, context_manager: UserContextManager = None):
        """
        Initialize a UserContext instance.
        
        Args:
            user_id: The user identifier
            context_manager: Optional UserContextManager instance (creates new one if None)
        """
        self.user_id = user_id
        self.context_manager = context_manager or UserContextManager()
        self.context = self.context_manager.get_user_context(user_id)
        
        # Initialize Gemini model for personalization if key is available
        self.gemini_model = None
        if GEMINI_API_KEY:
            try:
                self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                logger.error(f"Error initializing Gemini model: {e}")
    
    def update_context(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the user context with new information.
        
        Args:
            updates: Dictionary of fields to update
            
        Returns:
            The updated context
        """
        self.context = self.context_manager.update_user_context(self.user_id, updates)
        return self.context
    
    def update_from_query(self, query: str, response: str = None) -> None:
        """
        Update context based on a user query and optional response.
        
        Args:
            query: The user query
            response: Optional response to the query
        """
        # Add to recent questions
        self.update_context({"recentQuestions": query})
        
        # Update last activity
        self.update_context({"lastActivity": f"Viewed {query}"})
        
        # Store conversation in persistent history
        conversation_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response": response[:200] + "..." if response and len(response) > 200 else response,
            "topic": self._extract_topic_from_query(query)
        }
        
        # Add to conversation history (persistent)
        if "conversationHistory" not in self.context:
            self.context["conversationHistory"] = []
        
        self.context["conversationHistory"].append(conversation_entry)
        
        # Keep only last 50 conversations to prevent memory overflow
        if len(self.context["conversationHistory"]) > 50:
            self.context["conversationHistory"] = self.context["conversationHistory"][-50:]
        
        # Increment session interaction count
        session_data = self.context.get("sessionData", {})
        session_data["interactionCount"] = session_data.get("interactionCount", 0) + 1
        self.update_context({"sessionData": session_data})
        
        # If we have a Gemini model, try to infer topic and update
        if self.gemini_model:
            try:
                topic = self._infer_topic_from_query(query)
                if topic:
                    # Add to session topics
                    session_data = self.context.get("sessionData", {})
                    if "topics" not in session_data:
                        session_data["topics"] = []
                    if topic not in session_data["topics"]:
                        session_data["topics"].append(topic)
                        self.update_context({"sessionData": session_data})
                        
                    # Check if this is a weak topic
                    weak_topics = self.context.get("preferences", {}).get("weakTopics", [])
                    if topic not in weak_topics:
                        # Use Gemini to analyze if user seems to be struggling with this topic
                        if response and self._is_struggling_with_topic(query, response, topic):
                            self.update_context({"weakTopics": topic})
            except Exception as e:
                logger.error(f"Error updating context from query: {e}")
    
    def get_personalized_recommendations(self) -> Dict[str, Any]:
        """
        Generate personalized recommendations based on user context.
        
        Returns:
            Dictionary of personalized recommendations
        """
        recommendations = {
            "flashcards": self._get_flashcard_recommendations(),
            "games": self._get_game_recommendations(),
            "resources": self._get_resource_recommendations(),
            "nextSteps": self._get_next_steps()
        }
        
        return recommendations
    
    def _get_flashcard_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate flashcard recommendations based on weak topics and goals.
        
        Returns:
            List of flashcard recommendations
        """
        flashcards = []
        
        # Recommend flashcards for weak topics
        weak_topics = self.context.get("preferences", {}).get("weakTopics", [])
        for topic in weak_topics[:2]:  # Limit to 2 topics
            flashcards.append({
                "id": f"flashcard_{len(flashcards) + 1}",
                "title": f"{topic.title()} Flashcards",
                "description": f"Practice {topic} concepts to strengthen your understanding",
                "difficulty": "medium",
                "count": 10
            })
        
        # If we have fewer than 2 recommendations, add from goals
        goals = self.context.get("preferences", {}).get("goals", [])
        for goal in goals:
            if len(flashcards) >= 3:
                break
                
            # Extract topic from goal if possible
            topic = self._extract_topic_from_goal(goal)
            if topic:
                flashcards.append({
                    "id": f"flashcard_{len(flashcards) + 1}",
                    "title": f"{topic.title()} Flashcards",
                    "description": f"Learn key {topic} concepts to help reach your goal",
                    "difficulty": "beginner",
                    "count": 5
                })
        
        # Ensure we have at least one recommendation
        if not flashcards:
            flashcards.append({
                "id": "flashcard_general",
                "title": "Computer Science Fundamentals",
                "description": "Review core CS concepts to build a strong foundation",
                "difficulty": "beginner",
                "count": 10
            })
            
        return flashcards
    
    def _get_game_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate game recommendations based on learning style and topics.
        
        Returns:
            List of game recommendations
        """
        games = []
        
        # Get learning style
        learning_style = self.context.get("preferences", {}).get("learningStyle", "visual")
        
        # Get weak topics and session topics
        weak_topics = self.context.get("preferences", {}).get("weakTopics", [])
        session_topics = self.context.get("sessionData", {}).get("topics", [])
        
        # Combine topics with priority for weak topics
        topics = weak_topics + [t for t in session_topics if t not in weak_topics]
        
        # Create game recommendations
        if "os" in topics or "operating systems" in topics:
            games.append({
                "id": "game_os_visualization",
                "title": "OS Visualization Game",
                "description": "Interactive visualization of operating system concepts",
                "difficulty": "medium",
                "type": "visualization"
            })
            
        if "recursion" in topics or "algorithms" in topics:
            games.append({
                "id": "game_recursion_puzzle",
                "title": "Recursion Puzzle",
                "description": "Solve recursive problems visually",
                "difficulty": "hard",
                "type": "puzzle"
            })
            
        if "dbms" in topics or "sql" in topics or "database" in topics:
            games.append({
                "id": "game_dbms_challenge",
                "title": "Database Query Challenge",
                "description": "Practice SQL queries in a game environment",
                "difficulty": "medium",
                "type": "quiz"
            })
            
        # Add a general game for visual learners
        if learning_style == "visual" and len(games) < 2:
            games.append({
                "id": "game_memory_match",
                "title": "CS Concept Memory Match",
                "description": "Match related computer science concepts",
                "difficulty": "easy",
                "type": "memory"
            })
            
        # Ensure we have at least one game recommendation
        if not games:
            games.append({
                "id": "game_coding_challenge",
                "title": "Quick Coding Challenge",
                "description": "Test your coding skills with a quick challenge",
                "difficulty": "medium",
                "type": "challenge"
            })
            
        return games
    
    def _get_resource_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate resource recommendations based on user context.
        
        Returns:
            List of resource recommendations
        """
        resources = []
        
        # Get skill level and topics of interest
        skill_level = self.context.get("skillLevel", "beginner")
        weak_topics = self.context.get("preferences", {}).get("weakTopics", [])
        session_topics = self.context.get("sessionData", {}).get("topics", [])
        
        # Combine topics
        topics = weak_topics + [t for t in session_topics if t not in weak_topics]
        
        # Create resource recommendations
        for topic in topics[:2]:  # Limit to 2 topics
            resources.append({
                "id": f"resource_{len(resources) + 1}",
                "title": f"{topic.title()} Tutorial",
                "description": f"Comprehensive {skill_level} guide to {topic}",
                "type": "tutorial",
                "format": "interactive"
            })
            
        # Add video recommendation
        if topics:
            resources.append({
                "id": f"resource_{len(resources) + 1}",
                "title": f"{topics[0].title()} Video Series",
                "description": f"Visual explanation of key {topics[0]} concepts",
                "type": "video",
                "format": "playlist"
            })
            
        # Ensure we have at least one resource recommendation
        if not resources:
            resources.append({
                "id": "resource_general",
                "title": "Computer Science Fundamentals",
                "description": "Core CS concepts explained clearly",
                "type": "guide",
                "format": "interactive"
            })
            
        return resources
    
    def _get_next_steps(self) -> List[str]:
        """
        Generate recommended next steps based on user context.
        
        Returns:
            List of next step recommendations
        """
        next_steps = []
        
        # Get user information
        weak_topics = self.context.get("preferences", {}).get("weakTopics", [])
        goals = self.context.get("preferences", {}).get("goals", [])
        skill_level = self.context.get("skillLevel", "beginner")
        
        # Add next steps based on weak topics
        if weak_topics:
            next_steps.append(f"Complete the {weak_topics[0].title()} practice exercises")
            if len(weak_topics) > 1:
                next_steps.append(f"Review the {weak_topics[1].title()} flashcards")
                
        # Add next steps based on goals
        if goals:
            goal_topic = self._extract_topic_from_goal(goals[0])
            if goal_topic:
                next_steps.append(f"Take the {goal_topic.title()} assessment quiz")
                
        # Add general next steps based on skill level
        if skill_level == "beginner":
            next_steps.append("Complete the CS Fundamentals interactive tutorial")
        elif skill_level == "intermediate":
            next_steps.append("Try the programming challenge to test your skills")
        else:  # advanced
            next_steps.append("Tackle the advanced algorithm optimization exercises")
            
        # Ensure we have at least three next steps
        general_steps = [
            "Take a practice quiz to identify knowledge gaps",
            "Complete a learning assessment to update your profile",
            "Try a visualization exercise for a difficult concept",
            "Attempt the interactive coding exercises"
        ]
        
        while len(next_steps) < 3:
            for step in general_steps:
                if step not in next_steps:
                    next_steps.append(step)
                    break
            
        return next_steps[:3]  # Limit to 3 steps
    
    def _infer_topic_from_query(self, query: str) -> Optional[str]:
        """
        Use Gemini to infer the educational topic from a query.
        
        Args:
            query: The user query
            
        Returns:
            Inferred topic or None if inference fails
        """
        if not self.gemini_model:
            return None
            
        try:
            prompt = f"""
            Extract the main educational topic from this query. 
            Return ONLY the single most relevant topic as a lowercase word or phrase (like "recursion", "operating systems", "data structures", etc.).
            Do not include any explanation or additional text.
            
            Query: {query}
            """
            
            response = self.gemini_model.generate_content(prompt)
            if response.text:
                # Clean up the response - we want just the topic
                topic = response.text.strip().lower()
                return topic
                
        except Exception as e:
            logger.error(f"Error inferring topic from query: {e}")
            
        return None
    
    def _extract_topic_from_query(self, query: str) -> Optional[str]:
        """
        Extract a topic from a user query using simple keyword matching.
        
        Args:
            query: The user query
            
        Returns:
            Extracted topic or None
        """
        # Simple fallback for topic extraction
        query_lower = query.lower()
        common_topics = {
            "python": ["python", "py"],
            "javascript": ["javascript", "js"],
            "algorithms": ["algorithm", "sorting", "searching"],
            "data structures": ["array", "list", "tree", "graph", "stack", "queue"],
            "database": ["database", "sql", "mysql", "postgresql"],
            "dbms": ["dbms", "normalization", "sql"],
            "machine learning": ["machine learning", "ml", "neural network"],
            "operating systems": ["os", "operating system", "process", "thread"],
            "recursion": ["recursion", "recursive"],
            "networking": ["network", "tcp", "http", "api"]
        }
        
        for topic, keywords in common_topics.items():
            if any(keyword in query_lower for keyword in keywords):
                return topic
        
        return None
    
    def _is_struggling_with_topic(self, query: str, response: str, topic: str) -> bool:
        """
        Use Gemini to determine if the user is struggling with a topic.
        
        Args:
            query: The user query
            response: The response to the query
            topic: The topic to check
            
        Returns:
            True if the user seems to be struggling, False otherwise
        """
        if not self.gemini_model:
            return False
            
        try:
            prompt = f"""
            Analyze this query and response to determine if the user seems to be struggling with the topic of "{topic}".
            
            Query: {query}
            
            Response: {response}
            
            Does the user seem to be struggling with understanding {topic}? Return ONLY "yes" or "no".
            """
            
            response = self.gemini_model.generate_content(prompt)
            if response.text and "yes" in response.text.lower():
                return True
                
        except Exception as e:
            logger.error(f"Error determining if user is struggling: {e}")
            
        return False
    
    def _extract_topic_from_goal(self, goal: str) -> Optional[str]:
        """
        Extract a topic from a learning goal.
        
        Args:
            goal: The learning goal
            
        Returns:
            Extracted topic or None
        """
        if not self.gemini_model:
            # Simple fallback
            common_topics = ["python", "javascript", "algorithms", "data structures", 
                           "database", "sql", "machine learning", "operating systems"]
            for topic in common_topics:
                if topic in goal.lower():
                    return topic
            return None
            
        try:
            prompt = f"""
            Extract the main educational topic from this learning goal. 
            Return ONLY the single most relevant topic as a lowercase word or phrase (like "recursion", "operating systems", "data structures", etc.).
            Do not include any explanation or additional text.
            
            Learning goal: {goal}
            """
            
            response = self.gemini_model.generate_content(prompt)
            if response.text:
                # Clean up the response - we want just the topic
                topic = response.text.strip().lower()
                return topic
                
        except Exception as e:
            logger.error(f"Error extracting topic from goal: {e}")
            
        return None

# Global instance of UserContextManager
user_context_manager = UserContextManager()

def get_user_context(user_id: str) -> UserContext:
    """
    Get a UserContext instance for a specific user.
    
    Args:
        user_id: The user identifier
        
    Returns:
        UserContext instance
    """
    return UserContext(user_id, user_context_manager)

def create_context_for_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a context object for inclusion in requests to the AI models.
    
    Args:
        request_data: Request data containing user context information
        
    Returns:
        Formatted context object for AI models
    """
    # Extract user information
    user_id = request_data.get("user_id", "guest")
    
    # Get or create user context
    user_context = get_user_context(user_id)
    
    # Format context for AI model
    context_for_ai = {
        "user": {
            "name": user_context.context.get("name", "there"),
            "skillLevel": user_context.context.get("skillLevel", "beginner"),
            "learningStyle": user_context.context.get("preferences", {}).get("learningStyle", "visual"),
            "preferredDifficulty": "medium",  # Default
            "goals": user_context.context.get("preferences", {}).get("goals", []),
            "weakTopics": user_context.context.get("preferences", {}).get("weakTopics", []),
            "recentTopics": user_context.context.get("sessionData", {}).get("topics", [])
        },
        "session": {
            "startTime": user_context.context.get("sessionData", {}).get("startTime", ""),
            "interactionCount": user_context.context.get("sessionData", {}).get("interactionCount", 0),
            "concepts": user_context.context.get("sessionData", {}).get("topics", [])
        },
        "context": {
            "lastActivity": user_context.context.get("lastActivity", ""),
            "recentQuestions": user_context.context.get("recentQuestions", [])
        }
    }
    
    return context_for_ai
