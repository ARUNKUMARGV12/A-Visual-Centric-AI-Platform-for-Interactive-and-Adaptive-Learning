"""
Advanced Personalization Agent for Learning & Code Understanding
Focuses on user knowledge visualization and adaptive learning.
"""

import json
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import google.generativeai as genai

logger = logging.getLogger(__name__)

class CodingStyle(Enum):
    FUNCTIONAL = "functional"
    OBJECT_ORIENTED = "object_oriented"
    PROCEDURAL = "procedural"
    MIXED = "mixed"

class LearningPreference(Enum):
    VISUAL = "visual"
    HANDS_ON = "hands_on"
    THEORETICAL = "theoretical"
    EXAMPLE_BASED = "example_based"

class ComplexityLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

@dataclass
class ProjectContext:
    project_id: str
    name: str
    language: str
    framework: str
    last_worked: datetime
    coding_patterns: List[str]
    dependencies: List[str]
    file_structure: Dict[str, Any]
    complexity_level: str
    
@dataclass
class UserCodingStyle:
    preferred_naming: str  # camelCase, snake_case, etc.
    indentation: str  # spaces, tabs
    comment_frequency: str  # minimal, moderate, verbose
    function_length_preference: str  # short, medium, long
    error_handling_style: str  # try-catch, if-else, assertions
    preferred_paradigm: CodingStyle
    
@dataclass
class KnowledgeArea:
    topic: str
    proficiency: float  # 0.0 to 1.0
    last_practiced: datetime
    weak_points: List[str]
    strong_points: List[str]
    learning_velocity: float  # How fast they learn this topic
    
@dataclass
class LearningInsight:
    insight_type: str
    message: str
    confidence: float
    actionable_suggestion: str
    learning_path: List[str]

