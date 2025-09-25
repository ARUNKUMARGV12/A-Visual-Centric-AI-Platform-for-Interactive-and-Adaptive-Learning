import requests
import json

# Test script to verify related questions functionality
API_URL = "http://localhost:8000"

def test_related_questions():
    # Test query
    test_query = "What is machine learning?"
    
    payload = {
        "query": test_query,
        "use_source_only": False
    }
    
    print(f"Testing query: '{test_query}'")
    print("Sending request to backend...")
    
    try:
        response = requests.post(f"{API_URL}/query", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Request successful!")
            print(f"📝 Answer length: {len(data.get('answer', ''))}")
            print(f"📚 Sources count: {len(data.get('source_documents', []))}")
            print(f"🎥 Videos count: {len(data.get('youtube_videos', []))}")
            
            related_questions = data.get('related_questions', [])
            print(f"❓ Related questions count: {len(related_questions)}")
            
            if related_questions:
                print("Related questions received:")
                for i, question in enumerate(related_questions, 1):
                    print(f"  {i}. {question}")
                return True
            else:
                print("❌ No related questions received from backend")
                return False
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error making request: {e}")
        return False

if __name__ == "__main__":
    test_related_questions()
