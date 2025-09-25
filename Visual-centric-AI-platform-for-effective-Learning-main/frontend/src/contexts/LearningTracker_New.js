import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './UserProfileContext';

const LearningTrackerContext = createContext();

export const useLearningTracker = () => {
    const context = useContext(LearningTrackerContext);
    if (!context) {
        throw new Error('useLearningTracker must be used within a LearningTrackerProvider');
    }
    return context;
};

export const LearningTrackerProvider = ({ children }) => {
    const { logActivity } = useUserProfile() || {};
    
    const [userActivity, setUserActivity] = useState({
        sessions: 0,
        totalTimeSpent: 0,
        conceptsLearned: [],
        currentStreak: 0,
        skillsExplored: [],
        dailyActivity: [],
        learningLevel: 'beginner',
        lastActive: new Date().toISOString(),
        interactions: []
    });

    const [sessionStartTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState('home');
    const [isActive, setIsActive] = useState(true);

    // Helper function to extract topic from activity
    const extractTopicFromActivity = useCallback((activity) => {
        const activityLower = activity.toLowerCase();
        
        const topicKeywords = {
            'javascript': ['javascript', 'js', 'react', 'node'],
            'python': ['python', 'django', 'flask', 'pandas'],
            'database': ['sql', 'database', 'mysql', 'postgresql'],
            'algorithms': ['algorithm', 'sorting', 'searching', 'tree', 'graph'],
            'data structures': ['array', 'linked list', 'stack', 'queue', 'hash'],
            'machine learning': ['ml', 'ai', 'neural', 'regression', 'classification'],
            'web development': ['html', 'css', 'frontend', 'backend', 'api'],
            'programming': ['coding', 'programming', 'development', 'software']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => activityLower.includes(keyword))) {
                return topic;
            }
        }

        return 'general';
    }, []);

    // Helper function to calculate activity duration
    const calculateDuration = useCallback((activity) => {
        const activityLower = activity.toLowerCase();
        
        if (activityLower.includes('page_visit')) return 1;
        if (activityLower.includes('game')) return 5;
        if (activityLower.includes('quiz')) return 3;
        if (activityLower.includes('voice')) return 2;
        if (activityLower.includes('chat')) return 2;
        
        return 1;
    }, []);

    // Enhanced learning activity tracking
    const trackLearningActivity = useCallback((activity, engagementScore = 0.5, details = {}) => {
        const timestamp = new Date().toISOString();
        const sessionTime = Date.now() - sessionStartTime.getTime();
        
        const topic = details.topic || extractTopicFromActivity(activity);
        
        const newActivity = {
            id: Date.now() + Math.random(),
            activity,
            timestamp,
            engagementScore,
            sessionTime,
            page: currentPage,
            details: {
                ...details,
                topic,
                duration: details.duration || calculateDuration(activity)
            }
        };

        // Update local state
        setUserActivity(prev => {
            const newInteractions = [...prev.interactions, newActivity];
            const newConceptsLearned = [...new Set([...prev.conceptsLearned, ...(details.concepts || [])])];
            const newSkillsExplored = [...new Set([...prev.skillsExplored, ...(details.skills || [])])];
            
            const totalInteractions = newInteractions.length;
            let learningLevel = 'beginner';
            if (totalInteractions > 50) learningLevel = 'advanced';
            else if (totalInteractions > 20) learningLevel = 'intermediate';

            return {
                ...prev,
                interactions: newInteractions.slice(-100),
                conceptsLearned: newConceptsLearned,
                skillsExplored: newSkillsExplored,
                learningLevel,
                lastActive: timestamp
            };
        });

        // Log to user profile if available
        if (logActivity) {
            logActivity({
                type: activity,
                topic,
                engagementScore,
                duration: details.duration || 1,
                page: currentPage,
                metadata: details
            });
        }
    }, [sessionStartTime, currentPage, logActivity, extractTopicFromActivity, calculateDuration]);

    // Track page visits
    const trackPageVisit = useCallback((page) => {
        setCurrentPage(page);
        trackLearningActivity('page_visit', 0.3, { page });
    }, [trackLearningActivity]);

    // Track queries/chats
    const trackQuery = useCallback((query, response, concepts = []) => {
        const skills = query.toLowerCase().includes('javascript') ? ['javascript'] : 
                     query.toLowerCase().includes('python') ? ['python'] : ['general'];
        
        trackLearningActivity('chat_query', 0.7, {
            query,
            response: response?.substring(0, 100),
            concepts,
            skills
        });
    }, [trackLearningActivity]);

    // Track games
    const trackGameActivity = useCallback((gameType, score, topic) => {
        trackLearningActivity('game_activity', 0.8, {
            gameType,
            score,
            topic,
            concepts: [topic]
        });
    }, [trackLearningActivity]);

    // Track voice interactions
    const trackVoiceInteraction = useCallback((action, duration) => {
        trackLearningActivity('voice_interaction', 0.6, {
            action,
            duration,
            skills: ['communication']
        });
    }, [trackLearningActivity]);

    // Save activity to backend (placeholder)
    const saveActivityToBackend = useCallback(async (activity) => {
        if (process.env.REACT_APP_BACKEND_URL) {
            try {
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/activity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activity)
                });
            } catch (error) {
                console.log('Backend activity save failed:', error);
            }
        }
    }, []);

    // Auto-save activities
    useEffect(() => {
        const interval = setInterval(() => {
            if (userActivity.interactions.length > 0) {
                const lastActivity = userActivity.interactions[userActivity.interactions.length - 1];
                saveActivityToBackend(lastActivity);
            }
        }, 30000); // Save every 30 seconds

        return () => clearInterval(interval);
    }, [userActivity.interactions, saveActivityToBackend]);

    // Track user activity/inactivity
    useEffect(() => {
        let inactivityTimer;

        const resetTimer = () => {
            setIsActive(true);
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                setIsActive(false);
            }, 5 * 60 * 1000); // 5 minutes
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer, true);
            });
        };
    }, []);

    const value = {
        userActivity,
        trackLearningActivity,
        trackPageVisit,
        trackQuery,
        trackGameActivity,
        trackVoiceInteraction,
        currentPage,
        isActive,
        sessionStartTime
    };

    return (
        <LearningTrackerContext.Provider value={value}>
            {children}
        </LearningTrackerContext.Provider>
    );
};
