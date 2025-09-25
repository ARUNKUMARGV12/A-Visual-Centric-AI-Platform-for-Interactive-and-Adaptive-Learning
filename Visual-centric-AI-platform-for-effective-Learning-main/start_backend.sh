#!/bin/bash
# Backend startup script for Phase 1 testing

echo "🚀 Starting Phase 1 Backend Server..."
echo "📍 Directory: $(pwd)"

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ -d "venv" ] || [ -d "../env" ]; then
    echo "✅ Virtual environment found"
else
    echo "⚠️ No virtual environment found, using system Python"
fi

# Start the backend server
echo "🔄 Starting FastAPI server..."
python run.py

echo "🎯 Backend server should now be running on http://localhost:8000"
