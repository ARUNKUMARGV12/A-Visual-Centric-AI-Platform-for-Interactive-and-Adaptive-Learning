import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Local imports
from .user_context import UserContext, get_user_context

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Gemini API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class PersonalizedRecommendations:
    """
    Class for generating personalized UI widget recommendations and adapting content presentation
    based on user context.
    """
    
    def __init__(self, user_id: str):
        """
        Initialize the PersonalizedRecommendations instance.
        
        Args:
            user_id: The user identifier
        """
        self.user_id = user_id
        self.user_context = get_user_context(user_id)
        
        # Initialize Gemini model for more advanced personalization if key is available
        self.gemini_model = None
        if GEMINI_API_KEY:
            try:
                self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                logger.error(f"Error initializing Gemini model: {e}")
    
    def get_dashboard_widgets(self) -> Dict[str, Any]:
        """
        Generate personalized dashboard widgets based on user context.
        
        Returns:
            Dictionary containing personalized widget data
        """
        # Get raw recommendations from user context
        raw_recommendations = self.user_context.get_personalized_recommendations()
        
        # Build dashboard widgets
        dashboard_widgets = {
            "welcomeMessage": self._get_personalized_welcome(),
            "flashcards": self._format_flashcard_widget(raw_recommendations["flashcards"]),
            "gameRecommendation": self._format_game_widget(raw_recommendations["games"]),
            "resourceRecommendation": self._format_resource_widget(raw_recommendations["resources"]),
            "nextSteps": self._format_next_steps_widget(raw_recommendations["nextSteps"]),
            "progressSummary": self._get_progress_summary()
        }
        
        return dashboard_widgets
    
    def get_sidebar_widgets(self) -> Dict[str, Any]:
        """
        Generate personalized sidebar widgets based on user context.
        
        Returns:
            Dictionary containing personalized sidebar widget data
        """
        # Get recommendations
        raw_recommendations = self.user_context.get_personalized_recommendations()
        
        # Build sidebar widgets
        sidebar_widgets = {
            "weakTopics": self._format_weak_topics_widget(),
            "recentActivity": self._get_recent_activity(),
            "quickFlashcards": raw_recommendations["flashcards"][:1] if raw_recommendations["flashcards"] else [],
            "suggestedGame": raw_recommendations["games"][0] if raw_recommendations["games"] else None
        }
        
        return sidebar_widgets
    
    def get_personalized_response_style(self) -> Dict[str, Any]:
        """
        Get personalization parameters for response tone and style.
        
        Returns:
            Dictionary containing personalization style parameters
        """
        # Get user preferences
        learning_style = self.user_context.context.get("preferences", {}).get("learningStyle", "visual")
        skill_level = self.user_context.context.get("skillLevel", "beginner")
        
        # Default style parameters
        style_params = {
            "emphasizeVisuals": learning_style == "visual",
            "useCodeExamples": True,
            "verbosityLevel": "medium",
            "tone": "friendly",
            "structurePreference": "stepByStep",
            "includeAnalogies": skill_level == "beginner",
            "technicalLanguageLevel": skill_level
        }
        
        # Add learning style specific parameters
        if learning_style == "visual":
            style_params.update({
                "showDiagramsFirst": True,
                "useColorCoding": True,
                "emphasizeImages": True
            })
        elif learning_style == "auditory":
            style_params.update({
                "verbosityLevel": "high",
                "useRepetition": True,
                "conversationalStyle": True,
                "emphasizeImages": False
            })
        elif learning_style == "kinesthetic":
            style_params.update({
                "emphasizeExercises": True,
                "interactivePreference": "high",
                "practicalExamples": True
            })
        
        return style_params
    
    def adapt_content_presentation(self, content_type: str, content: Any) -> Dict[str, Any]:
        """
        Adapt content presentation based on user preferences.
        
        Args:
            content_type: The type of content (explanation, exercise, example, etc.)
            content: The content to adapt
            
        Returns:
            Adapted content
        """
        # Get user preferences
        learning_style = self.user_context.context.get("preferences", {}).get("learningStyle", "visual")
        skill_level = self.user_context.context.get("skillLevel", "beginner")
        
        # Start with the original content
        adapted_content = {
            "original": content,
            "adapted": content,
            "adaptations": []
        }
        
        # Apply adaptations based on learning style
        if learning_style == "visual" and content_type == "explanation":
            # For visual learners, prioritize diagrams and visualizations
            adapted_content["adaptations"].append("visual_priority")
            # We're just recording the adaptation type here
            # In a real implementation, we would actually transform the content
        
        elif learning_style == "auditory" and content_type == "explanation":
            # For auditory learners, use more descriptive language
            adapted_content["adaptations"].append("auditory_format")
            
        elif learning_style == "kinesthetic" and content_type == "explanation":
            # For kinesthetic learners, add interactive elements
            adapted_content["adaptations"].append("interactive_elements")
        
        # Adapt based on skill level
        if skill_level == "beginner":
            adapted_content["adaptations"].append("simplified_terminology")
        elif skill_level == "advanced":
            adapted_content["adaptations"].append("technical_depth")
        
        # Use Gemini for more sophisticated adaptations if available
        if self.gemini_model and isinstance(content, str):
            try:
                adapted_content["adapted"] = self._adapt_content_with_gemini(content, learning_style, skill_level, content_type)
                adapted_content["adaptations"].append("ai_enhanced")
            except Exception as e:
                logger.error(f"Error adapting content with Gemini: {e}")
        
        return adapted_content
    
    def _adapt_content_with_gemini(self, content: str, learning_style: str, skill_level: str, content_type: str) -> str:
        """
        Use Gemini to adapt content based on user preferences.
        
        Args:
            content: The content to adapt
            learning_style: User's learning style
            skill_level: User's skill level
            content_type: Type of content
            
        Returns:
            Adapted content
        """
        # Skip if model not available
        if not self.gemini_model:
            return content
            
        try:
            # Create a prompt for content adaptation
            prompt = f"""
            Adapt this {content_type} for a {skill_level}-level learner with a {learning_style} learning style.
            
            Original Content:
            {content}
            
            Learning Style: {learning_style}
            Skill Level: {skill_level}
            Content Type: {content_type}
            
            Instructions:
            """
            
            # Add style-specific instructions
            if learning_style == "visual":
                prompt += """
                - Start with a diagram or visualization reference
                - Use visual metaphors and comparisons
                - Structure the content with clear headings and lists
                - Highlight key points visually (bold, italics)
                - Suggest diagrams where appropriate
                """
            elif learning_style == "auditory":
                prompt += """
                - Use descriptive language that paints a verbal picture
                - Explain concepts using rhythm and patterns
                - Repeat key points for emphasis
                - Use conversational tone and questions
                - Frame content as a dialogue
                """
            elif learning_style == "kinesthetic":
                prompt += """
                - Focus on practical exercises and examples
                - Provide step-by-step instructions
                - Include hands-on activities
                - Relate concepts to real-world applications
                - Suggest interactive ways to explore the concept
                """
            
            # Add skill level instructions
            if skill_level == "beginner":
                prompt += """
                - Use simplified terminology
                - Provide more background context
                - Break concepts into smaller steps
                - Use more analogies to familiar concepts
                """
            elif skill_level == "intermediate":
                prompt += """
                - Balance theory and practice
                - Provide some technical details
                - Include slightly more advanced concepts
                - Connect to related concepts
                """
            elif skill_level == "advanced":
                prompt += """
                - Dive deeper into technical details
                - Include optimizations and edge cases
                - Reference advanced concepts
                - Discuss performance implications
                """
            
            # Generate the adapted content
            response = self.gemini_model.generate_content(prompt)
            
            if response.text:
                return response.text
            
            return content
            
        except Exception as e:
            logger.error(f"Error in Gemini content adaptation: {e}")
            return content
    
    def _get_personalized_welcome(self) -> Dict[str, Any]:
        """
        Generate a personalized welcome message.
        
        Returns:
            Welcome message widget data
        """
        name = self.user_context.context.get("name", "there")
        last_activity = self.user_context.context.get("lastActivity")
        skill_level = self.user_context.context.get("skillLevel", "beginner")
        
        # Create base welcome
        welcome = {
            "message": f"Welcome back, {name}!",
            "subtitle": "Let's continue your learning journey."
        }
        
        # Customize based on context
        if last_activity:
            welcome["subtitle"] = f"Last time, you were learning about {last_activity.replace('Viewed ', '')}."
        
        # Add skill-level specific message
        if skill_level == "beginner":
            welcome["encouragement"] = "Building strong foundations today!"
        elif skill_level == "intermediate":
            welcome["encouragement"] = "You're making great progress!"
        else:  # advanced
            welcome["encouragement"] = "Ready for advanced challenges?"
            
        return welcome
    
    def _format_flashcard_widget(self, flashcards: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Format flashcard recommendations into a widget.
        
        Args:
            flashcards: List of flashcard recommendations
            
        Returns:
            Flashcard widget data
        """
        weak_topics = self.user_context.context.get("preferences", {}).get("weakTopics", [])
        
        widget = {
            "title": "Recommended Flashcards",
            "description": "Practice these topics to strengthen your knowledge.",
            "items": flashcards,
            "hasWeakTopics": len(weak_topics) > 0
        }
        
        # Customize title if we have weak topics
        if weak_topics:
            widget["description"] = "Focus on these topics to address knowledge gaps."
            
        return widget
    
    def _format_game_widget(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Format game recommendations into a widget.
        
        Args:
            games: List of game recommendations
            
        Returns:
            Game widget data
        """
        learning_style = self.user_context.context.get("preferences", {}).get("learningStyle", "visual")
        
        # Use first game as featured game
        featured_game = games[0] if games else {
            "id": "game_default",
            "title": "CS Memory Match",
            "description": "Test your knowledge with a fun memory game",
            "difficulty": "medium",
            "type": "memory"
        }
        
        widget = {
            "title": "Try This Interactive Game",
            "description": "Learn while having fun with interactive games.",
            "featuredGame": featured_game,
            "allGames": games
        }
        
        # Customize for learning style
        if learning_style == "visual":
            widget["title"] = "Interactive Visualization Game"
        elif learning_style == "kinesthetic":
            widget["title"] = "Hands-On Learning Activity"
            
        return widget
    
    def _format_resource_widget(self, resources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Format resource recommendations into a widget.
        
        Args:
            resources: List of resource recommendations
            
        Returns:
            Resource widget data
        """
        learning_style = self.user_context.context.get("preferences", {}).get("learningStyle", "visual")
        
        # Use first resource as featured resource
        featured_resource = resources[0] if resources else {
            "id": "resource_default",
            "title": "CS Fundamentals",
            "description": "Core computer science concepts",
            "type": "guide",
            "format": "interactive"
        }
        
        widget = {
            "title": "Learning Resources",
            "description": "Explore these resources to expand your knowledge.",
            "featuredResource": featured_resource,
            "allResources": resources
        }
        
        # Customize for learning style
        if learning_style == "visual":
            widget["title"] = "Visual Learning Resources"
        elif learning_style == "auditory":
            widget["title"] = "Audio & Video Tutorials"
        elif learning_style == "kinesthetic":
            widget["title"] = "Interactive Learning Materials"
            
        return widget
    
    def _format_next_steps_widget(self, next_steps: List[str]) -> Dict[str, Any]:
        """
        Format next steps recommendations into a widget.
        
        Args:
            next_steps: List of next step recommendations
            
        Returns:
            Next steps widget data
        """
        widget = {
            "title": "Your Learning Path",
            "description": "Focus on these next steps to reach your goals.",
            "steps": [{"id": f"step_{i+1}", "text": step} for i, step in enumerate(next_steps)]
        }
        
        # Add progress indicator
        widget["currentProgress"] = {
            "completed": self.user_context.context.get("sessionData", {}).get("interactionCount", 0),
            "total": 10,  # Arbitrary goal
            "message": "Keep going!"
        }
        
        return widget
    
    def _get_progress_summary(self) -> Dict[str, Any]:
        """
        Generate a summary of user's learning progress.
        
        Returns:
            Progress summary widget data
        """
        # Get user data
        session_data = self.user_context.context.get("sessionData", {})
        skill_level = self.user_context.context.get("skillLevel", "beginner")
        
        # Calculate metrics
        interactions = session_data.get("interactionCount", 0)
        topics = len(session_data.get("topics", []))
        
        # Create progress summary
        progress = {
            "title": "Your Learning Progress",
            "stats": [
                {"label": "Interactions", "value": interactions, "icon": "chat"},
                {"label": "Topics Explored", "value": topics, "icon": "topic"},
                {"label": "Current Level", "value": skill_level.title(), "icon": "skill"}
            ],
            "message": "You're making good progress!"
        }
        
        # Customize message based on interactions
        if interactions > 10:
            progress["message"] = "Great work! You're learning consistently."
        elif interactions < 3:
            progress["message"] = "Just starting out? Let's build momentum!"
            
        return progress
    
    def _format_weak_topics_widget(self) -> Dict[str, Any]:
        """
        Format weak topics into a widget.
        
        Returns:
            Weak topics widget data
        """
        weak_topics = self.user_context.context.get("preferences", {}).get("weakTopics", [])
        
        widget = {
            "title": "Focus Areas",
            "topics": [{"id": f"topic_{i+1}", "name": topic.title()} for i, topic in enumerate(weak_topics)]
        }
        
        # Add default message if no weak topics
        if not weak_topics:
            widget["message"] = "No specific focus areas identified yet. Keep learning!"
            widget["topics"] = []
            
        return widget
    
    def _get_recent_activity(self) -> Dict[str, Any]:
        """
        Generate a summary of recent user activity.
        
        Returns:
            Recent activity widget data
        """
        # Get recent questions
        recent_questions = self.user_context.context.get("recentQuestions", [])
        
        # Create activity summary
        activity = {
            "title": "Recent Activity",
            "items": [{"id": f"activity_{i+1}", "text": question} for i, question in enumerate(recent_questions)]
        }
        
        # Add default if no activity
        if not recent_questions:
            activity["message"] = "No recent activity. Start exploring!"
            activity["items"] = []
            
        return activity

def get_personalized_recommendations(user_id: str) -> PersonalizedRecommendations:
    """
    Get a PersonalizedRecommendations instance for a specific user.
    
    Args:
        user_id: The user identifier
        
    Returns:
        PersonalizedRecommendations instance
    """
    return PersonalizedRecommendations(user_id)

def adapt_response_for_user(user_id: str, response: str, query: str = None) -> str:
    """
    Adapt an AI response based on user preferences.
    
    Args:
        user_id: The user identifier
        response: The original response
        query: Optional original query for context
        
    Returns:
        Adapted response
    """
    # Get user context
    recommendations = get_personalized_recommendations(user_id)
    user_context = recommendations.user_context
    
    # Get learning style
    learning_style = user_context.context.get("preferences", {}).get("learningStyle", "visual")
    
    # Quick adaptation without Gemini
    adapted_response = response
    
    # Simple adaptations based on learning style
    if learning_style == "visual":
        # For visual learners, add a visual indicator at the beginning
        adapted_response = "📊 " + adapted_response
    elif learning_style == "auditory":
        # For auditory learners, add a listening indicator
        adapted_response = "🎧 " + adapted_response
    elif learning_style == "kinesthetic":
        # For kinesthetic learners, add a hands-on indicator
        adapted_response = "🛠️ " + adapted_response
    
    # If Gemini is available, use it for more sophisticated adaptation
    if recommendations.gemini_model:
        try:
            adaptation = recommendations.adapt_content_with_gemini(response, learning_style, 
                                                                 user_context.context.get("skillLevel", "beginner"), 
                                                                 "answer")
            if adaptation:
                return adaptation
        except Exception as e:
            logger.error(f"Error adapting response with Gemini: {e}")
    
    return adapted_response
