import speech_recognition as sr
import pyttsx3
import google.generativeai as genai
import os
import re
import uuid
from typing import Dict, List, Optional, Any, Tuple
from fastapi import HTTPException
import PyPDF2
import docx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

try:
    genai.configure(api_key=api_key)
    # Configure Gemini model
    model = genai.GenerativeModel('gemini-pro')
    chat = model.start_chat(history=[])
    logger.info("Gemini model initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Gemini model: {str(e)}")
    raise

def clean_text_for_speech(text: str) -> str:
    """Clean text to make it more suitable for speech synthesis."""
    # Remove code blocks and URLs
    text = re.sub(r'```[\s\S]*?```', 'Code block removed for speech.', text)
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', 'URL', text)
    # Add pauses after sentences
    text = re.sub(r'([.!?])\s+', r'\1, ', text)
    return text

def needs_detailed_response(user_input: str) -> bool:
    """Determine if the user's input requires a detailed response."""
    detailed_keywords = ['explain', 'how', 'why', 'what is', 'tell me about']
    return any(keyword in user_input.lower() for keyword in detailed_keywords)

def is_exit_command(user_input: str) -> bool:
    """Check if the user wants to exit the conversation."""
    exit_commands = ['exit', 'quit', 'bye', 'goodbye']
    return any(cmd in user_input.lower() for cmd in exit_commands)

def read_file_content(file_path: str) -> tuple[Optional[str], Optional[str]]:
    """Read content from a file (txt, pdf, or docx)."""
    try:
        if not os.path.exists(file_path):
            return None, "File not found."
        
        extension = os.path.splitext(file_path)[1].lower()
        
        if extension == '.txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read(), None
        elif extension == '.pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ' '.join(page.extract_text() for page in pdf_reader.pages)
                return text, None
        elif extension == '.docx':
            doc = docx.Document(file_path)
            text = ' '.join(paragraph.text for paragraph in doc.paragraphs)
            return text, None
        else:
            return None, "Unsupported file format. Please use .txt, .pdf, or .docx files."
    except Exception as e:
        return None, f"Error reading file: {str(e)}"

def process_response_for_speech(text: str) -> str:
    """Process the response to make it more suitable for speech output."""
    # Clean code blocks and technical symbols
    text = re.sub(r'```[\s\S]*?```', 'I have generated some code. You can see it in the text response.', text)
    text = re.sub(r'`.*?`', '', text)
    # Add pauses
    text = re.sub(r'([.!?])\s+', r'\1, ', text)
    return text

def generate_gemini_response(user_input: str, 
                           chat_history: Optional[List[Dict[str, Any]]] = None, 
                           file_context: Optional[str] = None) -> Dict[str, Any]:
    """Generate a response using the Gemini model."""
    try:
        # Format chat history for Gemini
        formatted_history = []
        if chat_history:
            for msg in chat_history:
                if isinstance(msg, dict) and 'role' in msg and 'parts' in msg:
                    formatted_history.append({
                        'role': msg['role'],
                        'parts': msg['parts']
                    })

        # Start new chat with history
        conversation = model.start_chat(history=formatted_history)
        
        # Prepare prompt with context
        prompt = user_input
        if file_context:
            prompt = f"Context:\n{file_context}\n\nUser Query: {user_input}"

        # Generate response
        response = conversation.send_message(prompt)
        
        # Extract code blocks if present
        code_block = None
        code_explanation = None
        raw_response = response.text
        
        code_match = re.search(r'```(?:[\w]*\n)?(.*?)```', raw_response, re.DOTALL)
        if code_match:
            code_block = code_match.group(1).strip()
            # Extract explanation around the code block
            parts = raw_response.split('```')
            code_explanation = ' '.join(part.strip() for part in parts if '```' not in part)
        
        return {
            "raw_response": raw_response,
            "spoken_response": process_response_for_speech(raw_response),
            "chat_history": conversation.history,
            "code_block": code_block,
            "code_explanation": code_explanation
        }
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return {
            "raw_response": f"I apologize, but I encountered an error: {str(e)}",
            "spoken_response": "I apologize, but I encountered an error. Please try again.",
            "chat_history": chat_history or []
        }

