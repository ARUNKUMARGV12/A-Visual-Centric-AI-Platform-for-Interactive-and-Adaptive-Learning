import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import PersonalizedOnboarding from './PersonalizedOnboarding';

const EnhancedUserProfileDashboard = () => {
  const { user, userProfile, updateUserProfile, isGuest } = useAuth();
  const { learningInsights } = useUserProfile();
  
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [incompletePhases, setIncompletePhases] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPhase, setOnboardingPhase] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updateNotification, setUpdateNotification] = useState('');
  const [showCompleteProfilePrompt, setShowCompleteProfilePrompt] = useState(true);

  // Calculate profile completion percentage and track incomplete sections
  useEffect(() => {
    if (userProfile) {
      calculateProfileCompletion();
    }
  }, [userProfile]);

  const calculateProfileCompletion = () => {
    if (!userProfile) return;

    // Define required fields for each phase
    const requiredFields = {
      basic: {
        fields: ['name', 'age', 'education_level', 'preferred_language'],
        weight: 25
      },
      learning: {
        fields: ['learning_style', 'preferred_mode', 'daily_time'],
        weight: 25
      },
      interests: {
        fields: ['topics_of_interest', 'current_goal'],
        weight: 25
      },
      skills: {
        fields: ['experience_level', 'confidence_levels'],
        weight: 25
      }
    };

    let totalWeight = 0;
    let completedWeight = 0;
    const incomplete = [];

    Object.entries(requiredFields).forEach(([phase, config]) => {
      totalWeight += config.weight;
      let phaseComplete = true;
      let phaseCompletedFields = 0;
      
      config.fields.forEach(field => {
        const value = userProfile[field];
        
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
          phaseComplete = false;
        } else {
          phaseCompletedFields++;
        }
      });
      
      // Calculate partial completion for this phase
      const phaseCompletionRatio = phaseCompletedFields / config.fields.length;
      completedWeight += config.weight * phaseCompletionRatio;
      
      if (!phaseComplete) {
        incomplete.push(phase);
      }
    });

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    setProfileCompletion(percentage);
    setIncompletePhases(incomplete);
    
    // Hide complete profile prompt if 100% complete
    if (percentage >= 100) {
      setShowCompleteProfilePrompt(false);
    }
  };

  const getPhaseInfo = (phase) => {
    const phaseMap = {
      basic: { title: 'Basic Information', step: 1, icon: '👤' },
      learning: { title: 'Learning Preferences', step: 2, icon: '🧠' },
      interests: { title: 'Interests & Goals', step: 3, icon: '🎯' },
      skills: { title: 'Skill Assessment', step: 4, icon: '📊' }
    };
    return phaseMap[phase] || { title: phase, step: 1, icon: '📝' };
  };

  const handleCompleteProfile = () => {
    if (incompletePhases.length > 0) {
      const firstIncomplete = incompletePhases[0];
      setOnboardingPhase(firstIncomplete);
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingPhase(null);
    setUpdateNotification('Profile updated successfully! 🎉');
    setTimeout(() => setUpdateNotification(''), 3000);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    
    // Pre-populate edit form with current data
    const sectionData = {};
    
    switch(section) {
      case 'basic':
        sectionData.name = userProfile.name || '';
        sectionData.age = userProfile.age || '';
        sectionData.education_level = userProfile.education_level || '';
        sectionData.occupation = userProfile.occupation || '';
        sectionData.preferred_language = userProfile.preferred_language || 'English';
        break;
      case 'learning':
        sectionData.learning_style = userProfile.learning_style || [];
        sectionData.preferred_mode = userProfile.preferred_mode || 'both';
        sectionData.daily_time = userProfile.daily_time || '30min';
        break;
      case 'interests':
        sectionData.topics_of_interest = userProfile.topics_of_interest || [];
        sectionData.current_goal = userProfile.current_goal || '';
        sectionData.learning_goals = userProfile.learning_goals || [];
        break;
      case 'skills':
        sectionData.experience_level = userProfile.experience_level || 'beginner';
        sectionData.confidence_levels = userProfile.confidence_levels || {};
        sectionData.current_skills = userProfile.current_skills || [];
        break;
      default:
        break;
    }
    
    setEditFormData(sectionData);
  };

  const handleSaveEdit = async () => {
    try {
      // Clean and validate the form data before sending
      const cleanedData = {};
      
      Object.entries(editFormData).forEach(([key, value]) => {
        // Handle different data types properly
        if (key === 'age') {
          // Convert age to integer, or null if empty
          cleanedData[key] = value && value.toString().trim() !== '' ? parseInt(value, 10) : null;
        } else if (key === 'confidence_levels') {
          // Ensure confidence_levels is an object
          cleanedData[key] = value && typeof value === 'object' ? value : {};
        } else if (Array.isArray(value)) {
          // Ensure arrays are properly formatted
          cleanedData[key] = value;
        } else if (typeof value === 'string') {
          // Trim strings and convert empty strings to null for optional fields
          const trimmedValue = value.trim();
          cleanedData[key] = trimmedValue === '' ? null : trimmedValue;
        } else {
          cleanedData[key] = value;
        }
      });
      
      console.log('Sending cleaned data:', cleanedData);
      
      // Update the user profile with cleaned data
      await updateUserProfile(cleanedData);
      
      setEditingSection(null);
      setEditFormData({});
      
      // Show success notification
      setUpdateNotification('Profile updated successfully! ✅');
      setTimeout(() => setUpdateNotification(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateNotification('Failed to update profile. Please try again. ❌');
      setTimeout(() => setUpdateNotification(''), 3000);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const renderProgressIndicator = () => (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-6">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Your Learning Profile</h3>
            <p className="text-gray-300 text-sm mb-3">
              Complete your profile to get personalized learning recommendations
            </p>
            
            <div className="w-64 bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400 font-medium">{profileCompletion}% Complete</span>
              {incompletePhases.length > 0 && (
                <span className="text-gray-400">
                  {4 - incompletePhases.length}/4 sections done
                </span>
              )}
            </div>
            
            {incompletePhases.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-400 text-xs mb-2">Incomplete sections:</p>
                <div className="flex flex-wrap gap-2">
                  {incompletePhases.map(phase => {
                    const phaseInfo = getPhaseInfo(phase);
                    return (
                      <span 
                        key={phase}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-900/30 text-yellow-300 border border-yellow-600"
                      >
                        {phaseInfo.icon} {phaseInfo.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {profileCompletion < 100 && (
          <button 
            onClick={handleCompleteProfile}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Complete Profile
          </button>
        )}
      </div>
    </div>
  );

  const renderEditableSection = (section, title, icon, content, editContent) => (
    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2 text-xl">{icon}</span>
          {title}
        </h3>
        <button
          onClick={() => editingSection === section ? setEditingSection(null) : handleEditSection(section)}
          className="text-blue-400 hover:text-blue-300 transition-colors px-3 py-1 rounded bg-blue-900/20 hover:bg-blue-900/40"
        >
          {editingSection === section ? '❌ Cancel' : '✏️ Edit'}
        </button>
      </div>
      
      {editingSection === section ? (
        <div className="space-y-4">
          {editContent}
          <div className="flex space-x-2 pt-4 border-t border-gray-600">
            <button
              onClick={handleSaveEdit}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              💾 Save Changes
            </button>
            <button
              onClick={() => setEditingSection(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        content
      )}
    </div>
  );

  if (!userProfile) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-4">Loading Your Profile...</h2>
          <p className="text-gray-400">Setting up your personalized learning experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Update Notification */}
      {updateNotification && (
        <div className={`p-4 rounded-lg border ${
          updateNotification.includes('success') || updateNotification.includes('✅') || updateNotification.includes('🎉')
            ? 'bg-green-900/30 border-green-600 text-green-300' 
            : 'bg-red-900/30 border-red-600 text-red-300'
        } transition-all duration-300`}>
          {updateNotification}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-gray-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Welcome, {userProfile.name || user?.email?.split('@')[0] || 'Friend'}!
            </h1>
            <p className="text-gray-300">
              Your personalized learning dashboard
            </p>
            {isGuest && (
              <p className="text-yellow-400 text-sm mt-2">
                🎭 Guest Mode - Consider creating an account to save your progress
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Member since</div>
            <div className="text-white font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Section */}
      {!isGuest && showCompleteProfilePrompt && profileCompletion < 100 && renderProgressIndicator()}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
          <div className="text-2xl font-bold text-blue-400">{userProfile.total_interactions || 0}</div>
          <div className="text-blue-300 text-sm">Chat Sessions</div>
        </div>
        <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
          <div className="text-2xl font-bold text-green-400">{userProfile.learning_streak || 0}</div>
          <div className="text-green-300 text-sm">Day Streak</div>
        </div>
        <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-600">
          <div className="text-2xl font-bold text-purple-400">
            {Array.isArray(userProfile.topics_of_interest) ? userProfile.topics_of_interest.length : 0}
          </div>
          <div className="text-purple-300 text-sm">Topics</div>
        </div>
        <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-600">
          <div className="text-2xl font-bold text-orange-400">{profileCompletion}%</div>
          <div className="text-orange-300 text-sm">Complete</div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        {renderEditableSection(
          'basic',
          'Basic Information',
          '👤',
          // Content when not editing
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white font-medium">{userProfile.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user?.email || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age:</span>
              <span className="text-white">{userProfile.age || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Education:</span>
              <span className="text-white">{userProfile.education_level || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Language:</span>
              <span className="text-white">{userProfile.preferred_language || 'English'}</span>
            </div>
          </div>,
          // Edit content
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={editFormData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
              <input
                type="number"
                value={editFormData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Your age"
                min="13"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Education Level</label>
              <select
                value={editFormData.education_level || ''}
                onChange={(e) => handleInputChange('education_level', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select education level</option>
                <option value="high-school">High School</option>
                <option value="undergraduate-1">Undergraduate Year 1</option>
                <option value="undergraduate-2">Undergraduate Year 2</option>
                <option value="undergraduate-3">Undergraduate Year 3</option>
                <option value="undergraduate-4">Undergraduate Year 4</option>
                <option value="graduate">Graduate/Masters</option>
                <option value="phd">PhD</option>
                <option value="professional">Working Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Language</label>
              <select
                value={editFormData.preferred_language || 'English'}
                onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
        )}

        {/* Learning Preferences */}
        {renderEditableSection(
          'learning',
          'Learning Preferences',
          '🧠',
          // Content when not editing
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Learning Style:</span>
              <span className="text-white">
                {Array.isArray(userProfile.learning_style) 
                  ? userProfile.learning_style.join(', ') || 'Not set'
                  : userProfile.learning_style || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Preferred Mode:</span>
              <span className="text-white">{userProfile.preferred_mode || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Time:</span>
              <span className="text-white">{userProfile.daily_time || 'Not set'}</span>
            </div>
          </div>,
          // Edit content
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Learning Style (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {['visual', 'auditory', 'kinesthetic', 'reading'].map(style => (
                  <label key={style} className="flex items-center bg-gray-600 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={editFormData.learning_style?.includes(style) || false}
                      onChange={() => handleArrayToggle('learning_style', style)}
                      className="mr-2"
                    />
                    <span className="text-white capitalize">{style}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Mode</label>
              <select
                value={editFormData.preferred_mode || 'both'}
                onChange={(e) => handleInputChange('preferred_mode', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="text">Text Only</option>
                <option value="voice">Voice Only</option>
                <option value="both">Both Text & Voice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Daily Learning Time</label>
              <select
                value={editFormData.daily_time || '30min'}
                onChange={(e) => handleInputChange('daily_time', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
                <option value="1hr">1 hour</option>
                <option value="2hr">2 hours</option>
                <option value="3hr+">3+ hours</option>
              </select>
            </div>
          </div>
        )}

        {/* Interests & Goals */}
        {renderEditableSection(
          'interests',
          'Interests & Goals',
          '🎯',
          // Content when not editing
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Goal:</span>
              <span className="text-white">{userProfile.current_goal || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Topics:</span>
              <span className="text-white">
                {Array.isArray(userProfile.topics_of_interest) 
                  ? userProfile.topics_of_interest.join(', ') || 'Not set'
                  : userProfile.topics_of_interest || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Learning Goals:</span>
              <span className="text-white">
                {Array.isArray(userProfile.learning_goals) 
                  ? `${userProfile.learning_goals.length} goals set`
                  : 'Not set'}
              </span>
            </div>
          </div>,
          // Edit content
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Current Learning Goal</label>
              <input
                type="text"
                value={editFormData.current_goal || ''}
                onChange={(e) => handleInputChange('current_goal', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Master algorithms for placement interviews"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Topics of Interest</label>
              <div className="grid grid-cols-2 gap-2">
                {['DSA', 'Web Dev', 'Mobile', 'AI/ML', 'OS', 'Networks', 'DBMS', 'OOP'].map(topic => (
                  <label key={topic} className="flex items-center bg-gray-600 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={editFormData.topics_of_interest?.includes(topic.toLowerCase()) || false}
                      onChange={() => handleArrayToggle('topics_of_interest', topic.toLowerCase())}
                      className="mr-2"
                    />
                    <span className="text-white text-sm">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skill Assessment */}
        {renderEditableSection(
          'skills',
          'Skill Assessment',
          '📊',
          // Content when not editing
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Experience Level:</span>
              <span className="text-white capitalize">{userProfile.experience_level || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Skills:</span>
              <span className="text-white">
                {Array.isArray(userProfile.current_skills) 
                  ? `${userProfile.current_skills.length} skills listed`
                  : 'Not set'}
              </span>
            </div>
            {userProfile.confidence_levels && Object.keys(userProfile.confidence_levels).length > 0 && (
              <div className="mt-3">
                <div className="text-gray-400 text-sm mb-2">Subject Confidence:</div>
                {Object.entries(userProfile.confidence_levels).slice(0, 3).map(([subject, level]) => (
                  <div key={subject} className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{subject}:</span>
                    <span className={`capitalize ${
                      level === 'high' ? 'text-green-400' : 
                      level === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>,
          // Edit content
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Experience Level</label>
              <select
                value={editFormData.experience_level || 'beginner'}
                onChange={(e) => handleInputChange('experience_level', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject Confidence</label>
              {['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Computer Networks'].map(subject => (
                <div key={subject} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{subject}</span>
                    <span className="text-gray-300 capitalize">
                      {editFormData.confidence_levels?.[subject] || 'medium'}
                    </span>
                  </div>
                  <select
                    value={editFormData.confidence_levels?.[subject] || 'medium'}
                    onChange={(e) => handleInputChange('confidence_levels', {
                      ...editFormData.confidence_levels,
                      [subject]: e.target.value
                    })}
                    className="w-full bg-gray-600 border border-gray-500 rounded py-1 px-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Learning Insights */}
      {learningInsights?.primaryLearningStyle && (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
            🧠 AI Learning Insights
          </h3>
          <p className="text-purple-200">
            Based on your activity, you appear to be a <strong>{learningInsights.primaryLearningStyle}</strong> learner.
            {learningInsights.strengths && learningInsights.strengths.length > 0 && (
              <span> You show strength in: {learningInsights.strengths.join(', ')}.</span>
            )}
          </p>
          {learningInsights.recommendations && (
            <div className="mt-3">
              <h4 className="text-purple-300 font-medium mb-2">Recommendations:</h4>
              <ul className="text-purple-200 text-sm space-y-1">
                {learningInsights.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Personalized Onboarding Modal */}
      {showOnboarding && (
        <PersonalizedOnboarding
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
          startingPhase={onboardingPhase}
          isEditMode={true}
          existingData={userProfile}
        />
      )}
    </div>
  );
};

export default EnhancedUserProfileDashboard;
