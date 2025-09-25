# RAG Educational AI Platform

A comprehensive full-stack AI-powered educational platform that combines Retrieval-Augmented Generation (RAG) with personalized learning experiences.

## 🚀 Project Overview

This is a complete full-stack application featuring:

- **Backend**: FastAPI-based Python application with AI agents
- **Frontend**: React.js application with TypeScript and TailwindCSS
- **Database**: Supabase with vector search capabilities
- **AI Integration**: Google Gemini for text generation and embeddings
- **Additional Tools**: Code generators, games, and utilities

## 📁 Project Structure

```
my_RAG/
├── backend/                    # FastAPI Python Backend
│   ├── src/                   # Main application source code
│   │   ├── agents/           # AI agents for specialized tasks
│   │   ├── api/              # API endpoints and routes
│   │   ├── core/             # Core application logic
│   │   ├── utils/            # Utility functions
│   │   └── main.py           # FastAPI application
│   ├── config/               # Configuration files
│   ├── data/                 # Data storage
│   ├── tests/                # Test files
│   ├── docs/                 # Documentation
│   └── examples/             # Example projects
├── frontend/                  # React.js Frontend
│   ├── src/                  # React source code
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilities
│   ├── public/               # Static files
│   └── build/                # Production build
├── database/                 # Database schemas and migrations
├── docs/                     # Project documentation
├── scripts/                  # Utility scripts
└── Working code generator/   # AI code generation tool
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: Google Gemini, LangChain
- **Database**: Supabase (PostgreSQL with vector extensions)
- **Authentication**: Supabase Auth
- **Voice**: Speech-to-text integration
- **Documentation**: Automatic API docs with FastAPI

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context
- **Routing**: React Router
- **UI Components**: Custom components with Radix UI
- **Charts**: Recharts
- **Editor**: Monaco Editor for code editing

### Additional Tools
- **Code Generator**: Next.js application for AI code generation
- **Games**: Educational games and interactive examples
- **Testing**: Comprehensive test suites for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp config/.env.example config/.env
   # Edit config/.env with your API keys
   ```

5. **Run the backend**
   ```bash
   python main.py
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   Frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration
Edit `backend/config/.env`:
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# Application
DEBUG=False
LOG_LEVEL=INFO
HOST=localhost
PORT=8000
```

### Frontend Configuration
Edit `frontend/.env`:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 📚 Features

### AI Agents
- **Personalization Agent**: Adapts responses based on user profiles
- **Explanation Agent**: Provides detailed explanations of concepts
- **Coding Agent**: Assists with programming tasks
- **Code Analysis Agent**: Reviews and improves code quality
- **Security Agent**: Identifies potential security vulnerabilities

### Educational Features
- **Document Upload**: Support for PDF and DOCX files
- **Intelligent Querying**: RAG-powered question answering
- **Voice Interaction**: Speech-to-text and text-to-speech
- **Quiz Generation**: Dynamic quiz creation from content
- **YouTube Integration**: Relevant video recommendations
- **Personalized Learning**: Adaptive learning paths

### User Interface
- **Modern Design**: Clean, responsive interface
- **Dark/Light Mode**: Theme switching
- **Real-time Chat**: Interactive conversation interface
- **File Management**: Easy document upload and management
- **Profile Dashboard**: User profile and progress tracking

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📖 API Documentation

When the backend is running, visit:
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## 🚀 Deployment

### Backend Deployment
See `backend/docs/DEPLOYMENT.md` for detailed deployment instructions.

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the build/ directory to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛟 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔄 Recent Updates

- ✅ Complete backend restructuring with modular architecture
- ✅ Comprehensive documentation and API specs
- ✅ Enhanced frontend with TypeScript and modern UI
- ✅ Integrated AI agents for specialized tasks
- ✅ Voice interaction capabilities
- ✅ Educational game examples
- ✅ Database schema optimization

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enhanced AI model integration
- [ ] Collaborative learning features
- [ ] Advanced assessment tools

---

Built with ❤️ for educational excellence
