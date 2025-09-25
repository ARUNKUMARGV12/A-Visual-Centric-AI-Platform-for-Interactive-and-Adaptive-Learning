import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EnhancedPersonalizedOnboarding = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  startingPhase = 'basic',
  isEditMode = false,
  existingData = null
}) => {
  const { user, updateUserProfile } = useAuth();
  
  const getStepFromPhase = (phase) => {
    switch (phase) {
      case 'basic': return 1;
      case 'learning': return 2;
      case 'interests': return 3;
      case 'skills': return 4;
      default: return 1;
    }
  };

  const [currentStep, setCurrentStep] = useState(getStepFromPhase(startingPhase));
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter(item => item !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    // Add validation logic for each step here if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      await updateUserProfile(formData);
      onComplete();
    } catch (error) {
      console.error('Error saving profile data:', error);
      setErrors({ submit: 'Failed to save data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            {/* Form fields for basic info */}
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Learning Preferences</h2>
            {/* Form fields for learning preferences */}
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Interests & Goals</h2>
            {/* Form fields for interests and goals */}
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Skill Assessment</h2>
            {/* Form fields for skill assessment */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        {renderStepContent()}
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <button onClick={handlePrevious} disabled={currentStep === 1} className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50">Previous</button>
          {currentStep < 4 ? (
            <button onClick={handleNext} className="px-4 py-2 bg-blue-600 rounded">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 rounded">{loading ? 'Saving...' : 'Save Profile'}</button>
          )}
        </div>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">X</button>
      </div>
    </div>
  );
};

export default EnhancedPersonalizedOnboarding;
