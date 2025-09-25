import React, { useState, useEffect } from 'react';
import Chat from './components/chats';
import './App.css';
import './styles/profile.css';
import { FaHome, FaBook, FaTrash, FaEdit, FaSave, FaMicrophone, FaUpload, FaChevronLeft, FaGamepad, FaBrain, FaChartLine, FaUser, FaSignInAlt } from 'react-icons/fa'; // Added FaBrain, FaChartLine, FaUser, FaSignInAlt
import { RiCodeSSlashLine } from 'react-icons/ri'; // Added for Visualize feature
import { supabase } from './lib/supabase'; // Import Supabase client
import VoiceAssistantPage from './components/VoiceAssistantPage';
import DocumentUpload from './components/DocumentUpload'; // Import DocumentUpload
import KnowledgeGames from './components/KnowledgeGames'; // Import KnowledgeGames component
import VisualizePage from './components/VisualizePage'; // Import VisualizePage component
import LearningVisualizationDashboard from './components/LearningVisualizationDashboard'; // Import LearningVisualizationDashboard component
import LearningAnalyticsDashboard from './components/LearningAnalyticsDashboard'; // Import LearningAnalyticsDashboard component
import UserProfileDashboard from './components/UserProfileDashboard'; // Import UserProfileDashboard component
import EnhancedUserProfile from './components/EnhancedUserProfile'; // Import EnhancedUserProfile component
import ModernProfileDashboard from './components/ModernProfileDashboard'; // Import Modern Profile Dashboard
import PersonalizationDebugPanel from './components/PersonalizationDebugPanel'; // Import PersonalizationDebugPanel component
import AuthModal from './components/AuthModal'; // Import AuthModal component
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { LearningTrackerProvider, useLearningTracker } from './contexts/LearningTracker';
import { ChatContextProvider } from './contexts/ChatContextContext';
import ThemeSelector from './components/ThemeSelector';

