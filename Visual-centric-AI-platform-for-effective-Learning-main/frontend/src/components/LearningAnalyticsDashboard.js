import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useChatContext } from '../contexts/ChatContextContext';
import { FaChartLine, FaClock, FaFire, FaTrophy, FaBrain, FaEye } from 'react-icons/fa';

const LearningAnalyticsDashboard = () => {
  const { userProfile, isGuest } = useAuth();
  const { activities, learningInsights } = useUserProfile();
  const { chatSessions, getSessionAnalytics } = useChatContext();
  
  const [analyticsData, setAnalyticsData] = useState({
    totalSessions: 0,
    totalTime: 0,
    averageSessionTime: 0,
    topTopics: [],
    learningStreak: 0,
    engagementScore: 0,
    conceptsMastered: 0,
    weeklyActivity: []
  });

  const [timeframe, setTimeframe] = useState('week'); // week, month, all

  useEffect(() => {
    calculateAnalytics();
  }, [activities, chatSessions, timeframe]);

  const calculateAnalytics = () => {
    if (!activities || activities.length === 0) {
      return;
    }

    // Filter activities based on timeframe
    const now = new Date();
    const filterDate = new Date();
    if (timeframe === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      filterDate.setDate(now.getDate() - 30);
    } else {
      filterDate.setFullYear(2020); // All time
    }

    const filteredActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= filterDate
    );

    // Calculate session analytics
    const sessions = Array.from(chatSessions.values());
    const recentSessions = sessions.filter(session => 
      new Date(session.startTime) >= filterDate
    );

    const totalSessions = recentSessions.length;
    const totalTime = recentSessions.reduce((total, session) => {
      const duration = session.lastActivity ? 
        Math.floor((new Date(session.lastActivity) - new Date(session.startTime)) / 1000 / 60) : 0;
      return total + duration;
    }, 0);

    const averageSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;

    // Calculate top topics
    const topicCounts = {};
    filteredActivities.forEach(activity => {
      const topic = activity.topic || 'general';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    // Calculate learning streak
    const learningStreak = calculateLearningStreak(activities);

    // Calculate engagement score
    const engagementScore = calculateEngagementScore(filteredActivities);

    // Calculate concepts mastered
    const conceptsMastered = calculateConceptsMastered(recentSessions);

    // Calculate weekly activity
    const weeklyActivity = calculateWeeklyActivity(filteredActivities);

    setAnalyticsData({
      totalSessions,
      totalTime,
      averageSessionTime,
      topTopics,
      learningStreak,
      engagementScore,
      conceptsMastered,
      weeklyActivity
    });
  };

  const calculateLearningStreak = (activities) => {
    if (!activities || activities.length === 0) return 0;

    const sortedActivities = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayActivities = sortedActivities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === currentDate.getTime();
      });
      
      if (dayActivities.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateEngagementScore = (activities) => {
    if (!activities || activities.length === 0) return 0;
    
    const totalEngagement = activities.reduce((total, activity) => {
      return total + (activity.engagementScore || 0.5);
    }, 0);
    
    return Math.round((totalEngagement / activities.length) * 100);
  };

  const calculateConceptsMastered = (sessions) => {
    const allConcepts = new Set();
    sessions.forEach(session => {
      if (session.concepts) {
        session.concepts.forEach(concept => allConcepts.add(concept));
      }
    });
    return allConcepts.size;
  };

  const calculateWeeklyActivity = (activities) => {
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === date.getTime();
      });
      
      weekData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayActivities.length,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return weekData;
  };

  if (isGuest) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <FaChartLine className="mx-auto text-4xl text-gray-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Learning Analytics</h2>
          <p className="text-gray-400">
            Sign up for an account to track your learning progress and view detailed analytics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">📊 Learning Analytics</h2>
        <div className="flex space-x-2">
          {['week', 'month', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/30 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaChartLine className="text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-blue-400">{analyticsData.totalSessions}</div>
              <div className="text-blue-300 text-sm">Sessions</div>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaClock className="text-green-400" />
            <div>
              <div className="text-2xl font-bold text-green-400">{analyticsData.totalTime}m</div>
              <div className="text-green-300 text-sm">Total Time</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-900/30 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaFire className="text-orange-400" />
            <div>
              <div className="text-2xl font-bold text-orange-400">{analyticsData.learningStreak}</div>
              <div className="text-orange-300 text-sm">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-900/30 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaBrain className="text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-purple-400">{analyticsData.conceptsMastered}</div>
              <div className="text-purple-300 text-sm">Concepts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Weekly Activity</h3>
        <div className="flex items-end space-x-2 h-32">
          {analyticsData.weeklyActivity.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="bg-blue-500 rounded-t w-full transition-all duration-300"
                style={{ 
                  height: `${day.count > 0 ? Math.max((day.count / Math.max(...analyticsData.weeklyActivity.map(d => d.count), 1)) * 100, 10) : 4}%`,
                  minHeight: '4px'
                }}
                title={`${day.count} activities on ${day.date}`}
              ></div>
              <div className="text-xs text-gray-400 mt-2">{day.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Topics */}
      {analyticsData.topTopics.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Top Learning Topics</h3>
          <div className="space-y-3">
            {analyticsData.topTopics.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="text-sm text-gray-400 w-4">{index + 1}</div>
                <div className="flex-1">
                  <div className="text-white capitalize">{item.topic}</div>
                  <div className="bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(item.count / analyticsData.topTopics[0]?.count) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <FaEye className="text-blue-400" />
            <div>
              <div className="text-white font-medium">Engagement Score</div>
              <div className="text-gray-400 text-sm">{analyticsData.engagementScore}% average engagement</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <FaClock className="text-green-400" />
            <div>
              <div className="text-white font-medium">Session Quality</div>
              <div className="text-gray-400 text-sm">{Math.round(analyticsData.averageSessionTime)} min average session</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-yellow-400" />
            <div>
              <div className="text-white font-medium">Learning Consistency</div>
              <div className="text-gray-400 text-sm">
                {analyticsData.learningStreak > 3 ? 'Excellent' : 
                 analyticsData.learningStreak > 1 ? 'Good' : 'Getting Started'} streak
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <FaBrain className="text-purple-400" />
            <div>
              <div className="text-white font-medium">Knowledge Growth</div>
              <div className="text-gray-400 text-sm">{analyticsData.conceptsMastered} new concepts learned</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {learningInsights && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-lg border border-blue-500/20">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">🤖 AI Learning Insights</h3>
          <div className="space-y-3">
            {learningInsights.primaryLearningStyle && (
              <p className="text-blue-200">
                <strong>Learning Style:</strong> You demonstrate a <strong>{learningInsights.primaryLearningStyle}</strong> learning preference.
              </p>
            )}
            {learningInsights.strengths && learningInsights.strengths.length > 0 && (
              <p className="text-green-200">
                <strong>Strengths:</strong> {learningInsights.strengths.join(', ')}
              </p>
            )}
            {learningInsights.recommendations && learningInsights.recommendations.length > 0 && (
              <div>
                <p className="text-yellow-200 font-medium">Recommendations:</p>
                <ul className="list-disc list-inside text-yellow-100 ml-4">
                  {learningInsights.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningAnalyticsDashboard;
