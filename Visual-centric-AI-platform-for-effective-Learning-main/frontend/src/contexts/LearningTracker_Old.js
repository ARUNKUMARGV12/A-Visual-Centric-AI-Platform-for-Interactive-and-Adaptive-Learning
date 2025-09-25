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

    const [sessionStartTime, setSessionStartTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState('home');
    const [isActive, setIsActive] = useState(true);

    // Enhanced learning activity tracking
    const trackLearningActivity = useCallback((activity, engagementScore = 0.5, details = {}) => {
        const timestamp = new Date().toISOString();
        const sessionTime = Date.now() - sessionStartTime.getTime();
        
        // Extract topic from activity description
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
            
            // Calculate learning level based on interactions
            const totalInteractions = newInteractions.length;
            let learningLevel = 'beginner';
            if (totalInteractions > 50) learningLevel = 'advanced';
            else if (totalInteractions > 20) learningLevel = 'intermediate';

            return {
                ...prev,
                interactions: newInteractions.slice(-100), // Keep last 100
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
    }, [sessionStartTime, currentPage, logActivity]);

    // Helper function to extract topic from activity
    const extractTopicFromActivity = (activity) => {
        const activityLower = activity.toLowerCase();
        
        // Common topic keywords
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
    };

    // Helper function to calculate activity duration
    const calculateDuration = (activity) => {
        const activityLower = activity.toLowerCase();
        
        if (activityLower.includes('page_visit')) return 1;
        if (activityLower.includes('game')) return 5;
        if (activityLower.includes('quiz')) return 3;
        if (activityLower.includes('voice')) return 2;
        if (activityLower.includes('chat')) return 2;
        
        return 1; // default
    };

    // Legacy function for backward compatibility
    const trackInteraction = useCallback((interactionData) => {
        trackLearningActivity(
            interactionData.type || 'interaction',
            interactionData.engagementScore || 0.5,
            interactionData
        );
    }, [trackLearningActivity]);
            const today = new Date().toISOString().split('T')[0];
            const dailyActivity = [...prev.dailyActivity];
            const todayIndex = dailyActivity.findIndex(day => day.date === today);
            
            if (todayIndex >= 0) {
                dailyActivity[todayIndex] = {
                    ...dailyActivity[todayIndex],
                    sessions: dailyActivity[todayIndex].sessions + 1,
                    timeSpent: dailyActivity[todayIndex].timeSpent + (interactionData.timeSpent || 1),
                    conceptsLearned: dailyActivity[todayIndex].conceptsLearned + (interactionData.concepts?.length || 0)
                };
            } else {
                dailyActivity.push({
                    date: today,
                    sessions: 1,
                    timeSpent: interactionData.timeSpent || 1,
                    conceptsLearned: interactionData.concepts?.length || 0
                });
            }

            // Calculate streak
            let currentStreak = 0;
            const sortedDays = dailyActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
            for (const day of sortedDays) {
                if (day.sessions > 0) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            return {
                ...prev,
                sessions: prev.sessions + 1,
                totalTimeSpent: prev.totalTimeSpent + (interactionData.timeSpent || 1),
                conceptsLearned: newConceptsLearned,
                skillsExplored: newSkillsExplored,
                interactions: newInteractions,
                learningLevel,
                dailyActivity,
                currentStreak,
                lastActive: new Date().toISOString()
            };
        });

        // Send to backend
        saveActivityToBackend(interaction);
    }, [currentPage, sessionStartTime]);

    // Track page visits
    const trackPageVisit = useCallback((page) => {
        setCurrentPage(page);
        trackInteraction({
            type: 'page_visit',
            page: page,
            timeSpent: 0
        });
    }, [trackInteraction]);

    // Track queries/chats
    const trackQuery = useCallback((query, response, concepts = []) => {
        const skills = extractSkillsFromQuery(query);
        trackInteraction({
            type: 'query',
            query: query,
            response: response,
            concepts: concepts,
            skills: skills,
            timeSpent: 2 // Average time per query
        });
    }, [trackInteraction]);

    // Track learning activities
    const trackLearningActivity = useCallback((activity, timeSpent = 1) => {
        trackInteraction({
            type: 'learning_activity',
            activity: activity,
            timeSpent: timeSpent,
            concepts: [activity],
            skills: [activity]
        });
    }, [trackInteraction]);

    // Extract skills from user queries
    const extractSkillsFromQuery = (query) => {
        const skillKeywords = {
            'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
            'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
            'web_development': ['html', 'css', 'frontend', 'backend', 'web'],
            'data_science': ['data', 'analysis', 'machine learning', 'ai', 'ml'],
            'algorithms': ['algorithm', 'sorting', 'search', 'complexity'],
            'databases': ['sql', 'database', 'mongodb', 'postgresql'],
            'api': ['api', 'rest', 'graphql', 'endpoint'],
            'debugging': ['debug', 'error', 'fix', 'bug', 'troubleshoot']
        };

        const skills = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [skill, keywords] of Object.entries(skillKeywords)) {
            if (keywords.some(keyword => lowerQuery.includes(keyword))) {
                skills.push(skill);
            }
        }
        
        return skills;
    };

    // Save activity to backend
    const saveActivityToBackend = async (interaction) => {
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            await fetch(`${backendUrl}/api/learning-interaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 'default',
                    interaction_type: interaction.type,
                    topic: interaction.page || interaction.activity || 'general',
                    complexity: 'medium',
                    performance_score: 0.8,
                    time_spent: interaction.timeSpent || 1,
                    concepts: interaction.concepts || [],
                    skills: interaction.skills || []
                }),
            });
        } catch (error) {
            console.error('Failed to save activity to backend:', error);
        }
    };

    // Load activity from backend on mount
    useEffect(() => {
        const loadUserActivity = async () => {
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
                const [profileResponse, activityResponse] = await Promise.all([
                    fetch(`${backendUrl}/api/user-profile/default`),
                    fetch(`${backendUrl}/api/user-activity/default`)
                ]);

                if (profileResponse.ok && activityResponse.ok) {
                    const profile = await profileResponse.json();
                    const activity = await activityResponse.json();
                    
                    setUserActivity(prev => ({
                        ...prev,
                        sessions: activity.sessions || 0,
                        totalTimeSpent: activity.totalTime || 0,
                        currentStreak: activity.currentStreak || 0,
                        dailyActivity: activity.dailyActivity || [],
                        skillsExplored: Object.keys(profile.knowledge_areas || {}),
                        learningLevel: profile.skill_level || 'beginner',
                        conceptsLearned: profile.learned_concepts || []
                    }));
                }
            } catch (error) {
                console.error('Failed to load user activity:', error);
            }
        };

        loadUserActivity();
    }, []);

    // Track session time
    useEffect(() => {
        const interval = setInterval(() => {
            if (isActive) {
                setUserActivity(prev => ({
                    ...prev,
                    totalTimeSpent: prev.totalTimeSpent + 1
                }));
            }
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isActive]);

    // Track user activity/inactivity
    useEffect(() => {
        const handleActivity = () => setIsActive(true);
        const handleInactivity = () => setIsActive(false);

        document.addEventListener('mousedown', handleActivity);
        document.addEventListener('keydown', handleActivity);
        document.addEventListener('scroll', handleActivity);

        const inactivityTimer = setTimeout(handleInactivity, 5 * 60 * 1000); // 5 minutes

        return () => {
            document.removeEventListener('mousedown', handleActivity);
            document.removeEventListener('keydown', handleActivity);
            document.removeEventListener('scroll', handleActivity);
            clearTimeout(inactivityTimer);
        };
    }, []);

    const value = {
        userActivity,
        trackInteraction,
        trackPageVisit,
        trackQuery,
        trackLearningActivity,
        isActive,
        sessionStartTime
    };

    return (
        <LearningTrackerContext.Provider value={value}>
            {children}
        </LearningTrackerContext.Provider>
    );
};
