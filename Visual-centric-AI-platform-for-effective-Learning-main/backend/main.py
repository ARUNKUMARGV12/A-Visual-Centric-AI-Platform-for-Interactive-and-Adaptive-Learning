"""
Main application entry point for the RAG Educational AI Backend

This is the main entry point that sets up and runs the FastAPI application
with proper imports from the restructured codebase.
"""

import sys
import os
from pathlib import Path
import uvicorn

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

# Import the main application from the src directory
from src.main import app

# Import configuration
from config.settings import settings, validate_required_settings

def main():
    """Main application entry point."""
    # Validate configuration
    missing_settings = validate_required_settings()
    if missing_settings:
        print(f"Error: Missing required environment variables: {', '.join(missing_settings)}")
        print("Please check your .env file in the config directory.")
        sys.exit(1)
    
    # Run the application
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )

if __name__ == "__main__":
    main()
