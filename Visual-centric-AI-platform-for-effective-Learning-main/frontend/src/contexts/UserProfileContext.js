import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { logUserActivity, getUserActivities } from '../lib/supabase';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const { user, userProfile, updateProfile, isAuthenticated, isGuest } = useAuth();
  const [activityHistory, setActivityHistory] = useState([]);
  const [learningInsights, setLearningInsights] = useState({});
  const [sessionStartTime] = useState(new Date());

  // Load user activity history
  useEffect(() => {
    const loadActivityHistory = async () => {
      if (user && !isGuest) {
        const { data: activities, error } = await getUserActivities(user.id);
        if (!error && activities) {
          setActivityHistory(activities);
          generateLearningInsights(activities);
        }
      }
    };

    if (isAuthenticated) {
      loadActivityHistory();
    }
  }, [user, isAuthenticated, isGuest]);

  // Generate learning insights from activity data
  const generateLearningInsights = useCallback((activities) => {
    if (!activities || activities.length === 0) return;

    const insights = {
      totalActivities: activities.length,
      topicsExplored: new Set(),
      learningStyleInference: {},
      weakAreas: [],
      strengths: [],
      timeSpentByTopic: {},
      engagementPatterns: {},
      recentActivity: activities.slice(0, 10)
    };

    activities.forEach(activity => {
      // Track topics
      if (activity.topic) {
        insights.topicsExplored.add(activity.topic);
        insights.timeSpentByTopic[activity.topic] = 
          (insights.timeSpentByTopic[activity.topic] || 0) + (activity.duration || 1);
      }

      // Infer learning style based on activity type
      const activityType = activity.activity_type;
      if (activityType) {
        insights.learningStyleInference[activityType] = 
          (insights.learningStyleInference[activityType] || 0) + 1;
      }

      // Track engagement patterns
      if (activity.engagement_score) {
        const topic = activity.topic || 'general';
        if (!insights.engagementPatterns[topic]) {
          insights.engagementPatterns[topic] = { total: 0, count: 0 };
        }
        insights.engagementPatterns[topic].total += activity.engagement_score;
        insights.engagementPatterns[topic].count += 1;
      }
    });

    // Convert Set to Array
    insights.topicsExplored = Array.from(insights.topicsExplored);

    // Infer primary learning style
    const styleFrequency = insights.learningStyleInference;
    const primaryStyle = Object.keys(styleFrequency).reduce((a, b) => 
      styleFrequency[a] > styleFrequency[b] ? a : b, 'unknown'
    );

    // Identify weak areas (low engagement)
    Object.keys(insights.engagementPatterns).forEach(topic => {
      const pattern = insights.engagementPatterns[topic];
      const avgEngagement = pattern.total / pattern.count;
      if (avgEngagement < 0.5 && pattern.count > 2) {
        insights.weakAreas.push(topic);
      } else if (avgEngagement > 0.8 && pattern.count > 2) {
        insights.strengths.push(topic);
      }
    });

    insights.primaryLearningStyle = primaryStyle;
    setLearningInsights(insights);
  }, []);

  // Log user activity
  const logActivity = useCallback(async (activityData) => {
    if (!user) return;

    const activity = {
      activity_type: activityData.type || 'interaction',
      topic: activityData.topic,
      details: activityData.details || {},
      duration: activityData.duration || 1,
      engagement_score: activityData.engagementScore || 0.5,
      page: activityData.page || window.location.pathname,
      session_time: Date.now() - sessionStartTime.getTime(),
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...activityData.metadata
      }
    };

    // For guest users, just update local state
    if (isGuest) {
      setActivityHistory(prev => [activity, ...prev].slice(0, 100));
      return;
    }

    // For authenticated users, save to database
    try {
      const { data, error } = await logUserActivity(user.id, activity);
      if (!error && data) {
        setActivityHistory(prev => [data[0], ...prev].slice(0, 100));
        
        // Update user profile interaction count
        const newInteractionCount = (userProfile?.total_interactions || 0) + 1;
        await updateProfile({ 
          total_interactions: newInteractionCount,
          last_active: new Date().toISOString()  // Use snake_case for database
        });
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user, userProfile, updateProfile, isGuest, sessionStartTime]);

  // Update learning preferences based on activity
  const updateLearningPreferences = useCallback(async (preferences) => {
    if (!userProfile) return;

    const updatedPreferences = {
      ...userProfile.learning_preferences,
      ...preferences,
      lastUpdated: new Date().toISOString()
    };

    await updateProfile({ learning_preferences: updatedPreferences });
  }, [userProfile, updateProfile]);

  // Add learning goal
  const addLearningGoal = useCallback(async (goal) => {
    if (!userProfile) return;

    const newGoal = {
      id: Date.now(),
      text: goal,
      created: new Date().toISOString(),
      completed: false,
      progress: 0
    };

    const updatedGoals = [...(userProfile.goals || []), newGoal];
    await updateProfile({ goals: updatedGoals });
    
    // Log goal setting activity
    await logActivity({
      type: 'goal_set',
      details: { goal },
      engagementScore: 0.9
    });
  }, [userProfile, updateProfile, logActivity]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId, progress) => {
    if (!userProfile || !userProfile.goals) return;

    const updatedGoals = userProfile.goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, progress, completed: progress >= 100 }
        : goal
    );

    await updateProfile({ goals: updatedGoals });
  }, [userProfile, updateProfile]);

  // Mark topic as weak area
  const markWeakTopic = useCallback(async (topic) => {
    if (!userProfile) return;

    const weakTopics = userProfile.weakTopics || [];
    if (!weakTopics.includes(topic)) {
      const updatedWeakTopics = [...weakTopics, topic];
      await updateProfile({ weakTopics: updatedWeakTopics });
    }
  }, [userProfile, updateProfile]);

  // Track topic mastery
  const updateTopicProgress = useCallback(async (topic, score) => {
    if (!userProfile) return;

    const topicProgress = userProfile.topicProgress || {};
    const currentProgress = topicProgress[topic] || { score: 0, attempts: 0 };
    
    const updatedProgress = {
      score: Math.max(currentProgress.score, score),
      attempts: currentProgress.attempts + 1,
      lastStudied: new Date().toISOString()
    };

    await updateProfile({ 
      topicProgress: { ...topicProgress, [topic]: updatedProgress }
    });
  }, [userProfile, updateProfile]);

  // Complete onboarding
  const completeOnboarding = useCallback(async (onboardingData) => {
    if (!userProfile) return;

    await updateProfile({ 
      onboarding_completed: true,
      learning_preferences: {
        ...userProfile.learning_preferences,
        ...onboardingData.preferences
      },
      goals: onboardingData.goals || [],
      skillLevel: onboardingData.skillLevel || 'beginner'
    });
  }, [userProfile, updateProfile]);

  const value = {
    userProfile,
    activityHistory,
    learningInsights,
    logActivity,
    updateLearningPreferences,
    addLearningGoal,
    updateGoalProgress,
    markWeakTopic,
    updateTopicProgress,
    completeOnboarding,
    updateProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
