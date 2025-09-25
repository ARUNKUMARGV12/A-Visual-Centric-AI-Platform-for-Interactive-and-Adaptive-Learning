import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import PersonalizedOnboarding from './PersonalizedOnboarding';
import { BasicInfoDisplay, BasicInfoEditor, LearningPrefsDisplay, LearningPrefsEditor } from './ProfileComponents';
import { InterestsDisplay, InterestsEditor, SkillsDisplay, SkillsEditor } from './ProfileInterestsSkills';

const EnhancedUserProfile = () => {
  const { user, userProfile, updateUserProfile, isGuest } = useAuth();
  const { updateLearningPreferences } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState({});
  const [editData, setEditData] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [incompletePhase, setIncompletePhase] = useState(null);

  // Calculate profile completion percentage
  useEffect(() => {
    if (userProfile) {
      const completion = calculateProfileCompletion(userProfile);
      setProfileCompletion(completion);
      setIncompletePhase(findIncompletePhase(userProfile));
    }
  }, [userProfile]);

  const calculateProfileCompletion = (profile) => {
    const fields = [
      // Basic Info (25%)
      { key: 'name', weight: 5 },
      { key: 'email', weight: 5 },
      { key: 'age', weight: 5 },
      { key: 'preferred_language', weight: 5 },
      { key: 'education_level', weight: 5 },
      
      // Learning Preferences (25%)
      { key: 'learning_style', weight: 10 },
      { key: 'preferred_mode', weight: 5 },
      { key: 'daily_time', weight: 5 },
      { key: 'preferred_difficulty', weight: 5 },
      
      // Interests & Goals (25%)
      { key: 'current_goal', weight: 10 },
      { key: 'topics_of_interest', weight: 10 },
      { key: 'primary_reason', weight: 5 },
      
      // Skills & Experience (25%)
      { key: 'experience_level', weight: 10 },
      { key: 'confidence_levels', weight: 10 },
      { key: 'current_skills', weight: 5 }
    ];

    let completedWeight = 0;
    let totalWeight = 100;

    fields.forEach(field => {
      const value = profile[field.key];
      if (value && value !== '' && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          completedWeight += field.weight;
        } else if (typeof value === 'object' && Object.keys(value).length > 0) {
          completedWeight += field.weight;
        } else if (typeof value === 'string' && value.trim() !== '') {
          completedWeight += field.weight;
        } else if (typeof value === 'number') {
          completedWeight += field.weight;
        }
      }
    });

    return Math.round((completedWeight / totalWeight) * 100);
  };

  const findIncompletePhase = (profile) => {
    // Check which phase is incomplete
    const basicInfo = profile.name && profile.age && profile.education_level;
    const learningPrefs = profile.learning_style && profile.preferred_mode && profile.daily_time;
    const interests = profile.current_goal && profile.topics_of_interest && Array.isArray(profile.topics_of_interest) && profile.topics_of_interest.length > 0;
    const skills = profile.experience_level && profile.confidence_levels && Object.keys(profile.confidence_levels || {}).length > 0;

    if (!basicInfo) return 'basic';
    if (!learningPrefs) return 'learning';
    if (!interests) return 'interests';
    if (!skills) return 'skills';
    return null;
  };

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleStartEditing = (section, currentData = {}) => {
    setIsEditing({ ...isEditing, [section]: true });
    setEditData({ ...editData, [section]: currentData });
  };

  const handleCancelEdit = (section) => {
    setIsEditing({ ...isEditing, [section]: false });
    setEditData({ ...editData, [section]: {} });
  };

  const handleSaveSection = async (section) => {
    try {
      const updatedData = editData[section];
      await updateUserProfile(updatedData);
      setIsEditing({ ...isEditing, [section]: false });
      setEditData({ ...editData, [section]: {} });
      showNotification(`${section} updated successfully!`);
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile. Please try again.', 'error');
    }
  };

  const handleInputChange = (section, field, value) => {
    setEditData({
      ...editData,
      [section]: {
        ...editData[section],
        [field]: value
      }
    });
  };

  const handleCompleteProfile = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    showNotification('Profile completed successfully!');
  };

  if (showOnboarding) {
    return (
      <PersonalizedOnboarding 
        onComplete={handleOnboardingComplete}
        startingPhase={incompletePhase}
        isEditMode={true}
        existingData={userProfile}
      />
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Loading Profile...</h2>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-lg shadow-lg animate-fade-in ${
              notification.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Header with Progress */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 {userProfile.name || 'Your Profile'}
            </h1>
            <p className="text-gray-400">
              Manage your learning preferences and track your progress
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Profile Completion</span>
                <span className="text-sm font-medium text-blue-400">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Complete Profile Button */}
          {profileCompletion < 100 && (
            <button
              onClick={handleCompleteProfile}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Complete Profile
            </button>
          )}
        </div>

        {/* Completion Message */}
        {profileCompletion === 100 && (
          <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-green-400 font-medium">Profile Complete!</h3>
                <p className="text-green-300 text-sm">
                  Great job! Your profile is fully set up for personalized learning.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Basic Information Section */}
      <ProfileSection
        title="Basic Information"
        icon="👤"
        isEditing={isEditing.basic}
        onEdit={() => handleStartEditing('basic', {
          name: userProfile.name || '',
          email: userProfile.email || '',
          age: userProfile.age || '',
          preferred_language: userProfile.preferred_language || 'English',
          education_level: userProfile.education_level || '',
          occupation: userProfile.occupation || ''
        })}
        onSave={() => handleSaveSection('basic')}
        onCancel={() => handleCancelEdit('basic')}
      >
        {isEditing.basic ? (
          <BasicInfoEditor
            data={editData.basic || {}}
            onChange={(field, value) => handleInputChange('basic', field, value)}
          />
        ) : (
          <BasicInfoDisplay profile={userProfile} />
        )}
      </ProfileSection>

      {/* Learning Preferences Section */}
      <ProfileSection
        title="Learning Preferences"
        icon="🎯"
        isEditing={isEditing.learning}
        onEdit={() => handleStartEditing('learning', {
          learning_style: userProfile.learning_style || [],
          preferred_mode: userProfile.preferred_mode || 'both',
          daily_time: userProfile.daily_time || '30min',
          preferred_difficulty: userProfile.preferred_difficulty || 'medium',
          text_size: userProfile.text_size || 'medium',
          visual_mode: userProfile.visual_mode || 'dark',
          enable_sound: userProfile.enable_sound || true
        })}
        onSave={() => handleSaveSection('learning')}
        onCancel={() => handleCancelEdit('learning')}
      >
        {isEditing.learning ? (
          <LearningPrefsEditor
            data={editData.learning || {}}
            onChange={(field, value) => handleInputChange('learning', field, value)}
          />
        ) : (
          <LearningPrefsDisplay profile={userProfile} />
        )}
      </ProfileSection>

      {/* Interests & Goals Section */}
      <ProfileSection
        title="Interests & Goals"
        icon="🎯"
        isEditing={isEditing.interests}
        onEdit={() => handleStartEditing('interests', {
          current_goal: userProfile.current_goal || '',
          topics_of_interest: userProfile.topics_of_interest || [],
          primary_reason: userProfile.primary_reason || '',
          motivation: userProfile.motivation || '',
          target_deadline: userProfile.target_deadline || '',
          time_available: userProfile.time_available || '1-3'
        })}
        onSave={() => handleSaveSection('interests')}
        onCancel={() => handleCancelEdit('interests')}
      >
        {isEditing.interests ? (
          <InterestsEditor
            data={editData.interests || {}}
            onChange={(field, value) => handleInputChange('interests', field, value)}
          />
        ) : (
          <InterestsDisplay profile={userProfile} />
        )}
      </ProfileSection>

      {/* Skills & Confidence Section */}
      <ProfileSection
        title="Skills & Confidence"
        icon="🧠"
        isEditing={isEditing.skills}
        onEdit={() => handleStartEditing('skills', {
          experience_level: userProfile.experience_level || 'beginner',
          confidence_levels: userProfile.confidence_levels || {},
          current_skills: userProfile.current_skills || [],
          previous_platforms: userProfile.previous_platforms || []
        })}
        onSave={() => handleSaveSection('skills')}
        onCancel={() => handleCancelEdit('skills')}
      >
        {isEditing.skills ? (
          <SkillsEditor
            data={editData.skills || {}}
            onChange={(field, value) => handleInputChange('skills', field, value)}
          />
        ) : (
          <SkillsDisplay profile={userProfile} />
        )}
      </ProfileSection>
    </div>
  );
};

// Reusable Profile Section Component
const ProfileSection = ({ title, icon, children, isEditing, onEdit, onSave, onCancel }) => (
  <div className="bg-gray-800 rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>
    </div>
    {children}
  </div>
);

export default EnhancedUserProfile;
