"""
Personalization Agent Package

This agent learns from student interactions and tailors content to their learning style.
It also maintains user context objects across sessions and provides personalized recommendations.
"""

from .agent import PersonalizationAgent
from .user_context import (
    get_user_context, 
    create_context_for_request, 
    UserContext,
    UserContextManager
)
from .recommendations import (
    get_personalized_recommendations,
    adapt_response_for_user,
    PersonalizedRecommendations
)

__all__ = [
    'PersonalizationAgent',
    'get_user_context',
    'create_context_for_request',
    'UserContext',
    'UserContextManager',
    'get_personalized_recommendations',
    'adapt_response_for_user',
    'PersonalizedRecommendations'
]
