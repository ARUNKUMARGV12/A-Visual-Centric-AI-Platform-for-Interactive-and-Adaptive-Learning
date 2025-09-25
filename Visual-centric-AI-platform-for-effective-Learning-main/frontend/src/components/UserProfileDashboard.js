import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import SmartRecommendations from './SmartRecommendations';
import PersonalizedOnboarding from './PersonalizedOnboarding';
import { useNavigate } from 'react-router-dom';

const UserProfileDashboard = () => {
  const { user, userProfile, signOut, isGuest, updateUserProfile } = useAuth();
  const { addLearningGoal, updateLearningPreferences, learningInsights } = useUserProfile();
  
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [incompletePhases, setIncompletePhases] = useState([]);
  const [updateNotification, setUpdateNotification] = useState('');

  // Calculate profile completion percentage
  useEffect(() => {
    if (userProfile) {
      calculateProfileCompletion();
    }
  }, [userProfile]);

  const calculateProfileCompletion = () => {
    if (!userProfile) return;

    const requiredFields = {
      basicInfo: ['name', 'age', 'education_level', 'preferred_language'],
      learningPreferences: ['learning_style', 'preferred_mode', 'daily_time'],
      interests: ['topics_of_interest', 'current_goal'],
      skills: ['experience_level', 'confidence_levels'],
      goals: ['primary_reason', 'learning_goals']
    };

    let totalFields = 0;
    let completedFields = 0;
    const incomplete = [];

    Object.entries(requiredFields).forEach(([phase, fields]) => {
      let phaseComplete = true;
      
      fields.forEach(field => {
        totalFields++;
        const value = userProfile[field];
        
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)) {
          phaseComplete = false;
        } else {
          completedFields++;
        }
      });
      
      if (!phaseComplete) {
        incomplete.push(phase);
      }
    });

    const percentage = Math.round((completedFields / totalFields) * 100);
    setProfileCompletion(percentage);
    setIncompletePhases(incomplete);
  };

  const getPhaseInfo = (phase) => {
    const phaseMap = {
      basicInfo: { title: 'Basic Information', step: 1, icon: '👤' },
      learningPreferences: { title: 'Learning Preferences', step: 2, icon: '🧠' },
      interests: { title: 'Interests & Goals', step: 3, icon: '🎯' },
      skills: { title: 'Skill Assessment', step: 4, icon: '📊' },
      goals: { title: 'Learning Goals', step: 5, icon: '🚀' }
    };
    return phaseMap[phase] || { title: phase, step: 1, icon: '📝' };
  };

  const handleCompleteProfile = () => {
    if (incompletePhases.length > 0) {
      const firstIncomplete = incompletePhases[0];
      const phaseInfo = getPhaseInfo(firstIncomplete);
      
      // Navigate to PersonalizedOnboarding with specific step
      // This would need to be implemented with routing
      console.log(`Navigate to onboarding step ${phaseInfo.step} for ${phaseInfo.title}`);
      
      // For now, we'll show an alert - in real implementation, use router
      alert(`Please complete: ${phaseInfo.title} (Step ${phaseInfo.step})`);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    
    // Pre-populate edit form with current data
    switch(section) {
      case 'basicInfo':
        setEditFormData({
          name: userProfile.name || '',
          age: userProfile.age || '',
          education_level: userProfile.education_level || '',
          occupation: userProfile.occupation || '',
          preferred_language: userProfile.preferred_language || 'English'
        });
        break;
      case 'learningPreferences':
        setEditFormData({
          learning_style: userProfile.learning_style || [],
          preferred_mode: userProfile.preferred_mode || 'both',
          daily_time: userProfile.daily_time || '30min',
          text_size: userProfile.text_size || 'medium',
          visual_mode: userProfile.visual_mode || 'dark',
          enable_sound: userProfile.enable_sound || true
        });
        break;
      case 'interests':
        setEditFormData({
          topics_of_interest: userProfile.topics_of_interest || [],
          current_goal: userProfile.current_goal || '',
          interests: userProfile.interests || []
        });
        break;
      case 'skills':
        setEditFormData({
          experience_level: userProfile.experience_level || 'beginner',
          confidence_levels: userProfile.confidence_levels || {},
          current_skills: userProfile.current_skills || [],
          previous_platforms: userProfile.previous_platforms || []
        });
        break;
      default:
        setEditFormData({});
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Update the user profile with new data
      await updateUserProfile(editFormData);
      
      setEditingSection(null);
      setEditFormData({});
      
      // Show success notification
      setUpdateNotification('Profile updated successfully!');
      setTimeout(() => setUpdateNotification(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateNotification('Failed to update profile. Please try again.');
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

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (newGoal.trim()) {
      await addLearningGoal(newGoal.trim());
      setNewGoal('');
      setShowGoalForm(false);
    }
  };

  const handlePreferenceUpdate = async (key, value) => {
    await updateLearningPreferences({ [key]: value });
  };

  if (!userProfile) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Loading Profile...</h2>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
          </div>
          <div className="mt-6 text-gray-400 text-sm">
            <p>If this takes too long, try refreshing the page</p>
            <p className="mt-2">Debug info:</p>
            <p>User: {user?.email || 'Not found'}</p>
            <p>User ID: {user?.id ? 'Found' : 'Not found'}</p>
            <p>Guest Mode: {isGuest ? 'Yes' : 'No'}</p>
            <p>Profile Data: {userProfile ? 'Found' : 'Not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Update Notification */}
      {updateNotification && (
        <div className={`p-4 rounded-lg ${updateNotification.includes('success') ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'}`}>
          <p className={updateNotification.includes('success') ? 'text-green-300' : 'text-red-300'}>
            {updateNotification}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            👋 Welcome, {userProfile.name || user?.email || 'Friend'}!
          </h2>
          {isGuest && (
            <p className="text-yellow-400 text-sm">
              🎯 You're using guest mode - consider creating an account to save your progress!
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Preferences
          </button>
          {!isGuest && (
            <button
              onClick={signOut}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Profile Completion Section */}
      {!isGuest && profileCompletion < 100 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Complete Your Profile</h3>
                <p className="text-gray-300 text-sm">
                  Get better personalized recommendations by completing your learning profile!
                </p>
                <div className="mt-2">
                  <div className="w-48 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-400 text-xs mt-1 block">{profileCompletion}% Complete</span>
                </div>
                {incompletePhases.length > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-xs">
                      Missing: {incompletePhases.map(phase => getPhaseInfo(phase).title).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleCompleteProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium whitespace-nowrap"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{userProfile.total_interactions || 0}</div>
          <div className="text-blue-300 text-sm">Interactions</div>
        </div>
        <div className="bg-green-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{userProfile.learning_streak || 0}</div>
          <div className="text-green-300 text-sm">Day Streak</div>
        </div>
        <div className="bg-purple-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">{learningInsights?.topicsExplored?.length || 0}</div>
          <div className="text-purple-300 text-sm">Topics Explored</div>
        </div>
        <div className="bg-orange-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-400">{profileCompletion}%</div>
          <div className="text-orange-300 text-sm">Profile Complete</div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              👤 Basic Information
            </h3>
            <button
              onClick={() => handleEditSection('basicInfo')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ✏️ Edit
            </button>
          </div>
          
          {editingSection === 'basicInfo' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                <input
                  type="number"
                  value={editFormData.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Education Level</label>
                <select
                  value={editFormData.education_level || ''}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Occupation</label>
                <input
                  type="text"
                  value={editFormData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                  placeholder="e.g., Student, Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Language</label>
                <select
                  value={editFormData.preferred_language || 'English'}
                  onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{userProfile.name || 'Not set'}</span>
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
                <span className="text-gray-400">Occupation:</span>
                <span className="text-white">{userProfile.occupation || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Language:</span>
                <span className="text-white">{userProfile.preferred_language || 'English'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Learning Preferences */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🧠 Learning Preferences
            </h3>
            <button
              onClick={() => handleEditSection('learningPreferences')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ✏️ Edit
            </button>
          </div>
          
          {editingSection === 'learningPreferences' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Learning Style</label>
                <div className="space-y-2">
                  {['visual', 'auditory', 'kinesthetic', 'reading'].map(style => (
                    <label key={style} className="flex items-center">
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
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
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
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                >
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hr">1 hour</option>
                  <option value="2hr">2 hours</option>
                  <option value="3hr+">3+ hours</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
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
              <div className="flex justify-between">
                <span className="text-gray-400">Text Size:</span>
                <span className="text-white">{userProfile.text_size || 'Medium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Theme:</span>
                <span className="text-white">{userProfile.visual_mode || 'Dark'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interests & Goals */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🎯 Interests & Goals
            </h3>
            <button
              onClick={() => handleEditSection('interests')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ✏️ Edit
            </button>
          </div>
          
          {editingSection === 'interests' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Goal</label>
                <input
                  type="text"
                  value={editFormData.current_goal || ''}
                  onChange={(e) => handleInputChange('current_goal', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                  placeholder="e.g., Get better at algorithms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Topics of Interest</label>
                <div className="grid grid-cols-2 gap-2">
                  {['dsa', 'web', 'mobile', 'aiml', 'os', 'networks', 'dbms', 'oop'].map(topic => (
                    <label key={topic} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.topics_of_interest?.includes(topic) || false}
                        onChange={() => handleArrayToggle('topics_of_interest', topic)}
                        className="mr-2"
                      />
                      <span className="text-white text-sm">{topic.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
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
            </div>
          )}
        </div>

        {/* Skill Confidence */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              📊 Skill Confidence
            </h3>
            <button
              onClick={() => handleEditSection('skills')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ✏️ Edit
            </button>
          </div>
          
          {editingSection === 'skills' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Experience Level</label>
                <select
                  value={editFormData.experience_level || 'beginner'}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject Confidence</label>
                {['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Computer Networks', 'Object Oriented Programming'].map(subject => (
                  <div key={subject} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{subject}:</span>
                      <span className="text-gray-300">{editFormData.confidence_levels?.[subject] || 'medium'}</span>
                    </div>
                    <select
                      value={editFormData.confidence_levels?.[subject] || 'medium'}
                      onChange={(e) => handleInputChange('confidence_levels', {...editFormData.confidence_levels, [subject]: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded py-1 px-2 text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Experience Level:</span>
                <span className="text-white capitalize">{userProfile.experience_level || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Skills:</span>
                <span className="text-white">
                  {Array.isArray(userProfile.current_skills) 
                    ? `${userProfile.current_skills.length} skills`
                    : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platforms Used:</span>
                <span className="text-white">
                  {Array.isArray(userProfile.previous_platforms) 
                    ? `${userProfile.previous_platforms.length} platforms`
                    : 'Not set'}
                </span>
              </div>
              {userProfile.confidence_levels && Object.keys(userProfile.confidence_levels).length > 0 && (
                <div className="mt-3">
                  <div className="text-gray-400 text-sm mb-2">Subject Confidence:</div>
                  {Object.entries(userProfile.confidence_levels).map(([subject, level]) => (
                    <div key={subject} className="flex justify-between text-sm">
                      <span className="text-gray-300">{subject}:</span>
                      <span className={`capitalize ${level === 'high' ? 'text-green-400' : level === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Learning Preferences Panel (Legacy - can be removed if desired) */}
      {showPreferences && (
        <div className="bg-gray-700 p-4 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-white">Quick Preference Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Learning Style
              </label>
              <select
                value={userProfile.learning_preferences?.style || 'unknown'}
                onChange={(e) => handlePreferenceUpdate('style', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
              >
                <option value="unknown">Unknown</option>
                <option value="visual">Visual (Charts, Diagrams)</option>
                <option value="auditory">Auditory (Voice, Sound)</option>
                <option value="textual">Textual (Reading, Writing)</option>
                <option value="kinesthetic">Kinesthetic (Hands-on)</option>
                <option value="gamified">Gamified (Interactive)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Learning Pace
              </label>
              <select
                value={userProfile.learning_preferences?.pace || 'normal'}
                onChange={(e) => handlePreferenceUpdate('pace', e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded py-2 px-3 text-white"
              >
                <option value="slow">Slow & Detailed</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast & Concise</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preferred Difficulty
            </label>
            <div className="flex space-x-4">
              {['easy', 'medium', 'hard'].map(level => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={userProfile.preferred_difficulty === level}
                    onChange={(e) => handlePreferenceUpdate('preferredDifficulty', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-white capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {learningInsights?.primaryLearningStyle && (
        <div className="bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">🧠 AI Learning Insights</h3>
          <p className="text-blue-200">
            Based on your activity, you appear to be a <strong>{learningInsights.primaryLearningStyle}</strong> learner.
            {learningInsights.strengths && learningInsights.strengths.length > 0 && (
              <span> You show strength in: {learningInsights.strengths.join(', ')}.</span>
            )}
          </p>
        </div>
      )}

      {/* Smart Recommendations */}
      <SmartRecommendations />
    </div>
  );
};

export default UserProfileDashboard;
