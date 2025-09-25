import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, TrendingUp, Target, BookOpen } from 'lucide-react';

const CodeAnalysisPage = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [userLevel, setUserLevel] = useState('beginner');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Sample user ID (in real app, this would come from authentication)
  const userId = 'demo_user_123';

  useEffect(() => {
    // Load user profile on component mount
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user-profile/${userId}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        setUserLevel(profile.skill_level);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim()) {
      alert('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language,
          user_id: userId,
          user_level: userLevel
        }),
      });

      if (response.ok) {
        const analysisResult = await response.json();
        setAnalysis(analysisResult);
        
        // Record the learning interaction
        await recordLearningInteraction('code_analysis', language);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing code:', error);
      alert('Error analyzing code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recordLearningInteraction = async (interactionType, topic) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/learning-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          interaction_type: interactionType,
          topic: topic,
          code: code,
          complexity: userLevel
        }),
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="text-red-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'error':
        return 'border-red-400 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">AI Code Analysis & Learning</h1>
        <p className="text-blue-100">
          Get personalized feedback, detect issues, and learn from your code
        </p>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center space-x-4">
            <TrendingUp className="text-green-500" size={24} />
            <div>
              <h3 className="font-semibold">Your Learning Progress</h3>
              <p className="text-sm text-gray-600">
                Skill Level: <span className="font-medium capitalize">{userProfile.skill_level}</span>
                {' • '}
                Topics: {Object.keys(userProfile.knowledge_areas).length || 'None yet'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input Section */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="mr-2" size={20} />
              Code to Analyze
            </h2>
            
            {/* Settings */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Level</label>
                <select
                  value={userLevel}
                  onChange={(e) => setUserLevel(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here for analysis..."
              className="w-full h-64 p-3 border rounded-md font-mono text-sm"
              style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
            />

            <button
              onClick={analyzeCode}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="mr-2" size={16} />
                  Analyze Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          {analysis && (
            <>
              {/* Overall Score */}
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Overall Code Quality</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          analysis.overall_score >= 80 ? 'bg-green-500' :
                          analysis.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analysis.overall_score}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-bold text-lg">{Math.round(analysis.overall_score)}/100</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-600">Security Score:</span>
                    <span className="font-medium ml-2">{Math.round(analysis.security_score)}/100</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Performance Score:</span>
                    <span className="font-medium ml-2">{Math.round(analysis.performance_score)}/100</span>
                  </div>
                </div>
              </div>

              {/* Issues Found */}
              {analysis.issues && analysis.issues.length > 0 && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Issues Found</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analysis.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{issue.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Line {issue.line_number} • {issue.issue_type}
                            </p>
                            <div className="mt-2 text-sm">
                              <p className="text-blue-700">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </p>
                              <p className="text-green-700 mt-1">
                                <strong>Why:</strong> {issue.educational_note}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educational Insights */}
              {analysis.educational_insights && analysis.educational_insights.length > 0 && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <BookOpen className="mr-2" size={20} />
                    Learning Insights
                  </h3>
                  <ul className="space-y-2">
                    {analysis.educational_insights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="text-green-500 mt-0.5" size={16} />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Roadmap */}
              {analysis.improvement_roadmap && analysis.improvement_roadmap.length > 0 && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Target className="mr-2" size={20} />
                    Your Learning Path
                  </h3>
                  <ol className="space-y-2">
                    {analysis.improvement_roadmap.map((step, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Personalized Feedback */}
              {analysis.personalized_feedback && Object.keys(analysis.personalized_feedback).length > 0 && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Personalized for You</h3>
                  {analysis.personalized_feedback.learning_resources && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Recommended Resources:</h4>
                      <ul className="text-sm space-y-1">
                        {analysis.personalized_feedback.learning_resources.map((resource, index) => (
                          <li key={index} className="text-blue-600">• {resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.personalized_feedback.next_challenges && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Next Challenges:</h4>
                      <ul className="text-sm space-y-1">
                        {analysis.personalized_feedback.next_challenges.map((challenge, index) => (
                          <li key={index} className="text-green-600">• {challenge}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!analysis && !loading && (
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">Enter your code and click "Analyze Code" to get personalized feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeAnalysisPage;
