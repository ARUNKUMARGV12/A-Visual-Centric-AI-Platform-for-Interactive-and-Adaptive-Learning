"""
Enhanced Learning & Personalization Agent
Handles user skill assessment, learning adaptation, and personalized recommendations
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class LearningStyle(Enum):
    VISUAL = "visual"
    TEXTUAL = "textual"
    INTERACTIVE = "interactive"
    STEP_BY_STEP = "step_by_step"

class CodeComplexity(Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    ADVANCED = "advanced"

@dataclass
class CodeAnalysis:
    complexity_score: float
    readability_score: float
    security_issues: List[str]
    performance_issues: List[str]
    best_practices_violations: List[str]
    suggested_improvements: List[str]
    algorithm_explanation: str

@dataclass
class LearningProgress:
    topic: str
    skill_level: SkillLevel
    progress_percentage: float
    last_interaction: datetime
    strengths: List[str]
    areas_for_improvement: List[str]
    recommended_next_steps: List[str]

@dataclass
class PersonalizedFeedback:
    user_level: SkillLevel
    explanation_complexity: CodeComplexity
    suggestions: List[str]
    learning_resources: List[str]
    next_challenges: List[str]

class EnhancedLearningAgent:
    def __init__(self, user_profiles_dir: str = "user_profiles"):
        self.user_profiles_dir = user_profiles_dir
        self.ensure_profiles_directory()
        
    def ensure_profiles_directory(self):
        """Ensure the user profiles directory exists"""
        if not os.path.exists(self.user_profiles_dir):
            os.makedirs(self.user_profiles_dir)
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get or create user profile with enhanced learning features"""
        profile_path = os.path.join(self.user_profiles_dir, f"user_{user_id}.json")
        
        if os.path.exists(profile_path):
            with open(profile_path, 'r') as f:
                profile = json.load(f)
                # Migrate old profile to new structure if needed
                return self._migrate_profile_structure(profile)
        else:
            # Create new enhanced profile and save it
            new_profile = self._create_enhanced_profile()
            self._save_user_profile(user_id, new_profile) # Save the new profile
            return new_profile
    
    def _create_enhanced_profile(self) -> Dict[str, Any]:
        """Create a new enhanced user profile"""
        return {
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "interactions_count": 0,
            "skill_level": SkillLevel.BEGINNER.value,
            "learning_style": [LearningStyle.VISUAL.value],
            "knowledge_areas": {},
            "coding_patterns": {
                "preferred_languages": [],
                "common_mistakes": [],
                "improvement_areas": [],
                "coding_style_preferences": {}
            },
            "learning_progress": {},
            "session_history": [],
            "personalization_data": {
                "explanation_complexity_preference": CodeComplexity.SIMPLE.value,
                "feedback_frequency": "moderate",
                "preferred_learning_path": "structured"
            },
            "performance_metrics": {
                "code_understanding_score": 0.0,
                "problem_solving_speed": 0.0,
                "concept_retention": 0.0
            },
            "adaptive_recommendations": []
        }
    
    def _migrate_profile_structure(self, old_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Migrate old profile structure to new enhanced structure"""
        enhanced_profile = self._create_enhanced_profile()
        
        # Migrate existing data
        for key in ["created_at", "interactions_count", "skill_level", "knowledge_areas", "session_history"]:
            if key in old_profile:
                enhanced_profile[key] = old_profile[key]
        
        enhanced_profile["updated_at"] = datetime.now().isoformat()
        return enhanced_profile
    
    def analyze_code_quality(self, code: str, language: str = "javascript") -> CodeAnalysis:
        """Analyze code for quality, complexity, and provide educational feedback"""
        analysis = CodeAnalysis(
            complexity_score=self._calculate_complexity(code),
            readability_score=self._calculate_readability(code),
            security_issues=self._detect_security_issues(code, language),
            performance_issues=self._detect_performance_issues(code, language),
            best_practices_violations=self._check_best_practices(code, language),
            suggested_improvements=self._generate_improvements(code, language),
            algorithm_explanation=self._explain_algorithm(code, language)
        )
        return analysis
    
    def _calculate_complexity(self, code: str) -> float:
        """Calculate cyclomatic complexity score"""
        # Simplified complexity calculation
        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        # Count decision points
        decision_keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch']
        complexity = 1  # Base complexity
        
        for line in non_empty_lines:
            for keyword in decision_keywords:
                if keyword in line.lower():
                    complexity += 1
        
        # Normalize to 0-10 scale
        return min(complexity / len(non_empty_lines) * 10, 10.0) if non_empty_lines else 1.0
    
    def _calculate_readability(self, code: str) -> float:
        """Calculate code readability score"""
        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        if not non_empty_lines:
            return 0.0
        
        # Factors affecting readability
        avg_line_length = sum(len(line) for line in non_empty_lines) / len(non_empty_lines)
        comment_ratio = sum(1 for line in lines if '//' in line or '/*' in line) / len(lines)
        indentation_consistency = self._check_indentation_consistency(lines)
        
        # Calculate score (0-10)
        line_length_score = max(0, 10 - (avg_line_length - 50) / 10) if avg_line_length > 50 else 10
        comment_score = min(comment_ratio * 20, 10)
        
        return (line_length_score + comment_score + indentation_consistency) / 3
    
    def _check_indentation_consistency(self, lines: List[str]) -> float:
        """Check consistency of indentation"""
        indent_sizes = []
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                if indent > 0:
                    indent_sizes.append(indent)
        
        if not indent_sizes:
            return 10.0
        
        # Check if indentation is consistent
        consistent = all(indent % 2 == 0 or indent % 4 == 0 for indent in indent_sizes)
        return 10.0 if consistent else 5.0
    
    def _detect_security_issues(self, code: str, language: str) -> List[str]:
        """Detect potential security vulnerabilities"""
        issues = []
        code_lower = code.lower()
        
        # Common security issues
        if 'eval(' in code_lower:
            issues.append("Avoid using eval() as it can execute arbitrary code")
        
        if 'innerhtml' in code_lower and '=' in code_lower:
            issues.append("Using innerHTML with user input can lead to XSS vulnerabilities")
        
        if 'document.write' in code_lower:
            issues.append("document.write() can be dangerous and should be avoided")
        
        if language == "javascript" and 'localstorage' in code_lower:
            issues.append("Be cautious storing sensitive data in localStorage")
        
        return issues
    
    def _detect_performance_issues(self, code: str, language: str) -> List[str]:
        """Detect potential performance problems"""
        issues = []
        lines = code.split('\n')
        
        # Check for common performance issues
        for line in lines:
            line_lower = line.lower().strip()
            
            if 'getelementbyid' in line_lower and line_lower.count('getelementbyid') > 1:
                issues.append("Multiple DOM queries in a loop can hurt performance - consider caching elements")
            
            if 'for' in line_lower and 'length' in line_lower and not 'var' in line_lower:
                issues.append("Cache array.length in loop condition for better performance")
            
            if '+=' in line and 'string' in line_lower:
                issues.append("String concatenation in loops is inefficient - consider using array.join()")
        
        return issues
    
    def _check_best_practices(self, code: str, language: str) -> List[str]:
        """Check for best practices violations"""
        violations = []
        lines = code.split('\n')
        
        # Check for common best practices
        has_comments = any('//' in line or '/*' in line for line in lines)
        if not has_comments and len(lines) > 10:
            violations.append("Add comments to explain complex logic")
        
        # Check for magic numbers
        import re
        magic_numbers = re.findall(r'\b\d{2,}\b', code)
        if magic_numbers:
            violations.append("Consider using named constants instead of magic numbers")
        
        # Check for consistent naming
        function_names = re.findall(r'function\s+(\w+)', code)
        if function_names:
            inconsistent_naming = any('_' in name and any(c.isupper() for c in name) for name in function_names)
            if inconsistent_naming:
                violations.append("Use consistent naming convention (camelCase or snake_case)")
        
        return violations
    
    def _generate_improvements(self, code: str, language: str) -> List[str]:
        """Generate specific improvement suggestions"""
        improvements = []
        
        # Analyze code structure and suggest improvements
        if 'var ' in code:
            improvements.append("Consider using 'let' or 'const' instead of 'var' for better scoping")
        
        if code.count('function') > 3:
            improvements.append("Consider breaking down large functions into smaller, reusable components")
        
        if 'console.log' in code:
            improvements.append("Remove console.log statements before production deployment")
        
        return improvements
    
    def _explain_algorithm(self, code: str, language: str) -> str:
        """Generate algorithm explanation based on code structure"""
        lines = code.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        explanation = "This code performs the following operations:\n"
        
        # Analyze code patterns
        if any('for' in line or 'while' in line for line in non_empty_lines):
            explanation += "• Uses loops for iterative processing\n"
        
        if any('if' in line for line in non_empty_lines):
            explanation += "• Contains conditional logic for decision making\n"
        
        if any('function' in line for line in non_empty_lines):
            explanation += "• Defines reusable functions for modular code organization\n"
        
        if any('return' in line for line in non_empty_lines):
            explanation += "• Returns values for further processing or display\n"
        
        return explanation
    
    def get_personalized_feedback(self, user_id: str, code: str, language: str) -> PersonalizedFeedback:
        """Generate personalized feedback based on user's skill level and learning history"""
        profile = self.get_user_profile(user_id)
        analysis = self.analyze_code_quality(code, language)
        
        user_level = SkillLevel(profile.get('skill_level', 'beginner'))
        
        # Adapt feedback complexity based on user level
        if user_level == SkillLevel.BEGINNER:
            complexity = CodeComplexity.SIMPLE
            suggestions = self._generate_beginner_suggestions(analysis)
        elif user_level == SkillLevel.INTERMEDIATE:
            complexity = CodeComplexity.MODERATE
            suggestions = self._generate_intermediate_suggestions(analysis)
        else:
            complexity = CodeComplexity.COMPLEX
            suggestions = self._generate_advanced_suggestions(analysis)
        
        return PersonalizedFeedback(
            user_level=user_level,
            explanation_complexity=complexity,
            suggestions=suggestions,
            learning_resources=self._recommend_learning_resources(user_level, language),
            next_challenges=self._suggest_next_challenges(user_level, language)
        )
    
    def _generate_beginner_suggestions(self, analysis: CodeAnalysis) -> List[str]:
        """Generate beginner-friendly suggestions"""
        suggestions = []
        
        if analysis.complexity_score > 5:
            suggestions.append("Try breaking this into smaller, simpler functions")
        
        if analysis.readability_score < 7:
            suggestions.append("Add more comments to explain what each part does")
        
        suggestions.extend(analysis.suggested_improvements[:2])  # Limit to top 2
        return suggestions
    
    def _generate_intermediate_suggestions(self, analysis: CodeAnalysis) -> List[str]:
        """Generate intermediate-level suggestions"""
        suggestions = analysis.suggested_improvements.copy()
        
        if analysis.security_issues:
            suggestions.extend(analysis.security_issues[:2])
        
        if analysis.performance_issues:
            suggestions.append("Consider these performance optimizations: " + analysis.performance_issues[0])
        
        return suggestions
    
    def _generate_advanced_suggestions(self, analysis: CodeAnalysis) -> List[str]:
        """Generate advanced-level suggestions"""
        suggestions = analysis.suggested_improvements.copy()
        suggestions.extend(analysis.security_issues)
        suggestions.extend(analysis.performance_issues)
        suggestions.extend(analysis.best_practices_violations)
        
        return suggestions
    
    def _recommend_learning_resources(self, user_level: SkillLevel, language: str) -> List[str]:
        """Recommend learning resources based on user level"""
        base_resources = {
            "javascript": {
                SkillLevel.BEGINNER: [
                    "MDN Web Docs - JavaScript Basics",
                    "freeCodeCamp JavaScript Course",
                    "JavaScript.info tutorial"
                ],
                SkillLevel.INTERMEDIATE: [
                    "You Don't Know JS book series",
                    "JavaScript Design Patterns",
                    "ES6+ features guide"
                ],
                SkillLevel.ADVANCED: [
                    "Advanced JavaScript Concepts",
                    "JavaScript Performance Optimization",
                    "Node.js Best Practices"
                ]
            }
        }
        
        return base_resources.get(language, {}).get(user_level, ["General programming resources"])
    
    def _suggest_next_challenges(self, user_level: SkillLevel, language: str) -> List[str]:
        """Suggest next coding challenges based on user level"""
        challenges = {
            SkillLevel.BEGINNER: [
                "Create a simple calculator",
                "Build a to-do list app",
                "Make a basic form validator"
            ],
            SkillLevel.INTERMEDIATE: [
                "Build a weather app with API integration",
                "Create a memory game",
                "Implement a simple state management system"
            ],
            SkillLevel.ADVANCED: [
                "Build a real-time chat application",
                "Create a custom framework",
                "Implement complex algorithms and data structures"
            ]
        }
        
        return challenges.get(user_level, ["Practice coding daily"])
    
    def update_user_learning_progress(self, user_id: str, interaction_data: Dict[str, Any]):
        """Update user's learning progress based on interaction"""
        profile = self.get_user_profile(user_id)
        
        # Update interaction count
        profile['interactions_count'] += 1
        profile['updated_at'] = datetime.now().isoformat()
        
        # Update knowledge areas
        topic = interaction_data.get('topic', 'general')
        if topic not in profile['knowledge_areas']:
            profile['knowledge_areas'][topic] = {
                'interactions': 0,
                'estimated_skill': 'beginner',
                'last_interaction': datetime.now().isoformat()
            }
        
        profile['knowledge_areas'][topic]['interactions'] += 1
        profile['knowledge_areas'][topic]['last_interaction'] = datetime.now().isoformat()
        
        # Add to session history
        profile['session_history'].append({
            'timestamp': datetime.now().isoformat(),
            'interaction_type': interaction_data.get('type', 'code_review'),
            'topic': topic,
            'code_complexity': interaction_data.get('complexity', 'simple'),
            'feedback_provided': interaction_data.get('feedback_provided', False)
        })
        
        # Save updated profile
        self._save_user_profile(user_id, profile)
        
        return profile
    
    def _save_user_profile(self, user_id: str, profile: Dict[str, Any]):
        """Save user profile to file"""
        profile_path = os.path.join(self.user_profiles_dir, f"user_{user_id}.json")
        with open(profile_path, 'w') as f:
            json.dump(profile, f, indent=2)
    
    def assess_skill_level(self, user_id: str, code_samples: List[str]) -> SkillLevel:
        """Assess user's skill level based on code samples"""
        if not code_samples:
            return SkillLevel.BEGINNER
        
        total_complexity = 0
        total_readability = 0
        
        for code in code_samples:
            analysis = self.analyze_code_quality(code)
            total_complexity += analysis.complexity_score
            total_readability += analysis.readability_score
        
        avg_complexity = total_complexity / len(code_samples)
        avg_readability = total_readability / len(code_samples)
        
        # Determine skill level based on complexity and readability
        if avg_complexity < 3 and avg_readability < 6:
            return SkillLevel.BEGINNER
        elif avg_complexity < 6 and avg_readability < 8:
            return SkillLevel.INTERMEDIATE
        elif avg_complexity < 8:
            return SkillLevel.ADVANCED
        else:
            return SkillLevel.EXPERT

# Global instance
learning_agent = EnhancedLearningAgent()
