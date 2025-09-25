import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useChatContext } from '../contexts/ChatContextContext';
import { FaLightbulb, FaArrowRight, FaClock, FaFire, FaStar, FaBookmark, FaEye, FaTrophy } from 'react-icons/fa';

const SmartRecommendations = () => {
  const { userProfile, isGuest } = useAuth();
  const { activities, learningInsights } = useUserProfile();
  const { getPersonalizedContext, chatSessions } = useChatContext();
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [userProfile, activities, chatSessions]);

  const generateRecommendations = async () => {
    if (isGuest) {
      setRecommendations(getGuestRecommendations());
      return;
    }

    setLoading(true);
    
    try {
      // Get personalized context
      const context = getPersonalizedContext();
      
      // Generate AI-powered recommendations
      const aiRecommendations = await generateAIRecommendations(context);
      
      // Generate pattern-based recommendations
      const patternRecommendations = generatePatternBasedRecommendations();
      
      // Combine and prioritize recommendations
      const allRecommendations = [
        ...aiRecommendations,
        ...patternRecommendations
      ].slice(0, 6); // Limit to 6 recommendations
      
      setRecommendations(allRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations(getDefaultRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async (context) => {
    const recommendations = [];
    
    // Based on learning style
    const learningStyle = context.user?.learningStyle;
    if (learningStyle === 'visual') {
      recommendations.push({
        id: 'visual-learning',
        type: 'learning-style',
        title: 'Try Visual Learning Tools',
        description: 'Explore interactive diagrams and visual coding challenges',
        action: 'Go to Visualizations',
        priority: 'high',
        icon: FaEye,
        color: 'blue'
      });
    } else if (learningStyle === 'kinesthetic') {
      recommendations.push({
        id: 'hands-on-practice',
        type: 'learning-style',
        title: 'Practice with Code Examples',
        description: 'Try hands-on coding exercises and interactive projects',
        action: 'Start Coding',
        priority: 'high',
        icon: FaFire,
        color: 'orange'
      });
    }

    // Based on recent topics
    const recentTopics = context.user?.recentTopics || [];
    if (recentTopics.includes('javascript')) {
      recommendations.push({
        id: 'js-advanced',
        type: 'topic-progression',
        title: 'Advanced JavaScript Concepts',
        description: 'Learn async/await, closures, and modern ES6+ features',
        action: 'Learn More',
        priority: 'medium',
        icon: FaArrowRight,
        color: 'green'
      });
    }

    // Based on skill level
    const skillLevel = context.user?.skillLevel;
    if (skillLevel === 'beginner') {
      recommendations.push({
        id: 'beginner-path',
        type: 'skill-level',
        title: 'Beginner Learning Path',
        description: 'Follow a structured path from basics to intermediate concepts',
        action: 'Start Path',
        priority: 'high',
        icon: FaStar,
        color: 'purple'
      });
    }

    return recommendations;
  };

  const generatePatternBasedRecommendations = () => {
    const recommendations = [];
    
    if (!activities || activities.length === 0) {
      return recommendations;
    }

    // Analyze activity patterns
    const topicCounts = {};
    const recentActivities = activities.slice(-20); // Last 20 activities
    
    recentActivities.forEach(activity => {
      const topic = activity.topic || 'general';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    // Find most practiced topic
    const topTopic = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (topTopic && topTopic[1] >= 3) {
      recommendations.push({
        id: 'topic-mastery',
        type: 'pattern-based',
        title: `Master ${topTopic[0]}`,
        description: `You've been practicing ${topTopic[0]}. Ready for advanced challenges?`,
        action: 'Take Challenge',
        priority: 'medium',
        icon: FaTrophy,
        color: 'yellow'
      });
    }

    // Check for learning consistency
    const hasRecentActivity = activities.some(activity => {
      const activityDate = new Date(activity.timestamp);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return activityDate >= yesterday;
    });

    if (!hasRecentActivity) {
      recommendations.push({
        id: 'consistency',
        type: 'habit-building',
        title: 'Keep Your Streak Going',
        description: 'You haven\'t practiced in a while. Start with a quick 5-minute session!',
        action: 'Quick Practice',
        priority: 'high',
        icon: FaFire,
        color: 'red'
      });
    }

    // Check for weak areas
    if (userProfile?.weakTopics && userProfile.weakTopics.length > 0) {
      const weakTopic = userProfile.weakTopics[0];
      recommendations.push({
        id: 'weak-topic',
        type: 'improvement',
        title: `Strengthen ${weakTopic}`,
        description: 'Focus on areas that need improvement to become well-rounded',
        action: 'Practice Now',
        priority: 'medium',
        icon: FaBookmark,
        color: 'indigo'
      });
    }

    return recommendations;
  };

  const getGuestRecommendations = () => [
    {
      id: 'guest-signup',
      type: 'account',
      title: 'Create Your Learning Profile',
      description: 'Sign up to get personalized recommendations and track your progress',
      action: 'Sign Up',
      priority: 'high',
      icon: FaStar,
      color: 'purple'
    },
    {
      id: 'guest-explore',
      type: 'exploration',
      title: 'Explore AI Learning Tools',
      description: 'Try our interactive chat, visualizations, and learning games',
      action: 'Explore',
      priority: 'medium',
      icon: FaLightbulb,
      color: 'blue'
    }
  ];

  const getDefaultRecommendations = () => [
    {
      id: 'default-chat',
      type: 'feature',
      title: 'Try AI-Powered Learning Chat',
      description: 'Ask questions and get personalized explanations',
      action: 'Start Chat',
      priority: 'high',
      icon: FaLightbulb,
      color: 'blue'
    },
    {
      id: 'default-visual',
      type: 'feature',
      title: 'Visual Learning Tools',
      description: 'Explore interactive diagrams and visualizations',
      action: 'See Visuals',
      priority: 'medium',
      icon: FaEye,
      color: 'green'
    }
  ];

  const handleRecommendationClick = (recommendation) => {
    // Handle different recommendation actions
    switch (recommendation.id) {
      case 'visual-learning':
        window.location.hash = '#/visualize';
        break;
      case 'js-advanced':
        // Open chat with JavaScript query
        window.location.hash = '#/';
        break;
      case 'guest-signup':
        // Open auth modal (you'd implement this)
        break;
      default:
        console.log('Clicked recommendation:', recommendation);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-blue-500';
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-400 bg-blue-900/20',
      green: 'text-green-400 bg-green-900/20',
      orange: 'text-orange-400 bg-orange-900/20',
      purple: 'text-purple-400 bg-purple-900/20',
      red: 'text-red-400 bg-red-900/20',
      yellow: 'text-yellow-400 bg-yellow-900/20',
      indigo: 'text-indigo-400 bg-indigo-900/20'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FaLightbulb className="text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Smart Recommendations</h2>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <FaLightbulb className="mx-auto text-4xl text-gray-500 mb-4" />
          <p className="text-gray-400">Keep learning to get personalized recommendations!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const IconComponent = rec.icon;
            const colorClasses = getColorClasses(rec.color);
            const priorityColor = getPriorityColor(rec.priority);
            
            return (
              <div
                key={rec.id}
                className={`bg-gray-800 rounded-lg p-4 border-l-4 ${priorityColor} hover:bg-gray-750 transition-colors cursor-pointer`}
                onClick={() => handleRecommendationClick(rec)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <IconComponent className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{rec.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{rec.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.priority === 'high' 
                          ? 'bg-red-900/30 text-red-300'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-900/30 text-yellow-300'
                          : 'bg-green-900/30 text-green-300'
                      }`}>
                        {rec.priority} priority
                      </span>
                      <span className="text-blue-400 text-sm hover:text-blue-300">
                        {rec.action} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center space-x-2 p-3 bg-blue-900/30 rounded-lg hover:bg-blue-900/50 transition-colors">
            <FaClock className="text-blue-400" />
            <span className="text-white text-sm">5-min Practice</span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-purple-900/30 rounded-lg hover:bg-purple-900/50 transition-colors">
            <FaTrophy className="text-purple-400" />
            <span className="text-white text-sm">Daily Challenge</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
