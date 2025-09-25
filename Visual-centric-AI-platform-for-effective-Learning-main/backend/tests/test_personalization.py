"""
Test script for the personalization system.
This script demonstrates how the personalization system works with different user contexts.
"""

import json
import os
import sys
from pathlib import Path

# Add the parent directory to the path to allow importing the agents
sys.path.append(str(Path(__file__).parent))

from agents.personalization import (
    get_user_context,
    create_context_for_request,
    get_personalized_recommendations,
    adapt_response_for_user
)
from agents.personalization.example_responses import (
    get_sample_user_context,
    get_example_response
)

def test_user_context_creation():
    """Test creating and updating user context"""
    print("\n=== Testing User Context Creation ===")
    
    # Create a test user context
    user_id = "test_user_123"
    user_context = get_user_context(user_id)
    
    # Print initial context
    print(f"Initial context for {user_id}:")
    print(json.dumps(user_context.context, indent=2))
    
    # Update context with new information
    updates = {
        "preferences": {
            "learningStyle": "visual",
            "weakTopics": ["Recursion", "DBMS"],
            "goals": ["Master Python", "Learn SQL"]
        },
        "skillLevel": "intermediate"
    }
    
    updated_context = user_context.update_context(updates)
    
    # Print updated context
    print(f"\nUpdated context for {user_id}:")
    print(json.dumps(updated_context, indent=2))
    
    # Track a query to update context further
    user_context.update_from_query("How do I optimize SQL queries?")
    
    # Print context after query
    print(f"\nContext after query for {user_id}:")
    print(json.dumps(user_context.context, indent=2))
    
    return user_context

def test_personalized_recommendations(user_context):
    """Test generating personalized recommendations"""
    print("\n=== Testing Personalized Recommendations ===")
    
    # Get personalized recommendations
    recommendations = get_personalized_recommendations(user_context.user_id)
    
    # Get dashboard widgets
    dashboard_widgets = recommendations.get_dashboard_widgets()
    print("\nDashboard Widgets:")
    print(json.dumps(dashboard_widgets["welcomeMessage"], indent=2))
    print("\nFlashcard Recommendations:")
    print(json.dumps(dashboard_widgets["flashcards"]["items"][:2], indent=2))
    print("\nGame Recommendations:")
    print(json.dumps(dashboard_widgets["gameRecommendation"]["featuredGame"], indent=2))
    
    # Get sidebar widgets
    sidebar_widgets = recommendations.get_sidebar_widgets()
    print("\nSidebar Widgets:")
    print(json.dumps(sidebar_widgets["weakTopics"], indent=2))
    print("\nRecent Activity:")
    print(json.dumps(sidebar_widgets["recentActivity"], indent=2))
    
    return recommendations

def test_response_adaptation():
    """Test adapting responses based on user context"""
    print("\n=== Testing Response Adaptation ===")
    
    # Test with different user contexts from examples
    context_types = ["visual_dbms_student", "beginner_kinesthetic", "advanced_theory"]
    
    for context_type in context_types:
        # Get the sample user context
        sample_context = get_sample_user_context(context_type)
        if not sample_context:
            print(f"No sample context found for {context_type}")
            continue
            
        print(f"\n--- Testing with {context_type} ---")
        print(f"Learning Style: {sample_context['preferences']['learningStyle']}")
        print(f"Weak Topics: {sample_context['preferences']['weakTopics']}")
        print(f"Goals: {sample_context['preferences']['goals']}")
        
        # Create a user context for this sample
        user_id = f"example_{context_type}"
        user_context = get_user_context(user_id)
        user_context.update_context(sample_context)
        
        # Get an example query for this context type
        example_query = ""
        for query in context_type_to_query:
            if context_type in query["contextType"]:
                example_query = query["query"]
                break
                
        if not example_query:
            example_query = "Explain recursion"
            
        # Get example responses
        original_response, personalized_response = get_example_response(context_type, example_query)
        
        if not original_response:
            original_response = f"This is a generic response about {example_query.split()[-1]}."
            
        print(f"\nQuery: {example_query}")
        print(f"\nOriginal Response (first 100 chars): {original_response[:100]}...")
        
        # Adapt response using our system
        adapted_response = adapt_response_for_user(user_id, original_response, example_query)
        
        print(f"\nAdapted Response (first 100 chars): {adapted_response[:100]}...")
        
        # Compare with example personalized response if available
        if personalized_response:
            print(f"\nExample Personalized Response (first 100 chars): {personalized_response[:100]}...")

def test_context_for_request():
    """Test creating context for AI request"""
    print("\n=== Testing Context for AI Request ===")
    
    # Create a test user context
    user_id = "test_user_456"
    user_context = get_user_context(user_id)
    
    # Update with some preferences
    updates = {
        "preferences": {
            "learningStyle": "kinesthetic",
            "weakTopics": ["Algorithms", "Data Structures"],
            "goals": ["Improve problem-solving skills"]
        },
        "skillLevel": "beginner",
        "lastActivity": "Completed sorting algorithms tutorial",
        "recentQuestions": ["How does quicksort work?", "What is the time complexity of bubble sort?"]
    }
    
    user_context.update_context(updates)
    
    # Create a request with the user ID
    request_data = {
        "user_id": user_id,
        "query": "Explain binary search algorithm"
    }
    
    # Create context for AI request
    ai_context = create_context_for_request(request_data)
    
    # Print the context
    print("\nContext for AI Request:")
    print(json.dumps(ai_context, indent=2))
    
    return ai_context

# Sample queries for different context types
context_type_to_query = [
    {"contextType": "visual_dbms_student", "query": "Can you explain database normalization?"},
    {"contextType": "visual_dbms_student", "query": "What is a deadlock in operating systems?"},
    {"contextType": "beginner_kinesthetic", "query": "How does recursion work in Python?"},
    {"contextType": "advanced_theory", "query": "Explain B+ trees and their advantages"}
]

if __name__ == "__main__":
    # Run tests
    user_context = test_user_context_creation()
    test_personalized_recommendations(user_context)
    test_response_adaptation()
    test_context_for_request()
    
    print("\n=== All tests completed ===")
