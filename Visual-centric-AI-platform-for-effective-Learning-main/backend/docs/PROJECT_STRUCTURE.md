# Project Structure

This document outlines the organization and structure of the RAG Educational AI Backend codebase.

## Directory Overview

```
backend/
├── src/                    # Main application source code
│   ├── agents/            # AI agents for specialized tasks
│   ├── api/              # API endpoints and routes
│   ├── core/             # Core application logic
│   ├── utils/            # Utility functions and helpers
│   └── main.py           # FastAPI application setup
├── config/               # Configuration files
│   ├── .env              # Environment variables (not in git)
│   ├── .env.example      # Environment template
│   └── settings.py       # Application settings
├── data/                 # Data storage directory
│   └── user_profiles/    # User profile data
├── tests/                # Test files
│   ├── test_*.py         # Various test modules
│   └── test_results_*.json
├── docs/                 # Documentation
│   ├── API.md           # API documentation
│   ├── DEPLOYMENT.md    # Deployment guide
│   └── PROJECT_STRUCTURE.md
├── examples/             # Example applications and games
│   ├── ak01/            # Snake game example
│   ├── ak02/            # Gun shoot game example
│   ├── games/           # Additional game examples
│   └── SPEED-RACER-master/
├── archive/              # Archived files and backups
│   └── *.zip            # ZIP archives
├── main.py              # Main application entry point
├── run.py               # Simple runner script
├── requirements.txt     # Python dependencies
├── README.md           # Project documentation
└── __pycache__/        # Python cache files
```

## Source Code Structure (`src/`)

### Agents (`src/agents/`)

The agents directory contains specialized AI agents, each designed for specific educational tasks:

```
agents/
├── explainer/          # Explanation agent for detailed concept explanations
│   ├── agent.py
│   ├── router.py
│   └── __init__.py
├── explanation/        # Alternative explanation service
│   ├── router.py
│   ├── service.py
│   └── __init__.py
├── personalization/    # Personalization agent for adaptive learning
│   ├── agent.py
│   ├── example_responses.py
│   ├── recommendations.py
│   ├── router.py
│   ├── user_context.py
│   └── __init__.py
├── visual/            # Visual content generation agent
│   ├── agent.py
│   ├── router.py
│   └── __init__.py
├── advanced_personalization_agent.py
├── algorithm_explanation_agent.py
├── analyzer_agent.py
├── code_analysis_agent.py
├── code_fixer_agent.py
├── code_refactoring_agent.py
├── coding_agent.py
├── enhanced_learning_agent.py
├── explainer_agent.py
├── personalization_agent.py
├── personalization_router.py
├── security_bug_agent.py
└── __init__.py
```

### API (`src/api/`)

Contains API route definitions and request handlers:

```
api/
├── routes/            # Route definitions
│   ├── auth.py       # Authentication routes
│   ├── documents.py  # Document management
│   ├── query.py      # Query processing
│   └── voice.py      # Voice interaction
├── middleware/       # Custom middleware
│   ├── cors.py       # CORS handling
│   ├── auth.py       # Authentication middleware
│   └── rate_limit.py # Rate limiting
├── models/           # Pydantic models for API
│   ├── requests.py   # Request models
│   ├── responses.py  # Response models
│   └── base.py       # Base models
└── __init__.py
```

### Core (`src/core/`)

Core application functionality:

```
core/
├── database/         # Database connections and operations
│   ├── supabase.py   # Supabase client
│   ├── models.py     # Data models
│   └── migrations/   # Database migrations
├── models/           # AI model management
│   ├── gemini.py     # Google Gemini integration
│   ├── embeddings.py # Embedding generation
│   └── base.py       # Base model classes
├── vector_store/     # Vector database operations
│   ├── supabase_store.py
│   ├── chunking.py   # Document chunking
│   └── search.py     # Vector search
├── document_processor/ # Document processing
│   ├── pdf_processor.py
│   ├── docx_processor.py
│   └── base.py
└── __init__.py
```

### Utils (`src/utils/`)

Utility functions and helper modules:

```
utils/
├── stt.py                    # Speech-to-text functionality
├── voice_assistant.py        # Voice assistant utilities
├── youtube_utils.py          # YouTube integration
├── visual_prompt_generator.py # Visual prompt generation
├── file_utils.py            # File handling utilities
├── text_processing.py       # Text processing functions
├── validators.py            # Input validation
└── __init__.py
```

## Configuration (`config/`)

Configuration management:

```
config/
├── .env              # Environment variables (not committed)
├── .env.example      # Template for environment variables
├── settings.py       # Application settings management
├── logging.py        # Logging configuration
└── constants.py      # Application constants
```

## Data (`data/`)

Data storage and user profiles:

```
data/
├── user_profiles/    # Individual user profiles (JSON files)
├── uploads/          # Temporary file uploads
├── cache/           # Cached data
└── logs/            # Application logs
```

## Tests (`tests/`)

Test suite organization:

```
tests/
├── unit/            # Unit tests
│   ├── test_agents.py
│   ├── test_utils.py
│   └── test_core.py
├── integration/     # Integration tests
│   ├── test_api.py
│   ├── test_database.py
│   └── test_full_flow.py
├── fixtures/        # Test fixtures and data
├── conftest.py      # Pytest configuration
└── __init__.py
```

## Key Design Principles

### 1. Separation of Concerns
- **Agents**: Specialized AI functionality
- **API**: HTTP interface and routing
- **Core**: Business logic and data processing
- **Utils**: Reusable helper functions

### 2. Modular Architecture
- Each module has a clear responsibility
- Loose coupling between components
- Easy to test and maintain

### 3. Configuration Management
- Centralized configuration in `config/`
- Environment-based settings
- Validation of required settings

### 4. Data Organization
- User data separated from application code
- Clear data flow and storage patterns
- Proper backup and archival structure

## File Naming Conventions

### Python Files
- `snake_case` for file names
- Descriptive names indicating purpose
- `_test.py` suffix for test files

### Directories
- Lowercase with underscores
- Plural names for collections (e.g., `agents/`, `tests/`)
- Descriptive of contained functionality

### Configuration Files
- `.env` for environment variables
- `.example` suffix for templates
- Clear, descriptive names

## Import Structure

### Internal Imports
```python
# Relative imports within modules
from .agent import PersonalizationAgent
from ..core.models import User

# Absolute imports from src
from src.core.database import get_db_client
from src.utils.stt import speech_to_text
```

### External Imports
```python
# Standard library first
import os
import json
from pathlib import Path

# Third-party packages
import fastapi
from supabase import create_client

# Local application imports
from config.settings import settings
```

## Adding New Components

### Adding a New Agent
1. Create directory in `src/agents/new_agent/`
2. Add `agent.py`, `router.py`, `__init__.py`
3. Register routes in main application
4. Add tests in `tests/unit/test_new_agent.py`

### Adding New API Endpoints
1. Create route module in `src/api/routes/`
2. Define Pydantic models in `src/api/models/`
3. Add route registration in `src/main.py`
4. Add integration tests

### Adding Utilities
1. Create module in `src/utils/`
2. Add to `__init__.py` exports
3. Add unit tests
4. Update documentation

This structure promotes maintainability, testability, and scalability while keeping the codebase organized and understandable.
