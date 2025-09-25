# RAG Educational AI Backend API Documentation

## Overview

The RAG Educational AI Backend provides a comprehensive set of APIs for building intelligent educational applications. The API supports document upload, intelligent querying, personalized learning, and voice interactions.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API uses API keys for authentication. Include your API key in the headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### Document Management

#### Upload Document
```http
POST /upload
```

Upload documents (PDF or DOCX) for processing and indexing.

**Parameters:**
- `file`: File to upload (multipart/form-data)
- `user_id` (optional): User identifier for personalization

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "file_id": "uuid",
  "chunks_created": 10
}
```

### Query Processing

#### Text Query
```http
POST /query
```

Query the knowledge base with text input.

**Body:**
```json
{
  "query": "What is machine learning?",
  "user_id": "user123",
  "max_results": 5
}
```

**Response:**
```json
{
  "answer": "Machine learning is...",
  "sources": [
    {
      "content": "relevant chunk",
      "source": "document.pdf",
      "page": 1
    }
  ],
  "confidence": 0.95
}
```

#### Voice Query
```http
POST /voice-query
```

Process voice queries using speech-to-text.

**Parameters:**
- `audio`: Audio file (multipart/form-data)
- `user_id` (optional): User identifier

### Speech Processing

#### Speech to Text
```http
POST /speech-to-text
```

Convert audio to text.

**Parameters:**
- `audio`: Audio file (multipart/form-data)

**Response:**
```json
{
  "transcription": "What is artificial intelligence?",
  "confidence": 0.98
}
```

## Agent Endpoints

### Personalization Agent

#### Get Personalized Response
```http
POST /personalization/get-response
```

Get a personalized response based on user profile.

**Body:**
```json
{
  "query": "Explain neural networks",
  "user_id": "user123",
  "context": "beginner level"
}
```

#### Update User Profile
```http
POST /personalization/update-profile
```

Update user learning preferences.

**Body:**
```json
{
  "user_id": "user123",
  "learning_style": "visual",
  "level": "intermediate",
  "preferences": {
    "topics": ["machine learning", "python"],
    "format": "examples"
  }
}
```

### Explanation Agent

#### Get Detailed Explanation
```http
POST /explanation/explain
```

Get detailed explanations of concepts.

**Body:**
```json
{
  "topic": "gradient descent",
  "level": "beginner",
  "include_examples": true
}
```

### Coding Agent

#### Code Assistance
```http
POST /coding/assist
```

Get coding help and suggestions.

**Body:**
```json
{
  "code": "def fibonacci(n):",
  "language": "python",
  "request": "complete this function"
}
```

#### Code Analysis
```http
POST /coding/analyze
```

Analyze code for issues and improvements.

**Body:**
```json
{
  "code": "your code here",
  "language": "python",
  "check_security": true
}
```

## Utility Endpoints

### Quiz Generation

#### Generate Quiz
```http
POST /generate-quiz
```

Generate a quiz from uploaded content.

**Body:**
```json
{
  "topic": "machine learning",
  "num_questions": 5,
  "difficulty": "intermediate"
}
```

### YouTube Integration

#### Fetch Related Videos
```http
POST /fetch-youtube-videos
```

Get YouTube videos related to a topic.

**Body:**
```json
{
  "query": "machine learning tutorial",
  "max_results": 5
}
```

### Chat History

#### Save Chat
```http
POST /save-chat
```

Save a conversation for later reference.

**Body:**
```json
{
  "user_id": "user123",
  "messages": [
    {
      "role": "user",
      "content": "What is AI?"
    },
    {
      "role": "assistant", 
      "content": "AI is..."
    }
  ]
}
```

#### Get Saved Chats
```http
GET /get-saved-chats/{user_id}
```

Retrieve saved conversations for a user.

## Error Responses

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error description",
  "detail": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

The API implements rate limiting:
- 60 requests per minute per IP address
- File uploads limited to 10MB

## WebSocket Support

Real-time features are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat');
```

## SDK and Examples

- Python SDK: Available in `/examples/python_client.py`
- JavaScript examples: Available in `/examples/js_client.js`
- Postman collection: Available in `/examples/postman_collection.json`