function AppContent() {
  const { currentTheme } = useTheme();
  const { trackPageVisit } = useLearningTracker();
  const { user, loading: authLoading, isAuthenticated, isGuest, signOut } = useAuth();
  
  const [currentPage, setCurrentPage] = useState('home');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedChatHistory, setSelectedChatHistory] = useState([]);
  const [selectedChatFilename, setSelectedChatFilename] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true); // Keep this for initial data loading
  const [appError, setAppError] = useState(null); // Renamed from error to avoid conflict if Chat has its own error state
  const [sidebarOpen, setSidebarOpen] = useState(true); // New state for sidebar toggle
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for auth modal
  // Function to handle page navigation with tracking
  const handlePageChange = (page) => {
    setCurrentPage(page);
    trackPageVisit(page);
    setIsLibraryOpen(false);
  };

  // Effect for initial setup
  useEffect(() => {
    // Simply fetch initial data - Supabase handling is now in AuthContext
    fetchSavedChatHistory();

    // For Phase 1 testing, we'll disable real-time subscriptions to avoid errors
    // This can be re-enabled once all database tables are properly set up
    
    console.log('📝 Phase 1 Mode: Real-time subscriptions disabled for testing');
    
    // Fallback: Refresh chat history periodically
    const fallbackIntervalId = setInterval(() => {
      fetchSavedChatHistory();
    }, 60000); // Refresh every minute

    return () => {
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
      }
    };
  }, []); // Run this effect only once on mount

  // Fetch chat history function (keep as is, but ensure setLoading is handled)
  const fetchSavedChatHistory = async () => {
    if (!supabase) { // Guard against calling if supabase isn't available
        console.warn("fetchSavedChatHistory called but Supabase client not ready.");
        // setError(null); // Optional: inform user
        return;
    }
    setLoading(true); // Set loading before fetch
    // setError(null); // Clear previous errors related to fetching if any
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-saved-chats`); // This endpoint needs to be checked if it relies on Supabase on the backend
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error from server' }));
        throw new Error(errorData.detail || `Failed to fetch saved chat history, status: ${response.status}`);
      }
      const data = await response.json();
      const normalizedData = data.map(chat => ({
        ...chat,
        id: Number(chat.id),
      }));
      setChatHistory(normalizedData);
    } catch (err) {
      console.error("Error fetching saved chat history:", err);
      setAppError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new chat to the chat history
  // const addChatToHistory = (newChat) => {
  //   setChatHistory((prev) => {
  //     // Avoid duplicates by checking if the chat already exists
  //     if (prev.some(chat => Number(chat.id) === Number(newChat.id))) {
  //       console.log("Chat already exists in chatHistory, skipping:", newChat);
  //       return prev;
  //     }
  //     const updatedHistory = [...prev, { ...newChat, id: Number(newChat.id) }];
  //     console.log("Updated chatHistory after adding new chat:", updatedHistory);
  //     return updatedHistory;
  //   });
  // };

  // Placeholder component for Discover page
  // const DiscoverPage = () => (
  //   <div className="p-4">
  //     <h2 className="text-2xl font-bold mb-4">Discover Content</h2>
  //     <p>Explore new topics and resources here.</p>
  //   </div>
  // );

  // Library Dropdown component to display chat history
  const LibraryDropdown = ({ onClose, onSelectChat, chatHistory, setChatHistory }) => {
    // const [loading, setLoading] = useState(false); // setLoading from here is unused.
    const [error, setError] = useState(null);
    const [editingChatId, setEditingChatId] = useState(null);
    const [newFilename, setNewFilename] = useState('');

    // Trace chatHistory changes
    useEffect(() => {
      console.log("chatHistory updated in LibraryDropdown:", chatHistory);
    }, [chatHistory]);

    const handleDeleteChat = async (chatId) => {
      // Ensure chatId is an integer
      const idToDelete = parseInt(chatId, 10);
      if (isNaN(idToDelete)) {
        console.error("Invalid chatId:", chatId);
        setError('Failed to delete chat: Invalid chat ID.');
        return;
      }

      if (!window.confirm('Are you sure you want to delete this chat?')) {
        return;
      }

      console.log("Deleting chat with id:", idToDelete);
      console.log("Current chatHistory before deletion:", chatHistory);

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/delete-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idToDelete }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) {
            setError(`Chat not found. It may have already been deleted.`);
          } else if (response.status === 500) {
            setError('Failed to delete chat: A server error occurred. Please check your connection and try again later.');
          } else {
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }
        } else {
          const result = await response.json();
          console.log("Delete chat response:", result);
          alert(result.message);

          // Update the local chatHistory state by removing the deleted chat
          setChatHistory((prev) => {
            const updatedHistory = prev.filter((chat) => Number(chat.id) !== idToDelete);
            console.log("Updated chatHistory after deletion:", updatedHistory);
            return updatedHistory;
          });

          // Clear any previous error
          setError(null);
        }

      } catch (err) {
        console.error('Failed to delete chat:', err);
        setError('Failed to delete chat: ' + err.message);
      }
    };

    const handleEditChat = (chatId, currentFilename) => {
      setEditingChatId(chatId);
      setNewFilename(currentFilename);
    };

    const handleSaveChatFilename = async (chatId) => {
      // Ensure chatId is an integer
      const idToUpdate = parseInt(chatId, 10);
      if (isNaN(idToUpdate)) {
        console.error("Invalid chatId for update:", chatId);
        setError('Failed to update filename: Invalid chat ID.');
        return;
      }

      if (!newFilename.trim()) {
        setError('Filename cannot be empty.');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/update-chat-filename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idToUpdate, filename: newFilename }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) {
            setError('Chat not found. It may have been deleted.');
          } else if (response.status === 400) {
            setError('Filename already in use. Please choose a different name.');
          } else if (response.status === 500) {
            setError('Failed to update filename: A server error occurred. Please check your connection and try again later.');
          } else {
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }
          return;
        }

        const result = await response.json();
        console.log("Update chat filename response:", result);
        alert(result.message);

        // Update the local chatHistory state with the new filename
        setChatHistory((prev) =>
          prev.map((chat) =>
            Number(chat.id) === idToUpdate ? { ...chat, filename: newFilename } : chat
          )
        );

        // Exit editing mode
        setEditingChatId(null);
        setNewFilename('');

        // Clear any previous error
        setError(null);

      } catch (err) {
        console.error('Failed to update chat filename:', err);
        setError('Failed to update chat filename: ' + err.message);
      }
    };

    // Log when LibraryDropdown re-renders
    console.log("LibraryDropdown rendering with chatHistory:", chatHistory);

    return (
      <div className="py-2 bg-dark-card rounded-md shadow-custom overflow-hidden" onMouseLeave={onClose}>
        {loading && <p className="px-4 py-2 text-dark-text-secondary">Loading...</p>}
        {error && <p className="px-4 py-2 text-dark-accent-red">Error: {error}</p>}
        {!loading && !error && (
          <div className="max-h-64 overflow-y-auto">
            {chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between px-3 py-2 hover:bg-dark-border">
                  {editingChatId === chat.id ? (
                    <>
                      <input
                        type="text"
                        value={newFilename}
                        onChange={(e) => setNewFilename(e.target.value)}
                        className="flex-grow bg-dark-bg text-dark-text-primary border border-dark-border rounded px-2 py-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="text-green-500 hover:text-green-400 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveChatFilename(chat.id);
                        }}
                        title="Save Filename"
                      >
                        <FaSave />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="cursor-pointer text-dark-text-accent hover:text-dark-text-primary truncate flex-grow"
                        onClick={() => {
                          onSelectChat(chat.chat_history, chat.filename); // Updated to chat_history
                          onClose();
                        }}
                      >
                        {chat.filename || `Chat ${chat.id}`}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-500 hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChat(chat.id, chat.filename || `Chat ${chat.id}`);
                          }}
                          title="Edit Filename"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          title="Delete Chat"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="px-4 py-2 text-dark-text-secondary">No saved chats found.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // Determine if we should show the special centered input screen
    const showInitialHomeScreenLayout = currentPage === 'home' && !selectedChatFilename && selectedChatHistory.length === 0;

    switch (currentPage) {
      case 'home':
        return <Chat 
                  chatHistory={selectedChatHistory} 
                  chatFilename={selectedChatFilename}
                  isInitialHomeScreen={showInitialHomeScreenLayout} // Use the refined condition
               />;
      case 'new-chat':
        return <Chat 
                  chatHistory={[]} 
                  chatFilename={""} 
                  isInitialHomeScreen={true} // New chat should always start with the input screen
               />; 
      case 'voice-assistant':
        return <VoiceAssistantPage />;
      case 'upload': // Added case for DocumentUpload page
        return <DocumentUpload />;
      case 'knowledge-games': // New case for KnowledgeGames
        return <KnowledgeGames />;
      case 'visualize': // New case for LocalSite AI Visualizer
        return <VisualizePage />;
      case 'learning-visualization': // New case for Advanced Learning Visualization
        return <LearningVisualizationDashboard />;
      case 'analytics': // New case for Learning Analytics
        return <LearningAnalyticsDashboard />;
      case 'profile': // New case for User Profile
        return isAuthenticated ? <ModernProfileDashboard /> : <div className="p-6 text-center text-gray-400">Please sign in to view your profile.</div>;
      default:
        // Default typically means a chat is selected or it's an unknown state
        return <Chat 
                  chatHistory={selectedChatHistory} 
                  chatFilename={selectedChatFilename} 
                  isInitialHomeScreen={false} // Never show initial screen for unknown states
               />;
    }
  };

  const handleSelectChat = (chatData, filename) => {
    setSelectedChatHistory(chatData);
    setSelectedChatFilename(filename);
    setCurrentPage('home');
  };

  // const handleNewChat = () => {
  //   setSelectedChatHistory([]);
  //   setSelectedChatFilename('New Chat');
  //   setCurrentPage('chat'); // Navigate to chat page for the new chat
  //   if (isLibraryOpen) {
  // Theme-aware colors for the entire app
  const getAppThemeColors = () => {
    switch (currentTheme) {
      case 'light':
        return {
          bg: 'bg-light-bg',
          gradient: 'bg-gradient-to-br from-light-bg via-light-sidebar to-light-bg',
          sidebar: 'bg-light-sidebar',
          sidebarText: 'text-light-text-primary',
          border: 'border-light-border',
          navActive: 'bg-light-accent-primary text-white',
          navInactive: 'hover:bg-light-accent-primary/20 text-light-text-secondary hover:text-light-text-primary',
          header: 'bg-light-sidebar',
          headerText: 'text-light-text-primary',
          brandText: 'text-light-accent-primary',
          buttonBg: 'bg-light-sidebar hover:bg-light-accent-primary/20',
          buttonText: 'text-light-text-secondary',
          error: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'forest':
        return {
          bg: 'bg-forest-bg',
          gradient: 'bg-gradient-to-br from-forest-bg via-forest-sidebar to-forest-bg',
          sidebar: 'bg-forest-sidebar',
          sidebarText: 'text-forest-text-primary',
          border: 'border-forest-border',
          navActive: 'bg-forest-accent-primary text-white',
          navInactive: 'hover:bg-forest-accent-primary/20 text-forest-text-secondary hover:text-forest-text-primary',
          header: 'bg-forest-sidebar',
          headerText: 'text-forest-text-primary',
          brandText: 'text-forest-accent-primary',
          buttonBg: 'bg-forest-sidebar hover:bg-forest-accent-primary/20',
          buttonText: 'text-forest-text-secondary',
          error: 'bg-red-900/70 text-red-300 border-red-700'
        };
      case 'sunset':
        return {
          bg: 'bg-sunset-bg',
          gradient: 'bg-gradient-to-br from-sunset-bg via-sunset-sidebar to-sunset-bg',
          sidebar: 'bg-sunset-sidebar',
          sidebarText: 'text-sunset-text-primary',
          border: 'border-sunset-border',
          navActive: 'bg-sunset-accent-primary text-white',
          navInactive: 'hover:bg-sunset-accent-primary/20 text-sunset-text-secondary hover:text-sunset-text-primary',
          header: 'bg-sunset-sidebar',
          headerText: 'text-sunset-text-primary',
          brandText: 'text-sunset-accent-primary',
          buttonBg: 'bg-sunset-sidebar hover:bg-sunset-accent-primary/20',
          buttonText: 'text-sunset-text-secondary',
          error: 'bg-red-900/70 text-red-300 border-red-700'
        };
      case 'purple':
        return {
          bg: 'bg-purple-bg',
          gradient: 'bg-gradient-to-br from-purple-bg via-purple-sidebar to-purple-bg',
          sidebar: 'bg-purple-sidebar',
          sidebarText: 'text-purple-text-primary',
          border: 'border-purple-border',
          navActive: 'bg-purple-accent-primary text-white',
          navInactive: 'hover:bg-purple-accent-primary/20 text-purple-text-secondary hover:text-purple-text-primary',
          header: 'bg-purple-sidebar',
          headerText: 'text-purple-text-primary',
          brandText: 'text-purple-accent-primary',
          buttonBg: 'bg-purple-sidebar hover:bg-purple-accent-primary/20',
          buttonText: 'text-purple-text-secondary',
          error: 'bg-red-900/70 text-red-300 border-red-700'
        };
      default: // dark
        return {
          bg: 'bg-dark-bg',
          gradient: 'bg-gradient-to-br from-dark-bg via-dark-sidebar to-dark-bg',
          sidebar: 'bg-dark-sidebar',
          sidebarText: 'text-dark-text-primary',
          border: 'border-dark-border',
          navActive: 'bg-dark-accent-primary text-white',
          navInactive: 'hover:bg-dark-accent-primary/20 text-dark-text-secondary hover:text-dark-text-primary',
          header: 'bg-dark-sidebar',
          headerText: 'text-dark-text-primary',
          brandText: 'text-dark-accent-primary',
          buttonBg: 'bg-dark-sidebar hover:bg-dark-accent-primary/20',
          buttonText: 'text-dark-text-secondary',
          error: 'bg-red-900/70 text-red-300 border-red-700'
        };
    }
  };

  const colors = getAppThemeColors();

  //     setIsLibraryOpen(false); // Close library if open
  //   }
  // };

  // Emergency logout function that always works
  const emergencyLogout = () => {
    console.log('🚨 Emergency logout triggered');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Force page reload
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className={`relative flex h-screen ${colors.bg} ${colors.sidebarText} overflow-hidden transition-colors duration-300`}>
      {/* Theme Selector - Global */}
      <ThemeSelector />
      
      {/* Subtle gradient background */}
      <div className={`absolute inset-0 ${colors.gradient}`}></div>

      {/* Sidebar with Tailwind */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} ${colors.sidebar} ${colors.sidebarText} p-4 space-y-6 z-20 border-r ${colors.border} relative transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${colors.brandText} text-center`}>Novalear AI</h1> 
        </div>
        <nav className="flex flex-col space-y-2">
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'home' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('home')}
          >
            <FaHome className="inline" />
            <span>Home</span>
          </button>
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'upload' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('upload')}
            title="Upload Documents"
          >
            <FaUpload className="inline" /> 
            <span>Upload Docs</span>
          </button>
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'voice-assistant' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('voice-assistant')}
            title="Voice Assistant"
          >
            <FaMicrophone className="inline" /> 
            <span>Voice Assistant</span>
          </button>
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'knowledge-games' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('knowledge-games')}
            title="Test Your Knowledge"
          >
            <FaGamepad className="inline" /> 
            <span>Knowledge Games</span>
          </button>
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'visualize' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('visualize')}
            title="AI Code Visualizer"
          >
            <RiCodeSSlashLine className="inline" /> 
            <span>Visualize</span>
          </button>
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'learning-visualization' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('learning-visualization')}
            title="Learning Insights and Progress Visualization"
          >
            <FaChartLine className="inline" /> 
            <span>Learning Insights</span>
          </button>
          
          <button
            className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'analytics' ? colors.navActive : colors.navInactive}`}
            onClick={() => handlePageChange('analytics')}
            title="Advanced Learning Analytics & Performance Metrics"
          >
            <FaBrain className="inline" /> 
            <span>Analytics</span>
          </button>
          
          {/* User Profile/Auth Section */}
          {isAuthenticated ? (
            <>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${currentPage === 'profile' ? colors.navActive : colors.navInactive}`}
                onClick={() => handlePageChange('profile')}
                title="User Profile & Learning Goals"
              >
                <FaUser className="inline" /> 
                <span>My Profile</span>
              </button>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors hover:bg-red-600 text-gray-300 hover:text-white`}
                onClick={signOut}
                title={isGuest ? "End Guest Session" : "Sign Out"}
              >
                <FaSignInAlt className="inline transform rotate-180" /> 
                <span>{isGuest ? "End Session" : "Sign Out"}</span>
              </button>
            </>
          ) : (
            <button
              className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${colors.navInactive}`}
              onClick={() => setShowAuthModal(true)}
              title="Sign In or Create Account"
            >
              <FaSignInAlt className="inline" /> 
              <span>Sign In</span>
            </button>
          )}
          
          {/* Library dropdown using Tailwind */}
          <div className="relative">
            <button
              className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors w-full text-left ${isLibraryOpen ? colors.navActive : colors.navInactive}`}
              onClick={() => setIsLibraryOpen(!isLibraryOpen)} 
            >
              <FaBook className="inline" />
              <span>Library</span>
            </button>
            {isLibraryOpen && (
              <div className={`absolute left-0 mt-2 w-full rounded-md shadow-lg ${colors.sidebar} z-20 border ${colors.border}`}>
                <LibraryDropdown
                  onClose={() => setIsLibraryOpen(false)}
                  onSelectChat={handleSelectChat}
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                />
              </div>
            )}
          </div>
        </nav>
        <div className="mt-auto">
          {/* User Info Section */}
          {isAuthenticated ? (
            <div className={`flex items-center p-2 ${colors.buttonBg} rounded-md`}>
              <span className="text-xl mr-3">{isGuest ? '🎭' : '👤'}</span>
              <div className="flex flex-col">
                <span className={`text-sm ${colors.buttonText} font-medium`}>
                  {user?.email || 'Guest User'}
                </span>
                {isGuest && (
                  <span className="text-xs text-yellow-400">Guest Mode</span>
                )}
              </div>
            </div>
          ) : (
            <div className={`flex items-center p-2 ${colors.buttonBg} rounded-md opacity-75`}>
              <span className="text-xl mr-3">👋</span>
              <span className={`text-sm ${colors.buttonText}`}>Welcome! Please sign in</span>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar toggle button - positioned outside the sidebar */}
      <div className={`absolute top-4 z-30 transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'}`}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`${colors.buttonBg} ${colors.buttonText} p-2 rounded-r shadow-md border-r border-t border-b ${colors.border}`}
        >
          <FaChevronLeft className={`transition-transform duration-300 ${sidebarOpen ? '' : 'transform rotate-180'}`} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto z-10 relative transition-all duration-300 ${sidebarOpen ? '' : 'pl-8'}`}>
        {/* App header with notebook style */}
        <div className={`sticky top-0 ${colors.header} shadow-md z-20 py-3 px-6 border-b ${colors.border}`}>
          <h1 className={`text-xl font-medium ${colors.headerText} text-center`}>Your AI Companion for Visual Learning</h1>
        </div>
        
        {appError && <div className={`${colors.error} p-3 m-4 rounded-md mb-4 border`}>{appError}</div>}
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {renderContent()}
        </div>
      </main>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        mode="signin"
      />

      {/* Emergency Logout Button - Temporary for testing */}
      {isAuthenticated && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-red-400"
            title="Normal Logout"
          >
            🚪 Logout
          </button>
          <button
            onClick={emergencyLogout}
            className="bg-red-800 hover:bg-red-900 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-red-600"
            title="Emergency Logout - Clears Everything"
          >
            🚨 Emergency
          </button>
        </div>
      )}

      {/* Personalization Debug Panel */}
      <PersonalizationDebugPanel />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProfileProvider>
          <LearningTrackerProvider>
            <ChatContextProvider>
              <AppContent />
            </ChatContextProvider>
          </LearningTrackerProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;