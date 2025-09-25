import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EnhancedSignUpForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Basic Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Step 2: Personal Information
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    education: '',
    occupation: '',
    currentSkills: [],
    learningGoals: [],
    learningStyle: 'visual',
    skillLevel: 'beginner',
    preferredDifficulty: 'medium',
    interests: [],
    timeAvailable: '',
    motivation: ''
  });
  
  const { signUp } = useAuth();

  const skillOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'Machine Learning',
    'Data Science', 'Web Development', 'Mobile Development', 'DevOps', 'UI/UX Design'
  ];

  const interestOptions = [
    'Web Development', 'Mobile Apps', 'Data Science', 'AI/ML', 'Game Development',
    'Cybersecurity', 'Cloud Computing', 'Blockchain', 'IoT', 'Robotics'
  ];

  const learningGoalOptions = [
    'Get a Job', 'Career Change', 'Skill Enhancement', 'Personal Interest',
    'Academic Purpose', 'Startup/Entrepreneurship', 'Freelancing'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field, value, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [field]: isChecked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, create the account
      const { error } = await signUp(email, password, {
        name: formData.name,
        skipProfileCreation: true // We'll create detailed profile in step 2
      });
      
      if (error) {
        setError(error.message);
      } else {
        setStep(2);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Submit detailed profile data
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile/create-detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          profileData: formData
        })
      });

      if (response.ok) {
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create profile');
      }
    } catch (err) {
      setError('Failed to save profile information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {step === 1 ? 'Create Your Account' : 'Complete Your Profile'}
        </h2>
        <div className="flex space-x-2 mb-4">
          <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
          <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Next: Complete Profile'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                min="13"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
              <select
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="">Select Education Level</option>
                <option value="high_school">High School</option>
                <option value="associate">Associate Degree</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="self_taught">Self-Taught</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="e.g., Student, Software Engineer, Marketing Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Skills (Select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.currentSkills.includes(skill)}
                    onChange={(e) => handleArrayInputChange('currentSkills', skill, e.target.checked)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-300">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Learning Goals (Select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {learningGoalOptions.map(goal => (
                <label key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.learningGoals.includes(goal)}
                    onChange={(e) => handleArrayInputChange('learningGoals', goal, e.target.checked)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-300">{goal}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Learning Style</label>
              <select
                value={formData.learningStyle}
                onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="visual">Visual (Charts, Diagrams)</option>
                <option value="auditory">Auditory (Voice, Sound)</option>
                <option value="textual">Textual (Reading, Writing)</option>
                <option value="kinesthetic">Kinesthetic (Hands-on)</option>
                <option value="gamified">Gamified (Interactive)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Skill Level</label>
              <select
                value={formData.skillLevel}
                onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interests (Select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {interestOptions.map(interest => (
                <label key={interest} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={(e) => handleArrayInputChange('interests', interest, e.target.checked)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-300">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Available for Learning per Week</label>
            <select
              value={formData.timeAvailable}
              onChange={(e) => handleInputChange('timeAvailable', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="">Select Time Commitment</option>
              <option value="1-3">1-3 hours</option>
              <option value="4-7">4-7 hours</option>
              <option value="8-15">8-15 hours</option>
              <option value="16+">16+ hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">What motivates you to learn? (Optional)</label>
            <textarea
              value={formData.motivation}
              onChange={(e) => handleInputChange('motivation', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              rows="3"
              placeholder="Tell us about your learning goals and what drives you..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EnhancedSignUpForm;
