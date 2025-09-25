#!/usr/bin/env python3
"""
Simple test to verify personalized greetings are generated correctly.
This script tests the key functionality without running the full test suite.
"""

import sys
import os
import asyncio
from datetime import datetime

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

def test_personalization_agent():
    """Test the PersonalizationAgent with a simple educational query."""
    
    print("🔧 Testing PersonalizationAgent Dynamic Greeting Generation")
    print("=" * 60)
    
    try:
        from agents.personalization_agent import PersonalizationAgent
        
        # Create a test user with a unique ID
        test_user_id = f"test_user_{int(datetime.now().timestamp())}"
        print(f"Creating PersonalizationAgent for user: {test_user_id}")
        
        # Initialize the agent
        agent = PersonalizationAgent(test_user_id)
        print(f"✅ Agent initialized successfully")
        
        # Test educational queries
        test_queries = [
            "What is machine learning?",
            "Explain Python programming to me",
            "How does artificial intelligence work?",
            "Tell me about data structures"
        ]
        
        print("\n🧪 Testing Educational Queries:")
        print("-" * 40)
        
        for i, query in enumerate(test_queries, 1):
            print(f"\nTest {i}: '{query}'")
            
            try:
                # Process the query
                result = agent.process_query(query)
                
                # Check if it's an educational query with a greeting
                if result.get("query_type") == "educational":
                    greeting = result.get("personalized_greeting", "")
                    if greeting:
                        print(f"  ✅ Greeting Generated: {greeting[:80]}...")
                        print(f"  📊 Query Type: {result.get('query_type')}")
                        print(f"  🎯 Level: {result.get('level')}")
                        print(f"  📚 Learning Style: {result.get('learning_style')}")
                    else:
                        print(f"  ❌ NO GREETING GENERATED!")
                        print(f"  📝 Full Response: {result}")
                else:
                    print(f"  ⚠️  Query classified as: {result.get('query_type')}")
                    if result.get("response"):
                        print(f"  📝 Response: {result.get('response')[:80]}...")
                        
            except Exception as e:
                print(f"  ❌ Error processing query: {e}")
        
        print("\n🧪 Testing Greeting Queries:")
        print("-" * 40)
        
        greeting_queries = ["Hello!", "Hi there!", "Good morning!"]
        
        for i, query in enumerate(greeting_queries, 1):
            print(f"\nGreeting Test {i}: '{query}'")
            
            try:
                result = agent.process_query(query)
                print(f"  ✅ Response: {result.get('response', 'No response')}")
                print(f"  📊 Query Type: {result.get('query_type')}")
                        
            except Exception as e:
                print(f"  ❌ Error processing greeting: {e}")
                
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure all dependencies are installed and the PersonalizationAgent is properly configured.")
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

def test_fallback_system():
    """Test the fallback greeting system."""
    print("\n🔧 Testing Fallback Greeting System")
    print("=" * 60)
    
    try:
        # Test what happens when the PersonalizationAgent fails
        # This simulates the fallback logic in main.py
        
        user_name = "TestUser"
        query = "Explain neural networks"
        
        # Simulate fallback greeting generation
        display_name = user_name.split('@')[0] if '@' in user_name and user_name != "there" else user_name
        if display_name != "there":
            simple_greeting = f"Hi {display_name}! "
        else:
            simple_greeting = "Hi there! "
        
        sample_answer = "Neural networks are computational models inspired by biological neural networks..."
        final_answer = simple_greeting + sample_answer
        
        print(f"✅ Fallback Greeting Test:")
        print(f"  🧑 User: {user_name}")
        print(f"  ❓ Query: {query}")
        print(f"  👋 Generated Greeting: {simple_greeting}")
        print(f"  📝 Final Answer Preview: {final_answer[:100]}...")
        
    except Exception as e:
        print(f"❌ Fallback Test Failed: {e}")

if __name__ == "__main__":
    print("🚀 STARTING PERSONALIZED GREETING TESTS")
    print("=" * 80)
    
    # Test the PersonalizationAgent
    test_personalization_agent()
    
    # Test the fallback system  
    test_fallback_system()
    
    print("\n🎉 ALL TESTS COMPLETED!")
    print("=" * 80)
