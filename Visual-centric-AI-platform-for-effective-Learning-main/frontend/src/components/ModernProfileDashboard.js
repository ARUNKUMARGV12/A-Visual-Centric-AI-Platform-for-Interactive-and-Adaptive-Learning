import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import './ModernProfileDashboard.css';
import PersonalizedOnboarding from './PersonalizedOnboarding';

const ModernProfileDashboard = () => {
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
      console.log('User email:', user?.email);
      console.log('Current editing section:', editingSection);
      
      // Update the user profile with cleaned data
      await updateUserProfile(cleanedData);
      
      setEditingSection(null);
      setEditFormData({});
      
      // Show success notification
      setUpdateNotification('Profile updated successfully! ✅');
      setTimeout(() => setUpdateNotification(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.message);
      
      // Show more detailed error message
      let errorMessage = 'Failed to update profile. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      setUpdateNotification(errorMessage + ' ❌');
      setTimeout(() => setUpdateNotification(''), 5000);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!userProfile) {
    return (
      <div className="modern-profile-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Your Profile...</h2>
        <p>Setting up your personalized learning experience</p>
      </div>
    );
  }

  return (
    <div className="modern-profile-dashboard">
      {/* Notification */}
      {updateNotification && (
        <div className="notification">
          <div className="notification-content">
            <span className="notification-icon">✨</span>
            {updateNotification}
          </div>
        </div>
      )}

      {/* Enhanced Profile Header */}
      <div className="profile-header">
        <div className="header-background">
          <div className="gradient-overlay"></div>
          <div className="pattern-overlay"></div>
        </div>
        
        <div className="header-content">
          <div className="user-info">
            <div className="avatar-container">
              <div className="avatar">
                <div className="avatar-inner">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="avatar-ring"></div>
              </div>
              <div className="status-indicator"></div>
            </div>
            
            <div className="user-details">
              <h1 className="welcome-text">
                <span className="greeting">Welcome back,</span>
                <span className="name">{userProfile?.name || user?.email?.split('@')[0] || 'Student'}!</span>
              </h1>
              <div className="user-meta">
                <div className="meta-item">
                  <span className="meta-icon">📧</span>
                  <span className="meta-text">{user?.email}</span>
                </div>
                {userProfile?.education_level && (
                  <div className="meta-item">
                    <span className="meta-icon">🎓</span>
                    <span className="meta-text">{userProfile.education_level}</span>
                  </div>
                )}
                {userProfile?.preferred_language && (
                  <div className="meta-item">
                    <span className="meta-icon">🌐</span>
                    <span className="meta-text">{userProfile.preferred_language}</span>
                  </div>
                )}
              </div>
              {isGuest && (
                <div className="guest-badge">
                  <span className="guest-icon">👋</span>
                  <span>Guest Mode - Sign up to save your progress</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Profile Completion */}
          <div className="completion-section">
            <div className="completion-circle">
              <svg className="progress-ring" width="140" height="140">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <circle
                  className="progress-ring-bg"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="transparent"
                  r="60"
                  cx="70"
                  cy="70"
                />
                <circle
                  className="progress-ring-fill"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  r="60"
                  cx="70"
                  cy="70"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - profileCompletion / 100)}`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1s ease-in-out'
                  }}
                />
              </svg>
              <div className="circle-inner">
                <span className="percentage">{profileCompletion}%</span>
                <span className="label">Complete</span>
              </div>
            </div>
            
            {showCompleteProfilePrompt && incompletePhases.length > 0 && (
              <div className="completion-prompt">
                <div className="prompt-header">
                  <h3>🚀 Complete Your Profile</h3>
                  <p>Get personalized learning recommendations!</p>
                </div>
                
                <div className="incomplete-sections">
                  <div className="sections-header">Incomplete sections:</div>
                  <div className="phase-badges">
                    {incompletePhases.map(phase => {
                      const phaseInfo = getPhaseInfo(phase);
                      return (
                        <div key={phase} className="phase-badge">
                          <span className="badge-icon">{phaseInfo.icon}</span>
                          <span className="badge-text">{phaseInfo.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  className="complete-profile-btn"
                  onClick={handleCompleteProfile}
                >
                  <div className="btn-content">
                    <span className="btn-text">Complete Profile</span>
                    <div className="btn-progress">
                      <span className="progress-text">{4 - incompletePhases.length}/4 sections done</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${((4 - incompletePhases.length) / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{userProfile.total_interactions || 0}</div>
          <div className="stat-label">Chat Sessions</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{userProfile.learning_streak || 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📚</div>
          <div className="stat-value">
            {Array.isArray(userProfile.topics_of_interest) ? userProfile.topics_of_interest.length : 0}
          </div>
          <div className="stat-label">Topics</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{profileCompletion}%</div>
          <div className="stat-label">Complete</div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="profile-sections">
        {/* Basic Information */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">👤</span>
              <h3>Basic Information</h3>
            </div>
            <button
              onClick={() => editingSection === 'basic' ? setEditingSection(null) : handleEditSection('basic')}
              className="edit-btn"
            >
              {editingSection === 'basic' ? '✖️ Cancel' : '✏️ Edit'}
            </button>
          </div>
          
          {editingSection === 'basic' ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={editFormData.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Your age"
                  min="13"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Education Level</label>
                <select
                  value={editFormData.education_level || ''}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                >
                  <option value="">Select education level</option>
                  <option value="high-school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select
                  value={editFormData.preferred_language || 'English'}
                  onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="save-btn">
                  💾 Save Changes
                </button>
                <button onClick={() => setEditingSection(null)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{userProfile.name || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age:</span>
                  <span className="info-value">{userProfile.age || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Education:</span>
                  <span className="info-value">{userProfile.education_level || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Language:</span>
                  <span className="info-value">{userProfile.preferred_language || 'English'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Learning Preferences */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">🧠</span>
              <h3>Learning Preferences</h3>
            </div>
            <button
              onClick={() => editingSection === 'learning' ? setEditingSection(null) : handleEditSection('learning')}
              className="edit-btn"
            >
              {editingSection === 'learning' ? '✖️ Cancel' : '✏️ Edit'}
            </button>
          </div>
          
          {editingSection === 'learning' ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Learning Style</label>
                <select
                  multiple
                  value={editFormData.learning_style || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleInputChange('learning_style', values);
                  }}
                >
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="kinesthetic">Kinesthetic</option>
                  <option value="reading">Reading/Writing</option>
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
              <div className="form-group">
                <label>Preferred Mode</label>
                <select
                  value={editFormData.preferred_mode || 'both'}
                  onChange={(e) => handleInputChange('preferred_mode', e.target.value)}
                >
                  <option value="chat">Chat Only</option>
                  <option value="voice">Voice Only</option>
                  <option value="both">Both Chat & Voice</option>
                </select>
              </div>
              <div className="form-group">
                <label>Daily Time Commitment</label>
                <select
                  value={editFormData.daily_time || '30min'}
                  onChange={(e) => handleInputChange('daily_time', e.target.value)}
                >
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hr">1 hour</option>
                  <option value="2hr">2+ hours</option>
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="save-btn">
                  💾 Save Changes
                </button>
                <button onClick={() => setEditingSection(null)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Learning Style:</span>
                  <span className="info-value">
                    {Array.isArray(userProfile.learning_style) && userProfile.learning_style.length > 0 
                      ? userProfile.learning_style.join(', ') 
                      : 'Not set'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Mode:</span>
                  <span className="info-value">{userProfile.preferred_mode || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Daily Time:</span>
                  <span className="info-value">{userProfile.daily_time || 'Not set'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interests & Goals */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">🎯</span>
              <h3>Interests & Goals</h3>
            </div>
            <button
              onClick={() => editingSection === 'interests' ? setEditingSection(null) : handleEditSection('interests')}
              className="edit-btn"
            >
              {editingSection === 'interests' ? '✖️ Cancel' : '✏️ Edit'}
            </button>
          </div>
          
          {editingSection === 'interests' ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Current Goal</label>
                <input
                  type="text"
                  value={editFormData.current_goal || ''}
                  onChange={(e) => handleInputChange('current_goal', e.target.value)}
                  placeholder="What's your main learning goal?"
                />
              </div>
              <div className="form-group">
                <label>Topics of Interest</label>
                <input
                  type="text"
                  value={Array.isArray(editFormData.topics_of_interest) ? editFormData.topics_of_interest.join(', ') : ''}
                  onChange={(e) => {
                    const topics = e.target.value.split(',').map(topic => topic.trim()).filter(Boolean);
                    handleInputChange('topics_of_interest', topics);
                  }}
                  placeholder="React, Python, Machine Learning (comma-separated)"
                />
                <small>Separate topics with commas</small>
              </div>
              <div className="form-group">
                <label>Learning Goals</label>
                <textarea
                  value={Array.isArray(editFormData.learning_goals) ? editFormData.learning_goals.join('\n') : ''}
                  onChange={(e) => {
                    const goals = e.target.value.split('\n').map(goal => goal.trim()).filter(Boolean);
                    handleInputChange('learning_goals', goals);
                  }}
                  placeholder="Write each goal on a new line"
                  rows={4}
                />
                <small>Write each goal on a new line</small>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="save-btn">
                  💾 Save Changes
                </button>
                <button onClick={() => setEditingSection(null)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Current Goal:</span>
                  <span className="info-value">{userProfile.current_goal || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Topics:</span>
                  <span className="info-value">
                    {Array.isArray(userProfile.topics_of_interest) && userProfile.topics_of_interest.length > 0 
                      ? userProfile.topics_of_interest.join(', ') 
                      : 'Not set'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Learning Goals:</span>
                  <span className="info-value">
                    {Array.isArray(userProfile.learning_goals) && userProfile.learning_goals.length > 0 
                      ? userProfile.learning_goals.join(', ') 
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skill Assessment */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">📊</span>
              <h3>Skill Assessment</h3>
            </div>
            <button
              onClick={() => editingSection === 'skills' ? setEditingSection(null) : handleEditSection('skills')}
              className="edit-btn"
            >
              {editingSection === 'skills' ? '✖️ Cancel' : '✏️ Edit'}
            </button>
          </div>
          
          {editingSection === 'skills' ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Experience Level</label>
                <select
                  value={editFormData.experience_level || 'beginner'}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Skills</label>
                <input
                  type="text"
                  value={Array.isArray(editFormData.current_skills) ? editFormData.current_skills.join(', ') : ''}
                  onChange={(e) => {
                    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
                    handleInputChange('current_skills', skills);
                  }}
                  placeholder="JavaScript, Python, React (comma-separated)"
                />
                <small>Separate skills with commas</small>
              </div>
              <div className="form-group">
                <label>Confidence Levels</label>
                <div className="confidence-inputs">
                  {['Programming', 'Problem Solving', 'Communication', 'Learning'].map(skill => (
                    <div key={skill} className="confidence-item">
                      <label className="confidence-label">{skill}</label>
                      <select
                        value={(editFormData.confidence_levels && editFormData.confidence_levels[skill]) || 'medium'}
                        onChange={(e) => {
                          const newConfidence = {
                            ...editFormData.confidence_levels,
                            [skill]: e.target.value
                          };
                          handleInputChange('confidence_levels', newConfidence);
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="save-btn">
                  💾 Save Changes
                </button>
                <button onClick={() => setEditingSection(null)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Experience Level:</span>
                  <span className="info-value">{userProfile.experience_level || 'Not Set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Skills:</span>
                  <span className="info-value">
                    {Array.isArray(userProfile.current_skills) && userProfile.current_skills.length > 0 
                      ? userProfile.current_skills.join(', ') 
                      : 'Not set'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Confidence Levels:</span>
                  <span className="info-value">
                    {userProfile.confidence_levels && Object.keys(userProfile.confidence_levels).length > 0
                      ? Object.entries(userProfile.confidence_levels).map(([skill, level]) => `${skill}: ${level}`).join(', ')
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learning Analytics Insights */}
      {learningInsights && (
        <div className="analytics-section">
          <h3>📈 Learning Analytics</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>🎯 Personalized Recommendations</h4>
              <p>Based on your learning patterns, we recommend focusing on interactive coding exercises.</p>
            </div>
            <div className="insight-card">
              <h4>⚡ Learning Velocity</h4>
              <p>You're making great progress! Your learning velocity has increased by 15% this week.</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <PersonalizedOnboarding
              isOpen={showOnboarding}
              onClose={() => setShowOnboarding(false)}
              onComplete={handleOnboardingComplete}
              startingPhase={onboardingPhase}
              editMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernProfileDashboard;
