"""
Utility functions for the RAG Educational AI Backend

This module contains utility functions for:
- Speech-to-text processing
- Voice assistant functionality
- YouTube video search
- Visual prompt generation
"""

from .stt import speech_to_text
from .voice_assistant import clean_text_for_speech, generate_gemini_response
from .youtube_utils import search_youtube_videos

__all__ = [
    "speech_to_text",
    "clean_text_for_speech", 
    "generate_gemini_response",
    "search_youtube_videos"
]
