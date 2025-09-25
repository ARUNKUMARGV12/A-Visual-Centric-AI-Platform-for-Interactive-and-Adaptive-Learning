# RAG Educational AI Backend

A sophisticated AI-powered educational platform that combines Retrieval-Augmented Generation (RAG) with personalized learning experiences.

## Features

- **Personalized Learning**: Adaptive AI tutoring based on individual learning styles and preferences
- **Document Processing**: Support for PDF and DOCX file uploads with intelligent chunking
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- **Multi-Agent System**: Specialized agents for different educational tasks
- **YouTube Integration**: Relevant video recommendations for topics
- **Quiz Generation**: Dynamic quiz creation based on uploaded content
- **Vector Search**: Intelligent document retrieval using Supabase vector store

## Architecture

### Core Components

- **FastAPI Backend**: RESTful API with async support
- **Vector Database**: Supabase for document storage and similarity search
- **AI Models**: Google Gemini for text generation and embeddings
- **Agent System**: Specialized agents for different educational tasks

### Agents

- **Personalization Agent**: Adapts responses based on user profiles
- **Explanation Agent**: Provides detailed explanations of concepts
- **Coding Agent**: Assists with programming tasks
- **Code Analysis Agent**: Reviews and improves code quality
- **Security Agent**: Identifies potential security vulnerabilities

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Run the application:
   ```bash
   python main.py
   ```

## API Endpoints

### Core Endpoints
- `POST /upload` - Upload documents for processing
- `POST /query` - Query the knowledge base
- `POST /speech-to-text` - Convert audio to text
- `POST /voice-query` - Voice-based queries

### Agent Endpoints
- `POST /personalization/*` - Personalization features
- `POST /explanation/*` - Explanation services
- `POST /coding/*` - Code-related assistance
- `POST /code-fixer/*` - Code fixing and improvement

### Utility Endpoints
- `POST /generate-quiz` - Create quizzes from content
- `POST /fetch-youtube-videos` - Get related videos
- `POST /save-chat` - Save conversation history
- `GET /get-saved-chats` - Retrieve saved conversations

## Configuration

The application uses environment variables for configuration. See `.env.example` for required variables.

## Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Structure
- `src/` - Main application code
- `agents/` - Specialized AI agents
- `utils/` - Utility functions
- `config/` - Configuration files
- `tests/` - Test files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