def summarize_conversation(chat_history: List[Dict[str, Any]]) -> Dict[str, str]:
    """Generate a summary of the conversation using Gemini."""
    try:
        # Format conversation for summarization
        conversation_text = "\n".join([
            f"{msg['role'].upper()}: {' '.join(msg['parts']) if isinstance(msg['parts'], list) else msg['parts']}"
            for msg in chat_history if msg.get('role') and msg.get('parts')
        ])
        
        # Request summary from Gemini
        summary_prompt = f"Please provide a concise summary of this conversation:\n\n{conversation_text}"
        response = model.generate_content(summary_prompt)
        
        return {
            "summary_text": response.text,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return {
            "summary_text": "Error generating conversation summary.",
            "status": "error",
            "error": str(e)
        }

async def process_streamed_audio(audio_chunk: bytes) -> Dict[str, Any]:
    """Process streaming audio input and return transcribed text."""
    try:
        # Here you would implement real-time audio processing
        # For now, we'll return a placeholder response
        return {
            "status": "success",
            "text": "",
            "is_final": False
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def speak_text(text: str, is_question: bool = False) -> None:
    """Convert text to speech and play it."""
    if not text:
        return

    try:
        engine = pyttsx3.init()
        # Configure speech settings
        engine.setProperty('rate', 175)     # Speed of speech
        engine.setProperty('volume', 0.9)   # Volume (0.0 to 1.0)
        
        # Adjust voice properties for questions
        if is_question:
            engine.setProperty('pitch', 110) # Slightly higher pitch for questions
        else:
            engine.setProperty('pitch', 100) # Normal pitch for statements
        
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        logger.error(f"Error in speech synthesis: {str(e)}")

def voice_assistant_main():
    """Main loop for the voice assistant."""
    print("Voice Assistant with Gemini is now active. Say 'exit' or 'quit' to stop.")
    speak_text("Hello! I'm your voice assistant. How can I help you today?")
    
    # Initialize a persistent chat history for the session
    session_chat_history = []
    
    while True:
        user_speech = recognize_speech_from_mic()
        if user_speech is None:
            continue
        
        if is_exit_command(user_speech):
            speak_text("Okay, goodbye for now!")
            break
            
        # Generate and speak response
        response_data = generate_gemini_response(user_speech, session_chat_history)
        session_chat_history = response_data["chat_history"]
        
        if response_data["spoken_response"]:
            is_question = response_data["spoken_response"].strip().endswith('?')
            speak_text(response_data["spoken_response"], is_question=is_question)

def voice_assistant_cli():
    """Command-line interface for the voice assistant."""
    print("Voice Assistant with Gemini is now active. Say 'exit' or 'quit' to stop.")
    speak_text("Hello! I'm your voice assistant. How can I help you today?")
    
    session_chat_history = []
    
    while True:
        user_speech = input("\nYou: ")  # For testing, use text input instead of speech
        if not user_speech:
            continue
        
        if is_exit_command(user_speech):
            speak_text("Okay, goodbye for now!")
            break
            
        # Generate and speak response
        response_data = process_voice_query(user_speech, session_chat_history)
        if response_data.get("chat_history"):
            session_chat_history = response_data["chat_history"]
        
        if response_data.get("spoken_response"):
            is_question = response_data["spoken_response"].strip().endswith('?')
            print(f"\nAssistant: {response_data['spoken_response']}")
            speak_text(response_data["spoken_response"], is_question=is_question)
        
        # Handle any errors
        if response_data.get("status") == "error":
            print(f"\nError: {response_data.get('error', 'Unknown error occurred.')}")

if __name__ == "__main__":
    voice_assistant_cli()
