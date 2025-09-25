import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, BookOpen, Target, Star, Brain, Code } from 'lucide-react';

const LearningDashboard = ({ userId = 'demo_user_123' }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillAssessment, setSkillAssessment] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user-profile/${userId}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessSkillLevel = async () => {
    // Sample code for skill assessment
    const sampleCodes = [
      `function calculateSum(a, b) {
        return a + b;
      }`,
      `const users = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      
      const adults = users.filter(user => user.age >= 18);
      console.log(adults);`,
      `async function fetchUserData(id) {
        try {
          const response = await fetch(\`/api/users/\${id}\`);
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Error:', error);
          return null;
        }
      }`
    ];

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/assess-skill-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          code_samples: sampleCodes,
          language: 'javascript'
        }),
      });

      if (response.ok) {
        const assessment = await response.json();
        setSkillAssessment(assessment);
        // Refresh profile to get updated skill level
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error assessing skill level:', error);
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-blue-600 bg-blue-100';
      case 'advanced':
        return 'text-purple-600 bg-purple-100';
      case 'expert':
        return 'text-gold-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSkillLevelProgress = (level) => {
    switch (level) {
      case 'beginner':
        return 25;
      case 'intermediate':
        return 50;
      case 'advanced':
        return 75;
      case 'expert':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learning Dashboard</h1>
            <p className="text-indigo-100">Track your progress and discover new learning opportunities</p>
          </div>
          <Brain className="h-16 w-16 text-indigo-200" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Level</p>
              <p className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${getSkillLevelColor(userProfile?.skill_level || 'beginner')}`}>
                {userProfile?.skill_level || 'Beginner'}
              </p>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Topics Explored</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(userProfile?.knowledge_areas || {}).length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Sessions</p>
              <p className="text-2xl font-bold text-green-600">
                {userProfile?.interactions_count || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Skill Progress</p>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full h-2 w-16">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${getSkillLevelProgress(userProfile?.skill_level)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{getSkillLevelProgress(userProfile?.skill_level)}%</span>
              </div>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Areas */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="mr-2" size={20} />
            Knowledge Areas
          </h3>
          
          {Object.keys(userProfile?.knowledge_areas || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(userProfile.knowledge_areas).map(([topic, data]) => (
                <div key={topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{topic}</p>
                    <p className="text-sm text-gray-600">
                      {data.interactions} interaction{data.interactions !== 1 ? 's' : ''}
                      {' • '}
                      Level: {data.estimated_skill}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < (data.estimated_skill === 'beginner' ? 1 : 
                              data.estimated_skill === 'intermediate' ? 3 : 5)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">No knowledge areas yet</p>
              <p className="text-sm text-gray-500">Start analyzing code to track your progress</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Personalized Recommendations
          </h3>
          
          <div className="space-y-4">
            {userProfile?.recommendations && userProfile.recommendations.length > 0 ? (
              userProfile.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600">No recommendations yet</p>
                <p className="text-sm text-gray-500">Complete more learning activities to get personalized suggestions</p>
              </div>
            )}
          </div>

          {/* Skill Assessment Button */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={assessSkillLevel}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center justify-center"
            >
              <Brain className="mr-2" size={16} />
              Assess My Skill Level
            </button>
            
            {skillAssessment && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Assessment Complete!</strong> Your skill level has been updated to{' '}
                  <span className="font-medium capitalize">{skillAssessment.assessed_skill_level}</span>
                  {' '}(Confidence: {Math.round(skillAssessment.confidence * 100)}%)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Learning Activity */}
      {userProfile?.learning_progress && Object.keys(userProfile.learning_progress).length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            Learning Progress
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(userProfile.learning_progress).map(([topic, progress]) => (
              <div key={topic} className="p-4 border rounded-lg">
                <h4 className="font-medium capitalize mb-2">{topic}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress.progress_percentage || 0)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${progress.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Level: {progress.skill_level || 'Not assessed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <TrendingUp className="mr-2 text-green-600" size={20} />
          Continue Your Learning Journey
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2">Analyze Your Code</h4>
            <p className="text-sm text-gray-600 mb-3">Get personalized feedback and learn from your code</p>
            <button className="text-blue-600 text-sm font-medium hover:underline">
              Start Code Analysis →
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2">Practice Challenges</h4>
            <p className="text-sm text-gray-600 mb-3">Solve coding problems tailored to your skill level</p>
            <button className="text-blue-600 text-sm font-medium hover:underline">
              Browse Challenges →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
