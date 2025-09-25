import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';

const ChatContextContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContextContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
};

export const ChatContextProvider = ({ children }) => {
  const { user, userProfile, isAuthenticated, isGuest } = useAuth();
  const { logActivity } = useUserProfile();
  
  const [chatSessions, setChatSessions] = useState(new Map());
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [userContext, setUserContext] = useState({
    learningStyle: 'unknown',
    skillLevel: 'beginner',
    recentTopics: [],
    preferredDifficulty: 'medium',
    conversationHistory: [],
    topicMastery: {},
    learningGoals: []
  });

  // Initialize user context from profile
// Fetch comprehensive user profile from backend
  const fetchUserProfile = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user-profile/${user.id}`);
        if (response.ok) {
          const profile = await response.json();
          setUserContext(prev => ({
            ...prev,
            learningStyle: profile.learning_preferences.style || 'unknown',
            skillLevel: profile.skill_level || 'beginner',
            preferredDifficulty: profile.preferred_difficulty || 'medium',
            learningGoals: profile.goals || [],
            topicMastery: profile.topic_progress || {},
            interests: profile.interests || [],
            recentTopics: profile.recent_topics || []
          }));
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUserProfile();
    if (userProfile) {
      setUserContext(prev => ({
        ...prev,
        learningStyle: userProfile.learning_preferences?.style || 'unknown',
        skillLevel: userProfile.skill_level || 'beginner',
        preferredDifficulty: userProfile.preferred_difficulty || 'medium',
        learningGoals: userProfile.goals || [],
        topicMastery: userProfile.topic_progress || {}
      }));
    }
  }, [userProfile]);

  // Create a new chat session
  const createChatSession = useCallback((topic = null) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      id: sessionId,
      topic: topic,
      startTime: new Date(),
      messages: [],
      concepts: new Set(),
      difficulty: userContext.preferredDifficulty,
      learningObjectives: [],
      userEngagement: 0.5,
      topicProgress: {}
    };
    
    setChatSessions(prev => new Map(prev).set(sessionId, newSession));
    setCurrentSessionId(sessionId);
    
    // Log session creation
    if (logActivity) {
      logActivity({
        type: 'chat_session_started',
        topic: topic || 'general',
        details: { sessionId, difficulty: newSession.difficulty },
        engagementScore: 0.7
      });
    }
    
    return sessionId;
  }, [userContext.preferredDifficulty, logActivity]);

  // Add message to current session
  const addMessageToSession = useCallback((message, isUser = false) => {
    if (!currentSessionId) {
      createChatSession();
      return;
    }

    setChatSessions(prev => {
      const sessions = new Map(prev);
      const session = sessions.get(currentSessionId);
      
      if (session) {
        const updatedMessage = {
          ...message,
          timestamp: new Date(),
          isUser,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Extract concepts if it's an AI response
        if (!isUser && message.content) {
          const concepts = extractConceptsFromMessage(message.content);
          concepts.forEach(concept => session.concepts.add(concept));
        }
        
        session.messages.push(updatedMessage);
        session.lastActivity = new Date();
        
        sessions.set(currentSessionId, session);
      }
      
      return sessions;
    });

    // Log message activity
    if (logActivity) {
      const topic = extractTopicFromMessage(message.content || message);
      logActivity({
        type: isUser ? 'user_message' : 'ai_response',
        topic: topic || 'general',
        details: { 
          sessionId: currentSessionId, 
          messageLength: (message.content || message).length,
          hasCode: /```/.test(message.content || message)
        },
        engagementScore: isUser ? 0.8 : 0.6
      });
    }
  }, [currentSessionId, logActivity]);

  // Extract concepts from message content
  const extractConceptsFromMessage = useCallback((content) => {
    const concepts = [];
    const conceptKeywords = [
      'algorithm', 'function', 'variable', 'loop', 'condition', 'array', 'object',
      'class', 'method', 'api', 'database', 'framework', 'library', 'debugging',
      'testing', 'optimization', 'data structure', 'recursion', 'async', 'promise',
      'react', 'javascript', 'python', 'sql', 'html', 'css', 'node', 'express'
    ];
    
    const lowerContent = content.toLowerCase();
    conceptKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        concepts.push(keyword);
      }
    });
    
    return [...new Set(concepts)];
  }, []);

  // Extract main topic from message
  const extractTopicFromMessage = useCallback((content) => {
    const contentLower = content.toLowerCase();
    
    const topicKeywords = {
      'javascript': ['javascript', 'js', 'react', 'node', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
      'database': ['sql', 'database', 'mysql', 'postgresql', 'mongodb'],
      'algorithms': ['algorithm', 'sorting', 'searching', 'tree', 'graph', 'complexity'],
      'data structures': ['array', 'linked list', 'stack', 'queue', 'hash', 'heap'],
      'machine learning': ['ml', 'ai', 'neural', 'regression', 'classification', 'model'],
      'web development': ['html', 'css', 'frontend', 'backend', 'api', 'rest'],
      'programming': ['coding', 'programming', 'development', 'software', 'debug']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return topic;
      }
    }
    
    return 'general';
  }, []);

  // Get personalized context for AI
  const getPersonalizedContext = useCallback(() => {
    const currentSession = chatSessions.get(currentSessionId);
    const recentConcepts = currentSession ? Array.from(currentSession.concepts) : [];
    
    // Debug log to see what we're sending
    console.log('🔍 Building personalized context with userProfile:', userProfile);
    
    return {
      user: {
        name: userProfile?.name || user?.email || 'Guest User',
        age: userProfile?.age,
        education: userProfile?.education_level || userProfile?.education,
        occupation: userProfile?.occupation,
        currentSkills: userProfile?.current_skills || [],
        learningGoals: userProfile?.learning_goals || userProfile?.goals || userContext.learningGoals,
        interests: userProfile?.interests || userProfile?.topics_of_interest || [],
        timeAvailable: userProfile?.time_available,
        motivation: userProfile?.motivation,
        currentGoal: userProfile?.current_goal, // Add the main current goal
        experienceLevel: userProfile?.experience_level, // Add experience level
        topicsOfInterest: userProfile?.topics_of_interest || [], // Add topics of interest
        primaryReason: userProfile?.primary_reason, // Add primary reason for learning
        learningStyle: userProfile?.learning_preferences?.style || userProfile?.learning_style?.[0] || userContext.learningStyle,
        skillLevel: userProfile?.skill_level || userProfile?.experience_level || userContext.skillLevel,
        preferredDifficulty: userProfile?.preferred_difficulty || userContext.preferredDifficulty,
        recentTopics: userContext.recentTopics.slice(0, 5),
        totalInteractions: userProfile?.total_interactions || 0,
        learningStreak: userProfile?.learning_streak || 0
      },
      session: {
        id: currentSessionId,
        topic: currentSession?.topic,
        concepts: recentConcepts,
        messageCount: currentSession?.messages.length || 0,
        duration: currentSession ? 
          Math.floor((new Date() - currentSession.startTime) / 1000 / 60) : 0
      },
      context: {
        hasCodeExperience: recentConcepts.some(c => 
          ['programming', 'javascript', 'python', 'algorithm'].includes(c)
        ) || (userProfile?.current_skills || []).some(skill => 
          ['JavaScript', 'Python', 'React', 'Node.js'].includes(skill)
        ),
        preferredExplanationStyle: userProfile?.learning_preferences?.style === 'visual' ? 
          'with examples and diagrams' : 
          userProfile?.learning_preferences?.style === 'auditory' ? 
          'with step-by-step explanations' : 
          'with practical examples',
        personalizedGreeting: userProfile?.name ? 
          `Hello ${userProfile.name}!` : 
          `Hello there!`,
        detailedProfile: !!userProfile?.age // Indicates if we have detailed profile info
      }
    };
  }, [chatSessions, currentSessionId, userContext, userProfile, user]);

  // Update user engagement based on interaction
  const updateEngagement = useCallback((engagementScore) => {
    if (!currentSessionId) return;
    
    setChatSessions(prev => {
      const sessions = new Map(prev);
      const session = sessions.get(currentSessionId);
      
      if (session) {
        // Update engagement with exponential moving average
        session.userEngagement = (session.userEngagement * 0.7) + (engagementScore * 0.3);
        sessions.set(currentSessionId, session);
      }
      
      return sessions;
    });
  }, [currentSessionId]);

  // Get session analytics
  const getSessionAnalytics = useCallback((sessionId = currentSessionId) => {
    if (!sessionId) return null;
    
    const session = chatSessions.get(sessionId);
    if (!session) return null;
    
    const duration = Math.floor((new Date() - session.startTime) / 1000 / 60);
    const messageCount = session.messages.length;
    const conceptsLearned = Array.from(session.concepts);
    
    return {
      sessionId,
      duration,
      messageCount,
      conceptsLearned,
      topic: session.topic,
      engagement: session.userEngagement,
      averageResponseTime: messageCount > 0 ? duration / messageCount : 0
    };
  }, [chatSessions, currentSessionId]);

  // End current session
  const endCurrentSession = useCallback(() => {
    if (!currentSessionId) return;
    
    const session = chatSessions.get(currentSessionId);
    if (session && logActivity) {
      const analytics = getSessionAnalytics();
      
      logActivity({
        type: 'chat_session_ended',
        topic: session.topic || 'general',
        details: analytics,
        duration: analytics.duration,
        engagementScore: session.userEngagement
      });
    }
    
    setCurrentSessionId(null);
  }, [currentSessionId, chatSessions, logActivity, getSessionAnalytics]);

  const value = {
    chatSessions,
    currentSessionId,
    userContext,
    createChatSession,
    addMessageToSession,
    getPersonalizedContext,
    updateEngagement,
    getSessionAnalytics,
    endCurrentSession,
    setUserContext
  };

  return (
    <ChatContextContext.Provider value={value}>
      {children}
    </ChatContextContext.Provider>
  );
};

export default ChatContextProvider;
