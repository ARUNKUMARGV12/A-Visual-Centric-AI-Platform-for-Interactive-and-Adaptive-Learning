#!/usr/bin/env python3
"""
Debug script to test Gemini API directly for related questions generation
"""

import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(os.path.join("backend", ".env"))

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = "gemini-2.0-flash"

print(f"GEMINI_API_KEY exists: {bool(GEMINI_API_KEY)}")
print(f"GEMINI_API_KEY (first 10 chars): {GEMINI_API_KEY[:10] if GEMINI_API_KEY else 'None'}")

try:
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)
    print(f"✅ Gemini model '{GEMINI_MODEL_NAME}' initialized successfully")
    
    # Test basic content generation
    test_query = "What is machine learning?"
    test_answer = "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
    
    related_questions_prompt = f"""
Based on this query and answer, generate exactly 3 related questions that would help the user explore this topic further. Return ONLY the questions, each on a new line starting with "- ".

Query: {test_query}
Answer: {test_answer}

- """
    
    print(f"\n🔄 Testing related questions generation...")
    print(f"Prompt being sent:\n{related_questions_prompt}")
    
    # Generate related questions
    response = model.generate_content(
        related_questions_prompt,
        generation_config={
            "max_output_tokens": 200,
            "temperature": 0.8,
            "top_p": 0.9
        }
    )
    
    print(f"\n✅ Raw response from Gemini:")
    print(response.text)
    
    # Parse the questions like the backend does
    related_questions = []
    if response.text:
        lines = response.text.strip().split("\n")
        for line in lines:
            line = line.strip()
            # Skip empty lines and introductory text
            if not line or line.lower().startswith(("here are", "based on", "suggested", "questions:")):
                continue
            
            # Extract question from different formats
            question = ""
            if line.startswith(("- ", "* ")):
                question = line[2:].strip()
            elif len(line) > 2 and line[0].isdigit() and line[1] in (".", ")", " "):
                # Handle numbered lists like "1. Question"
                idx = 0
                while idx < len(line) and (line[idx].isdigit() or line[idx] in (".", ")", " ")):
                    idx += 1
                question = line[idx:].strip()
            elif line and not line.lower().startswith(("here", "based", "suggested")):
                question = line.strip()
            
            # Add question if valid and unique
            if question and len(related_questions) < 3:
                # Check for duplicates (case-insensitive)
                if not any(question.lower() == existing.lower() for existing in related_questions):
                    related_questions.append(question)
            
            if len(related_questions) >= 3:
                break
    
    print(f"\n✅ Parsed related questions:")
    for i, q in enumerate(related_questions, 1):
        print(f"  {i}. {q}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
