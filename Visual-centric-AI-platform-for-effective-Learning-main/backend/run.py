#!/usr/bin/env python
"""
Simple runner script for the RAG Educational AI Backend

This script provides a simple way to run the application with
default settings for development.
"""

import uvicorn
from main import main

if __name__ == "__main__":
    # Use the main function from main.py for proper configuration handling
    main()
