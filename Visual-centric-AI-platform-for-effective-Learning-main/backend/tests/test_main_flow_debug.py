#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.personalization_agent import PersonalizationAgent
import json

def test_main_flow_simulation():
    print("🔍 Testing Main.py Flow Simulation")
    print("=" * 60)
    
    # Simulate the exact user_id and query processing from main.py
    user_id = "yogish057@gmail.com"
    test_queries = [
        "what is machine learning",
        "explain python programming",
        "hello",
        "hi there"
    ]
    
    for query in test_queries:
        print(f"\n🔬 Testing query: '{query}'")
        print("-" * 40)
        
        # Simulate the enhanced_query logic from main.py
        enhanced_query = query.strip()
        query_lower = query.lower()
        
        # Check if it's a simple greeting (this is from main.py logic)
        greeting_phrases = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
        is_simple_greeting = any(query_lower.strip().startswith(phrase) or query_lower.strip() == phrase for phrase in greeting_phrases)
        
        print(f"📝 Enhanced query: '{enhanced_query}'")
        print(f"📝 Is simple greeting: {is_simple_greeting}")
        
        # If it's a simple greeting, main.py returns early with hardcoded greeting
        if is_simple_greeting:
            print("⚠️  MAIN.PY WILL RETURN EARLY WITH HARDCODED GREETING!")
            hardcoded_greeting = f"Hi yogish057! Great to see you back. What would you like to learn about today?"
            print(f"🔄 Hardcoded greeting: {hardcoded_greeting}")
            continue
        
        # Otherwise, call PersonalizationAgent (like main.py does)
        try:
            print(f"🤖 Creating PersonalizationAgent for user_id: {user_id}")
            agent = PersonalizationAgent(user_id)
            
            # Process the query and get personalization data
            personalization_data = agent.process_query(enhanced_query)
            print(f"📊 Personalization data: {json.dumps(personalization_data, indent=2)}")
            
            # Check the query type (this determines the flow in main.py)
            query_type = personalization_data.get("query_type", "")
            print(f"🏷️  Query type: {query_type}")
            
            if query_type == "greeting":
                print("⚠️  PERSONALIZATION AGENT RETURNED GREETING TYPE - MAIN.PY WILL OVERRIDE!")
                hardcoded_greeting = f"Hi yogish057! Great to see you back. What would you like to learn about today?"
                print(f"🔄 Hardcoded override: {hardcoded_greeting}")
                
            elif query_type == "educational":
                print("✅ EDUCATIONAL QUERY - SHOULD USE PERSONALIZED GREETING")
                personalized_greeting = personalization_data.get("personalized_greeting", "")
                if personalized_greeting:
                    print(f"🎉 Personalized greeting found: '{personalized_greeting}'")
                    
                    # Simulate the greeting cleaning logic from main.py
                    greeting_parts = personalized_greeting.split('\n')
                    clean_greeting = greeting_parts[0]  # Take only the first line as greeting
                    
                    # Clean up any instruction text that might have leaked
                    if "Personalization Instructions:" in clean_greeting:
                        clean_greeting = clean_greeting.split("Personalization Instructions:")[0].strip()
                    
                    print(f"🧹 Clean greeting: '{clean_greeting}'")
                else:
                    print("❌ No personalized greeting found!")
            else:
                print(f"❓ Unknown query type: {query_type}")
                
        except Exception as e:
            print(f"❌ Error with PersonalizationAgent: {e}")

if __name__ == "__main__":
    test_main_flow_simulation()
