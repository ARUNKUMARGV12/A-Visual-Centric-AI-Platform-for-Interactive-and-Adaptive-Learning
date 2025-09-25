import speech_recognition as sr
import os
from typing import Dict, Union
from dotenv import load_dotenv
import tempfile
import subprocess
from io import BytesIO

load_dotenv()

def convert_webm_to_wav(webm_content: bytes) -> bytes:
    """Convert WebM audio to WAV format using ffmpeg."""
    try:
        # Create temporary files for WebM and WAV
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file, \
             tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as wav_file:
            
            # Write WebM content to temp file
            webm_file.write(webm_content)
            webm_file.flush()
            
            # Convert to WAV using ffmpeg
            subprocess.run([
                'ffmpeg', '-i', webm_file.name,
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y',  # Overwrite output file if it exists
                wav_file.name
            ], check=True, capture_output=True)
            
            # Read the converted WAV file
            with open(wav_file.name, 'rb') as f:
                wav_content = f.read()
                
            # Clean up temp files
            os.unlink(webm_file.name)
            os.unlink(wav_file.name)
            
            return wav_content
            
    except Exception as e:
        raise Exception(f"Error converting audio format: {str(e)}")

def speech_to_text(audio_content: bytes) -> Dict[str, Union[str, bool]]:
    """
    Convert speech audio to text using Google's speech recognition.
    
    Args:
        audio_content (bytes): The audio content in bytes
        
    Returns:
        dict: A dictionary containing the status and either the transcribed text or error message
    """
    try:
        # Convert WebM to WAV format
        wav_content = convert_webm_to_wav(audio_content)
        
        recognizer = sr.Recognizer()
        
        # Convert the WAV bytes to AudioFile
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav.write(wav_content)
            temp_wav.flush()
            
            with sr.AudioFile(temp_wav.name) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source)
                # Record the audio file
                audio_data = recognizer.record(source)
            
            # Clean up temp file
            os.unlink(temp_wav.name)
        
        try:
            # Attempt to recognize the speech
            text = recognizer.recognize_google(audio_data)
            return {
                "status": "success",
                "text": text,
                "error": False
            }
        except sr.UnknownValueError:
            return {
                "status": "error",
                "message": "Could not understand the audio",
                "error": True
            }
        except sr.RequestError as e:
            return {
                "status": "error",
                "message": f"Could not request results from speech recognition service: {str(e)}",
                "error": True
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"An error occurred during speech recognition: {str(e)}",
            "error": True
        }


if __name__ == "__main__":
    result = speech_to_text() # Changed to call the renamed function
    print(f"Function call result: {result}")