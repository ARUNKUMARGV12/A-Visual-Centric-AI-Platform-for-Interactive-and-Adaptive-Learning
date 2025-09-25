#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.personalization_agent import PersonalizationAgent
import json

def test_personalization_agent():
    print("🔍 Testing PersonalizationAgent Greeting Generation")
    print("=" * 60)
    
    # Initialize the agent
    try:
        agent = PersonalizationAgent("yogish057@gmail.com")
        print(f"✅ PersonalizationAgent initialized for user: yogish057@gmail.com")
        print(f"📋 User profile: {agent.user_profile.get('name', 'Unknown')}")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize PersonalizationAgent: {e}")
        return
    
    # Test queries
    test_queries = [
        "What is machine learning?",
        "Explain Python programming to me",
        "How does artificial intelligence work?",
        "Tell me about data structures"
    ]
    
    for query in test_queries:
        print(f"🔬 Testing query: '{query}'")
        print("-" * 40)
        
        try:
            # Process the query
            result = agent.process_query(query)
            
            print(f"📤 Raw result type: {type(result)}")
            print(f"📤 Raw result: {json.dumps(result, indent=2)}")
            
            # Check if we have a personalized greeting
            if result.get("personalized_greeting"):
                print(f"✅ Personalized greeting found: '{result['personalized_greeting']}'")
            else:
                print(f"❌ No personalized greeting found")
            
            print()
            
        except Exception as e:
            print(f"❌ Error processing query: {e}")
            print()

if __name__ == "__main__":
    test_personalization_agent()