class AdvancedPersonalizationAgent:
    def __init__(self, user_profiles_dir: str = "user_profiles", gemini_model = None):
        self.user_profiles_dir = Path(user_profiles_dir)
        self.user_profiles_dir.mkdir(exist_ok=True)
        self.gemini_model = gemini_model
        
    def _get_user_profile_path(self, user_id: str) -> Path:
        """Get the file path for a user's profile"""
        return self.user_profiles_dir / f"advanced_profile_{user_id}.json"
        
    def get_advanced_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user profile with personalization data"""
        profile_path = self._get_user_profile_path(user_id)
        
        default_profile = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "coding_style": {
                "preferred_naming": "camelCase",
                "indentation": "spaces",
                "comment_frequency": "moderate",
                "function_length_preference": "short",
                "error_handling_style": "try-catch",
                "preferred_paradigm": "mixed"
            },
            "learning_preferences": {
                "primary_style": "hands_on",
                "secondary_style": "example_based",
                "explanation_depth": "detailed",
                "prefers_visual_aids": True,
                "learns_best_with": ["examples", "practice", "feedback"]
            },
            "knowledge_areas": {},
            "project_contexts": {},
            "learning_history": [],
            "skill_progression": {
                "overall_level": "beginner",
                "areas_of_strength": [],
                "areas_for_improvement": [],
                "learning_velocity": 0.5
            },
            "interaction_patterns": {
                "most_active_times": [],
                "preferred_session_length": "30min",
                "feedback_receptivity": "high",
                "challenge_tolerance": "moderate"
            }
        }
        
        if profile_path.exists():
            try:
                with open(profile_path, 'r') as f:
                    existing_profile = json.load(f)
                    # Merge with default to ensure all keys exist
                    for key, value in default_profile.items():
                        if key not in existing_profile:
                            existing_profile[key] = value
                    return existing_profile
            except Exception as e:
                logger.error(f"Error loading profile for {user_id}: {e}")
                
        return default_profile
        
    def _save_advanced_profile(self, user_id: str, profile: Dict[str, Any]):
        """Save user profile to file"""
        profile_path = self._get_user_profile_path(user_id)
        profile["updated_at"] = datetime.now().isoformat()
        
        try:
            with open(profile_path, 'w') as f:
                json.dump(profile, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving profile for {user_id}: {e}")
            
    def analyze_coding_style(self, user_id: str, code_samples: List[str]) -> UserCodingStyle:
        """Analyze user's coding style from code samples"""
        style_analysis = {
            "preferred_naming": "camelCase",
            "indentation": "spaces",
            "comment_frequency": "moderate",
            "function_length_preference": "short",
            "error_handling_style": "try-catch",
            "preferred_paradigm": CodingStyle.MIXED
        }
        
        if not code_samples:
            return UserCodingStyle(**style_analysis)
            
        # Analyze naming conventions
        if any("_" in line for sample in code_samples for line in sample.split('\n')):
            style_analysis["preferred_naming"] = "snake_case"
            
        # Analyze indentation
        spaces_count = sum(line.count('    ') for sample in code_samples for line in sample.split('\n'))
        tabs_count = sum(line.count('\t') for sample in code_samples for line in sample.split('\n'))
        style_analysis["indentation"] = "spaces" if spaces_count > tabs_count else "tabs"
        
        # Analyze comment frequency
        total_lines = sum(len(sample.split('\n')) for sample in code_samples)
        comment_lines = sum(1 for sample in code_samples for line in sample.split('\n') 
                          if line.strip().startswith('#') or line.strip().startswith('//'))
        
        comment_ratio = comment_lines / max(total_lines, 1)
        if comment_ratio > 0.3:
            style_analysis["comment_frequency"] = "verbose"
        elif comment_ratio > 0.1:
            style_analysis["comment_frequency"] = "moderate"
        else:
            style_analysis["comment_frequency"] = "minimal"
            
        # Analyze function length preference
        function_lengths = []
        for sample in code_samples:
            lines = sample.split('\n')
            in_function = False
            current_function_length = 0
            
            for line in lines:
                if 'def ' in line or 'function ' in line:
                    if in_function and current_function_length > 0:
                        function_lengths.append(current_function_length)
                    in_function = True
                    current_function_length = 1
                elif in_function:
                    if line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                        function_lengths.append(current_function_length)
                        in_function = False
                        current_function_length = 0
                    else:
                        current_function_length += 1
                        
        if function_lengths:
            avg_length = sum(function_lengths) / len(function_lengths)
            if avg_length <= 10:
                style_analysis["function_length_preference"] = "short"
            elif avg_length <= 25:
                style_analysis["function_length_preference"] = "medium"
            else:
                style_analysis["function_length_preference"] = "long"
                
        return UserCodingStyle(**style_analysis)
        
    def update_project_context(self, user_id: str, project_data: Dict[str, Any]):
        """Update user's project context for better personalization"""
        profile = self.get_advanced_user_profile(user_id)
        
        project_context = ProjectContext(
            project_id=project_data.get('project_id', ''),
            name=project_data.get('name', ''),
            language=project_data.get('language', ''),
            framework=project_data.get('framework', ''),
            last_worked=datetime.now(),
            coding_patterns=project_data.get('patterns', []),
            dependencies=project_data.get('dependencies', []),
            file_structure=project_data.get('file_structure', {}),
            complexity_level=project_data.get('complexity', 'intermediate')
        )
        
        profile['project_contexts'][project_data['project_id']] = asdict(project_context)
        self._save_advanced_profile(user_id, profile)
        
    def get_personalized_suggestions(self, user_id: str, current_code: str, 
                                   task_type: str) -> List[str]:
        """Generate personalized suggestions based on user profile and context"""
        profile = self.get_advanced_user_profile(user_id)
        coding_style = profile.get('coding_style', {})
        learning_prefs = profile.get('learning_preferences', {})
        
        suggestions = []
        
        # Style-based suggestions
        if coding_style.get('preferred_naming') == 'snake_case' and 'camelCase' in current_code:
            suggestions.append("Consider using snake_case naming convention as it matches your preferred style")
            
        if coding_style.get('comment_frequency') == 'verbose' and current_code.count('#') < 3:
            suggestions.append("Add more comments to explain your logic - you typically prefer detailed documentation")
            
        # Learning preference-based suggestions
        if learning_prefs.get('prefers_visual_aids'):
            suggestions.append("Would you like me to create a visual flowchart of this algorithm?")
            
        if learning_prefs.get('primary_style') == 'hands_on':
            suggestions.append("Try implementing a variation of this code with different parameters")
            
        # Task-specific suggestions
        if task_type == 'refactoring':
            suggestions.extend([
                f"Based on your {coding_style.get('preferred_paradigm', 'mixed')} programming style, consider extracting reusable functions",
                "Break down complex functions to match your preference for shorter functions"
            ])
        elif task_type == 'debugging':
            suggestions.extend([
                f"Add {coding_style.get('error_handling_style', 'try-catch')} blocks to handle potential errors",
                "Use descriptive variable names that match your naming convention"
            ])
            
        return suggestions[:5]  # Return top 5 suggestions
        
    def generate_learning_insights(self, user_id: str) -> List[LearningInsight]:
        """Generate personalized learning insights based on user data"""
        profile = self.get_advanced_user_profile(user_id)
        insights = []
        
        # Analyze learning patterns
        learning_history = profile.get('learning_history', [])
        knowledge_areas = profile.get('knowledge_areas', {})
        
        # Progress insight
        if len(learning_history) > 5:
            recent_sessions = learning_history[-5:]
            topics_covered = set(session.get('topic', '') for session in recent_sessions)
            
            if len(topics_covered) > 3:
                insights.append(LearningInsight(
                    insight_type="learning_breadth",
                    message="You're exploring diverse topics - great for building comprehensive knowledge!",
                    confidence=0.8,
                    actionable_suggestion="Consider focusing deeper on 1-2 topics to build expertise",
                    learning_path=["Deep dive sessions", "Practice projects", "Peer discussions"]
                ))
            else:
                insights.append(LearningInsight(
                    insight_type="learning_focus",
                    message="You're building deep expertise in specific areas",
                    confidence=0.85,
                    actionable_suggestion="Branch out to related topics to expand your skill set",
                    learning_path=["Cross-topic projects", "Integration challenges", "System design"]
                ))
        
        # Knowledge gap analysis
        weak_areas = []
        for area, data in knowledge_areas.items():
            if isinstance(data, dict) and data.get('proficiency', 0) < 0.6:
                weak_areas.append(area)
                
        if weak_areas:
            insights.append(LearningInsight(
                insight_type="knowledge_gap",
                message=f"Areas for improvement identified: {', '.join(weak_areas[:3])}",
                confidence=0.9,
                actionable_suggestion=f"Focus your next learning sessions on {weak_areas[0]}",
                learning_path=[
                    f"Review {weak_areas[0]} fundamentals",
                    "Practice with guided examples",
                    "Build a small project using these concepts"
                ]
            ))
            
        # Learning velocity insight
        skill_progression = profile.get('skill_progression', {})
        learning_velocity = skill_progression.get('learning_velocity', 0.5)
        
        if learning_velocity > 0.7:
            insights.append(LearningInsight(
                insight_type="learning_velocity",
                message="You're learning at an excellent pace!",
                confidence=0.8,
                actionable_suggestion="Consider taking on more challenging projects or mentoring others",
                learning_path=["Advanced topics", "Open source contribution", "Teaching others"]
            ))
        elif learning_velocity < 0.3:
            insights.append(LearningInsight(
                insight_type="learning_velocity",
                message="Consider adjusting your learning approach for better retention",
                confidence=0.7,
                actionable_suggestion="Try breaking concepts into smaller chunks and practice more frequently",
                learning_path=["Micro-learning sessions", "Spaced repetition", "Practical exercises"]
            ))
            
        return insights
        
    def adapt_explanation_to_user(self, user_id: str, content: str, topic: str) -> str:
        """Adapt explanations based on user's learning preferences and level"""
        profile = self.get_advanced_user_profile(user_id)
        learning_prefs = profile.get('learning_preferences', {})
        skill_level = profile.get('skill_progression', {}).get('overall_level', 'beginner')
        
        # Adjust explanation depth
        explanation_depth = learning_prefs.get('explanation_depth', 'detailed')
        primary_style = learning_prefs.get('primary_style', 'hands_on')
        
        adaptation_prompt = f"""
        Adapt this explanation for a {skill_level} level learner who prefers {primary_style} learning style.
        Explanation depth preference: {explanation_depth}
        
        Original content: {content}
        Topic: {topic}
        
        Please provide an adapted explanation that:
        1. Matches the user's skill level
        2. Uses their preferred learning style
        3. Includes the appropriate level of detail
        4. Provides actionable next steps
        """
        
        if self.gemini_model:
            try:
                response = self.gemini_model.generate_content(adaptation_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Error adapting explanation: {e}")
                
        # Fallback adaptation
        if skill_level == 'beginner':
            return f"Beginner-friendly explanation: {content}\n\nNext steps: Practice with simple examples and build gradually."
        elif skill_level == 'advanced':
            return f"Advanced perspective: {content}\n\nConsider: How does this relate to system design and performance optimization?"
        else:
            return f"Detailed explanation: {content}\n\nPractice: Try implementing variations of this concept."
            
    def track_learning_progress(self, user_id: str, interaction_data: Dict[str, Any]):
        """Track and update user's learning progress"""
        profile = self.get_advanced_user_profile(user_id)
        
        # Add to learning history
        if 'learning_history' not in profile:
            profile['learning_history'] = []
            
        interaction_data['timestamp'] = datetime.now().isoformat()
        profile['learning_history'].append(interaction_data)
        
        # Update knowledge areas
        topic = interaction_data.get('topic', '')
        success_rate = interaction_data.get('success_rate', 0.5)
        
        if topic:
            if topic not in profile['knowledge_areas']:
                profile['knowledge_areas'][topic] = {
                    'proficiency': 0.1,
                    'interactions': 0,
                    'last_practiced': datetime.now().isoformat()
                }
                
            area = profile['knowledge_areas'][topic]
            area['interactions'] += 1
            area['last_practiced'] = datetime.now().isoformat()
            
            # Update proficiency with learning curve
            current_proficiency = area['proficiency']
            learning_rate = 0.1  # How much each interaction improves proficiency
            area['proficiency'] = min(1.0, current_proficiency + (success_rate * learning_rate))
            
        # Update overall learning velocity
        recent_interactions = profile['learning_history'][-10:]  # Last 10 interactions
        if len(recent_interactions) >= 5:
            avg_success = sum(interaction.get('success_rate', 0.5) for interaction in recent_interactions) / len(recent_interactions)
            profile['skill_progression']['learning_velocity'] = avg_success
            
        self._save_advanced_profile(user_id, profile)
        
        return profile

# Global instance
advanced_personalization_agent = AdvancedPersonalizationAgent()
