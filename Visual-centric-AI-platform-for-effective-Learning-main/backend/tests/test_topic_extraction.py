#!/usr/bin/env python3
"""Quick test to verify topic extraction is working properly."""

import sys
import os

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from agents.personalization_agent import PersonalizationAgent
    from datetime import datetime
    
    # Create test user
    test_user_id = f"test_user_{int(datetime.now().timestamp())}"
    agent = PersonalizationAgent(test_user_id)
    
    # Test queries
    test_queries = [
        "What is machine learning?",
        "Explain Python programming to me",
        "How does artificial intelligence work?",
        "Tell me about data structures",
        "i want to learn natural language processing",
        "explain neural networks",
        "how does machine learning work"
    ]
    
    print("🔬 Testing Topic Extraction")
    print("=" * 50)
    
    for query in test_queries:
        extracted_topic = agent._extract_topic_from_query(query)
        print(f"Query: '{query}'")
        print(f"Topic: '{extracted_topic}'")
        print("-" * 30)
        
except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
