import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';

const PersonalizedOnboarding = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  onSkip, 
  pendingSignupData,
  startingPhase = null,
  isEditMode = false,
  existingData = null
}) => {
  const { user, updateProfile, signUp } = useAuth();
  const { completeOnboarding } = useUserProfile();
  
  // Determine starting step based on phase
  const getStartingStep = () => {
    if (startingPhase) {
      switch (startingPhase) {
        case 'basic': return 1;
        case 'learning': return 2;
        case 'interests': return 3;
        case 'skills': return 4;
        default: return 1;
      }
    }
    return 1;
  };

  // Get phase name from step number
  const getPhaseFromStep = (step) => {
    switch (step) {
      case 1: return 'basic';
      case 2: return 'learning';
      case 3: return 'interests';
      case 4: return 'skills';
      default: return 'basic';
    }
  };

  const [currentStep, setCurrentStep] = useState(getStartingStep());
  const [formData, setFormData] = useState({
    // Basic Info - populate from existing data if in edit mode
    name: existingData?.name || pendingSignupData?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    age: existingData?.age || '',
    educationLevel: existingData?.education_level || '',
    occupation: existingData?.occupation || '',
    preferredLanguage: existingData?.preferred_language || 'English',
    
    // Learning Preferences
    learningStyle: existingData?.learning_style || [],
    preferredMode: existingData?.preferred_mode || 'both',
    topicsOfInterest: existingData?.topics_of_interest || [],
    currentGoal: existingData?.current_goal || '',
    dailyTime: existingData?.daily_time || '30min',
    
    // Prior Knowledge
    experienceLevel: existingData?.experience_level || 'beginner',
    confidence: existingData?.confidence_levels || {
      'Data Structures & Algorithms': 'medium',
      'Operating Systems': 'medium',
      'Database Management': 'medium',
      'Computer Networks': 'medium',
      'Object Oriented Programming': 'medium'
    },
    previousPlatforms: existingData?.previous_platforms || [],
    currentSkills: existingData?.current_skills || [],
    interests: existingData?.interests || [],
    
    // Intent & Goals
    primaryReason: existingData?.primary_reason || '',
    deadline: existingData?.target_deadline || '',
    wantReminders: existingData?.want_reminders !== false,
    reminderTime: existingData?.reminder_time || '09:00',
    motivation: existingData?.motivation || '',
    learningGoals: existingData?.learning_goals || [],
    timeAvailable: existingData?.time_available || '1-3',
    
    // Accessibility
    textSize: existingData?.text_size || 'medium',
    visualMode: existingData?.visual_mode || 'dark',
    enableSound: existingData?.enable_sound !== false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const learningStyleOptions = [
    { id: 'visual', label: 'Visual', icon: '👁️', desc: 'Charts, diagrams, flowcharts' },
    { id: 'auditory', label: 'Auditory', icon: '🎧', desc: 'Voice explanations, audio content' },
    { id: 'textual', label: 'Reading/Writing', icon: '📚', desc: 'Text-based content, note-taking' },
    { id: 'kinesthetic', label: 'Interactive', icon: '🎮', desc: 'Games, hands-on activities' }
  ];

  const topicsOptions = [
    { id: 'dsa', label: 'Data Structures & Algorithms', icon: '🔢' },
    { id: 'os', label: 'Operating Systems', icon: '💻' },
    { id: 'dbms', label: 'Database Management', icon: '🗄️' },
    { id: 'networks', label: 'Computer Networks', icon: '🌐' },
    { id: 'oop', label: 'Object Oriented Programming', icon: '🏗️' },
    { id: 'aiml', label: 'AI/Machine Learning', icon: '🤖' },
    { id: 'web', label: 'Web Development', icon: '🌍' },
    { id: 'mobile', label: 'Mobile Development', icon: '📱' },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' },
    { id: 'cloud', label: 'Cloud Computing', icon: '☁️' }
  ];

  const reasonOptions = [
    { id: 'placement', label: 'Placement Preparation', icon: '🎯' },
    { id: 'exam', label: 'Academic Exams', icon: '📝' },
    { id: 'interview', label: 'Technical Interviews', icon: '💼' },
    { id: 'upskilling', label: 'Professional Upskilling', icon: '📈' },
    { id: 'certification', label: 'Certification Prep', icon: '🏆' },
    { id: 'curiosity', label: 'General Learning', icon: '🧠' }
  ];

  const skillOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'Machine Learning',
    'Data Science', 'Web Development', 'Mobile Development', 'DevOps', 'UI/UX Design',
    'Java', 'C++', 'PHP', 'Ruby', 'Angular', 'Vue.js', 'Docker', 'Kubernetes'
  ];

  const learningGoalOptions = [
    { id: 'job', label: 'Get a Job', icon: '💼' },
    { id: 'career_change', label: 'Career Change', icon: '🔄' },
    { id: 'skill_enhancement', label: 'Skill Enhancement', icon: '📈' },
    { id: 'personal_interest', label: 'Personal Interest', icon: '🎯' },
    { id: 'academic', label: 'Academic Purpose', icon: '🎓' },
    { id: 'startup', label: 'Startup/Entrepreneurship', icon: '🚀' },
    { id: 'freelancing', label: 'Freelancing', icon: '💻' }
  ];

  const interestOptions = [
    { id: 'web_dev', label: 'Web Development', icon: '🌐' },
    { id: 'mobile_apps', label: 'Mobile Apps', icon: '📱' },
    { id: 'data_science', label: 'Data Science', icon: '📊' },
    { id: 'ai_ml', label: 'AI/ML', icon: '🤖' },
    { id: 'game_dev', label: 'Game Development', icon: '🎮' },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' },
    { id: 'cloud', label: 'Cloud Computing', icon: '☁️' },
    { id: 'blockchain', label: 'Blockchain', icon: '🔗' },
    { id: 'iot', label: 'IoT', icon: '📡' },
    { id: 'robotics', label: 'Robotics', icon: '🤖' }
  ];

  const platformOptions = [
    'Khan Academy', 'Coursera', 'Udemy', 'YouTube', 'GeeksforGeeks', 
    'LeetCode', 'HackerRank', 'Codecademy', 'FreeCodeCamp', 'edX',
    'Pluralsight', 'LinkedIn Learning', 'Tutorialspoint', 'W3Schools',
    'Stack Overflow', 'GitHub', 'Medium', 'Dev.to', 'Udacity', 'MIT OpenCourseWare'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleConfidenceChange = (topic, level) => {
    setFormData(prev => ({
      ...prev,
      confidence: {
        ...prev.confidence,
        [topic]: level
      }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.age) newErrors.age = 'Age is required';
        if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
        break;
      case 2:
        if (formData.learningStyle.length === 0) newErrors.learningStyle = 'Select at least one learning style';
        if (formData.topicsOfInterest.length === 0) newErrors.topicsOfInterest = 'Select at least one topic of interest';
        break;
      case 4:
        if (!formData.primaryReason) newErrors.primaryReason = 'Please select your primary reason';
        if (!formData.currentGoal.trim()) newErrors.currentGoal = 'Please describe your learning goal';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    
    try {
      // If we have pending signup data, create the user first
      let currentUser = user;
      if (pendingSignupData) {
        const { data: signupResult, error: signupError } = await signUp(
          pendingSignupData.email, 
          pendingSignupData.password, 
          { 
            name: formData.name,
            onboarding_completed: true 
          }
        );
        
        if (signupError) {
          setErrors({ submit: 'Failed to create account: ' + signupError.message });
          return;
        }
        
        currentUser = signupResult?.user;
      }

      // Transform form data to match our schema and send to backend
      const onboardingData = {
        preferences: {
          style: formData.learningStyle.length > 0 ? formData.learningStyle[0] : 'unknown',
          pace: formData.dailyTime === '15min' ? 'slow' : formData.dailyTime === '1hr' ? 'fast' : 'normal',
          confidence: 0.5,
          mode: formData.preferredMode,
          textSize: formData.textSize,
          visualMode: formData.visualMode,
          enableSound: formData.enableSound
        },
        goals: formData.currentGoal ? [{
          id: Date.now(),
          text: formData.currentGoal,
          created: new Date().toISOString(),
          completed: false,
          progress: 0,
          deadline: formData.deadline || null,
          reason: formData.primaryReason
        }] : [],
        skillLevel: formData.experienceLevel,
        preferredDifficulty: 'medium', // Default for now
        topicsOfInterest: formData.topicsOfInterest,
        metadata: {
          age: parseInt(formData.age),
          educationLevel: formData.educationLevel,
          occupation: formData.occupation,
          preferredLanguage: formData.preferredLanguage,
          dailyTime: formData.dailyTime,
          confidence: formData.confidence,
          previousPlatforms: formData.previousPlatforms,
          wantReminders: formData.wantReminders,
          reminderTime: formData.reminderTime,
          motivation: formData.motivation,
          currentSkills: formData.currentSkills,
          interests: formData.interests,
          learningGoals: formData.learningGoals,
          timeAvailable: formData.timeAvailable,
          onboardingCompletedAt: new Date().toISOString()
        }
      };

      // Send comprehensive profile to backend
      const userEmail = pendingSignupData?.email || currentUser?.email;
      if (userEmail) {
        try {
          console.log('Sending profile data to backend:', {
            email: userEmail,
            profileData: {
              name: formData.name,
              age: formData.age,
              education: formData.educationLevel,
              occupation: formData.occupation,
              preferredLanguage: formData.preferredLanguage,
              learningStyle: formData.learningStyle,
              preferredMode: formData.preferredMode,
              topicsOfInterest: formData.topicsOfInterest,
              currentGoal: formData.currentGoal,
              dailyTime: formData.dailyTime,
              skillLevel: formData.experienceLevel,
              confidence: formData.confidence,
              previousPlatforms: formData.previousPlatforms,
              currentSkills: formData.currentSkills,
              interests: formData.interests,
              primaryReason: formData.primaryReason,
              deadline: formData.deadline,
              wantReminders: formData.wantReminders,
              reminderTime: formData.reminderTime,
              motivation: formData.motivation,
              learningGoals: formData.learningGoals,
              timeAvailable: formData.timeAvailable,
              textSize: formData.textSize,
              visualMode: formData.visualMode,
              enableSound: formData.enableSound,
              preferredDifficulty: 'medium'
            }
          });

          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile/create-detailed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userEmail,
              profileData: {
                name: formData.name,
                age: formData.age,
                education: formData.educationLevel,
                occupation: formData.occupation,
                preferredLanguage: formData.preferredLanguage,
                
                // Learning Preferences
                learningStyle: formData.learningStyle,
                preferredMode: formData.preferredMode,
                topicsOfInterest: formData.topicsOfInterest,
                currentGoal: formData.currentGoal,
                dailyTime: formData.dailyTime,
                
                // Prior Knowledge
                skillLevel: formData.experienceLevel,
                confidence: formData.confidence,
                previousPlatforms: formData.previousPlatforms,
                currentSkills: formData.currentSkills,
                interests: formData.interests,
                
                // Intent & Goals
                primaryReason: formData.primaryReason,
                deadline: formData.deadline,
                wantReminders: formData.wantReminders,
                reminderTime: formData.reminderTime,
                motivation: formData.motivation,
                learningGoals: formData.learningGoals,
                timeAvailable: formData.timeAvailable,
                
                // Accessibility
                textSize: formData.textSize,
                visualMode: formData.visualMode,
                enableSound: formData.enableSound,
                
                preferredDifficulty: 'medium'
              }
            })
          });

          const responseData = await response.text();
          console.log('Backend response:', responseData);

          if (!response.ok) {
            console.error('Failed to save comprehensive profile to backend:', responseData);
            // Don't fail the whole process for this
          } else {
            console.log('Successfully saved profile to backend');
          }
        } catch (error) {
          console.error('Error saving comprehensive profile:', error);
          // Don't fail the whole process for this
        }
      }

      // Update profile with onboarding data
      await completeOnboarding(onboardingData);
      
      // Also update basic profile info
      if (!pendingSignupData) {
        await updateProfile({
          name: formData.name,
          onboarding_completed: true
        });
      }

      onComplete(onboardingData);
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrors({ submit: 'Failed to save onboarding data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">👋 Welcome! Let's Get to Know You</h2>
        <p className="text-gray-300">Help us personalize your learning experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full bg-gray-700 border rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Age *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            className={`w-full bg-gray-700 border rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.age ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="e.g., 21"
            min="13"
            max="100"
          />
          {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Education Level *
        </label>
        <select
          value={formData.educationLevel}
          onChange={(e) => handleInputChange('educationLevel', e.target.value)}
          className={`w-full bg-gray-700 border rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            errors.educationLevel ? 'border-red-500' : 'border-gray-600'
          }`}
        >
          <option value="">Select your education level</option>
          <option value="high-school">High School</option>
          <option value="undergraduate-1">Engineering (1st year)</option>
          <option value="undergraduate-2">Engineering (2nd year)</option>
          <option value="undergraduate-3">Engineering (3rd year)</option>
          <option value="undergraduate-4">Engineering (4th year)</option>
          <option value="graduate">Graduate</option>
          <option value="postgraduate">Post Graduate</option>
          <option value="professional">Working Professional</option>
        </select>
        {errors.educationLevel && <p className="text-red-400 text-sm mt-1">{errors.educationLevel}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Preferred Language
        </label>
        <select
          value={formData.preferredLanguage}
          onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🧠 Learning Preferences</h2>
        <p className="text-gray-300">How do you learn best?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Preferred Learning Style * (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {learningStyleOptions.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => handleArrayToggle('learningStyle', style.id)}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                formData.learningStyle.includes(style.id)
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{style.icon}</span>
                <span className="font-medium text-white">{style.label}</span>
              </div>
              <p className="text-sm text-gray-300">{style.desc}</p>
            </button>
          ))}
        </div>
        {errors.learningStyle && <p className="text-red-400 text-sm mt-1">{errors.learningStyle}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Preferred Mode
        </label>
        <div className="flex gap-4">
          {[
            { id: 'text', label: 'Text Only', icon: '📝' },
            { id: 'voice', label: 'Voice Only', icon: '🎤' },
            { id: 'both', label: 'Text + Voice', icon: '🎭' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleInputChange('preferredMode', mode.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                formData.preferredMode === mode.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{mode.icon}</div>
                <div className="text-white font-medium">{mode.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Topics of Interest * (Select at least one)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topicsOptions.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleArrayToggle('topicsOfInterest', topic.id)}
              className={`p-3 rounded-lg border-2 transition-colors text-center ${
                formData.topicsOfInterest.includes(topic.id)
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-xl mb-1">{topic.icon}</div>
              <div className="text-sm text-white">{topic.label}</div>
            </button>
          ))}
        </div>
        {errors.topicsOfInterest && <p className="text-red-400 text-sm mt-1">{errors.topicsOfInterest}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Daily Learning Time Available
        </label>
        <select
          value={formData.dailyTime}
          onChange={(e) => handleInputChange('dailyTime', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="15min">15 minutes</option>
          <option value="30min">30 minutes</option>
          <option value="1hr">1 hour</option>
          <option value="2hr">2 hours</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">📊 Prior Knowledge</h2>
        <p className="text-gray-300">Help us understand your current skill level</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Overall Experience Level
        </label>
        <div className="flex gap-4">
          {[
            { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
            { id: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
            { id: 'advanced', label: 'Advanced', desc: 'Experienced learner' }
          ].map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => handleInputChange('experienceLevel', level.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors text-center ${
                formData.experienceLevel === level.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="font-medium text-white">{level.label}</div>
              <div className="text-sm text-gray-300 mt-1">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Confidence in Core Subjects
        </label>
        <div className="space-y-4">
          {Object.keys(formData.confidence).map((topic) => (
            <div key={topic} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{topic}</span>
                <span className="text-blue-400 capitalize">{formData.confidence[topic]}</span>
              </div>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleConfidenceChange(topic, level)}
                    className={`flex-1 py-1 px-3 rounded text-sm transition-colors ${
                      formData.confidence[topic] === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Previous Learning Platforms (Optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {platformOptions.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => handleArrayToggle('previousPlatforms', platform)}
              className={`p-2 rounded border transition-colors text-sm ${
                formData.previousPlatforms.includes(platform)
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎯 Your Learning Goals</h2>
        <p className="text-gray-300">What do you want to achieve?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Primary Reason for Learning *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reasonOptions.map((reason) => (
            <button
              key={reason.id}
              type="button"
              onClick={() => handleInputChange('primaryReason', reason.id)}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                formData.primaryReason === reason.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{reason.icon}</span>
                <span className="font-medium text-white">{reason.label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.primaryReason && <p className="text-red-400 text-sm mt-1">{errors.primaryReason}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe Your Learning Goal *
        </label>
        <textarea
          value={formData.currentGoal}
          onChange={(e) => handleInputChange('currentGoal', e.target.value)}
          className={`w-full bg-gray-700 border rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none ${
            errors.currentGoal ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="e.g., Crack TCS NQT in 3 months, Master Python for data science, Prepare for system design interviews..."
        />
        {errors.currentGoal && <p className="text-red-400 text-sm mt-1">{errors.currentGoal}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target Deadline (Optional)
        </label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => handleInputChange('deadline', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Reminders & Notifications
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.wantReminders}
              onChange={(e) => handleInputChange('wantReminders', e.target.checked)}
              className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">Send me learning reminders</span>
          </label>
          
          {formData.wantReminders && (
            <div className="ml-7">
              <label className="block text-sm text-gray-300 mb-1">Preferred time:</label>
              <input
                type="time"
                value={formData.reminderTime}
                onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">⚙️ Accessibility & Preferences</h2>
        <p className="text-gray-300">Customize your experience</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Text Size Preference
        </label>
        <div className="flex gap-4">
          {[
            { id: 'small', label: 'Small' },
            { id: 'medium', label: 'Medium' },
            { id: 'large', label: 'Large' }
          ].map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => handleInputChange('textSize', size.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                formData.textSize === size.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-white font-medium">{size.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Visual Comfort Mode
        </label>
        <div className="flex gap-4">
          {[
            { id: 'light', label: 'Light Mode', icon: '☀️' },
            { id: 'dark', label: 'Dark Mode', icon: '🌙' },
            { id: 'dyslexic', label: 'Dyslexic-friendly', icon: '👁️' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleInputChange('visualMode', mode.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors text-center ${
                formData.visualMode === mode.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-white font-medium">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.enableSound}
            onChange={(e) => handleInputChange('enableSound', e.target.checked)}
            className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <span className="text-white">Enable sound effects and haptic feedback</span>
        </label>
      </div>

      {errors.submit && (
        <div className="bg-red-900/30 border border-red-600 text-red-200 p-3 rounded-md">
          {errors.submit}
        </div>
      )}

      <div className="bg-green-900/20 p-4 rounded-lg border border-green-600">
        <h3 className="text-green-300 font-medium mb-2">🎉 You're all set!</h3>
        <p className="text-green-200 text-sm">
          Based on your preferences, we'll personalize your learning experience with:
        </p>
        <ul className="text-green-200 text-sm mt-2 list-disc list-inside space-y-1">
          <li>Content tailored to your learning style</li>
          <li>Difficulty adjusted to your experience level</li>
          <li>Recommendations based on your interests</li>
          <li>Progress tracking towards your goals</li>
        </ul>
        
        {onSkip && pendingSignupData && (
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600 rounded">
            <p className="text-blue-200 text-sm">
              💡 <strong>Tip:</strong> You can always update your profile later in the dashboard to get better personalized recommendations!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
            <span>Step {currentStep} of 5</span>
            <div className="flex items-center gap-4">
              <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
              {onSkip && pendingSignupData && (
                <button
                  onClick={onSkip}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep === 5 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center disabled:opacity-50"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Completing...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedOnboarding;
