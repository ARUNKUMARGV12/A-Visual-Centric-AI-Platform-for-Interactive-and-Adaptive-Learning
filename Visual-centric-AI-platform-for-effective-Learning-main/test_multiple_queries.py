#!/usr/bin/env python3
"""
Test script to verify backend generates contextually relevant related questions
"""

import asyncio
import aiohttp
import json

async def test_query(query):
    print(f"\n🔍 Testing query: '{query}'")
    
    async with aiohttp.ClientSession() as session:
        payload = {
            "query": query,
            "use_source_only": False
        }
        
        try:
            async with session.post("http://localhost:8000/query", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Request successful!")
                    print(f"📝 Answer (first 100 chars): {data.get('answer', '')[:100]}...")
                    print(f"❓ Related questions count: {len(data.get('related_questions', []))}")
                    print("Related questions received:")
                    for i, question in enumerate(data.get("related_questions", []), 1):
                        print(f"  {i}. {question}")
                    return True
                else:
                    print(f"❌ Request failed with status: {response.status}")
                    print(await response.text())
                    return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

async def main():
    test_queries = [
        "What is machine learning?",
        "Explain photosynthesis",
        "How do neural networks work?",
        "What is the water cycle?",
        "Explain quantum computing"
    ]
    
    print("🚀 Testing multiple queries for contextually relevant related questions...")
    
    for query in test_queries:
        success = await test_query(query)
        if not success:
            print(f"❌ Failed for query: {query}")
        await asyncio.sleep(1)  # Small delay between requests

if __name__ == "__main__":
    asyncio.run(main())
