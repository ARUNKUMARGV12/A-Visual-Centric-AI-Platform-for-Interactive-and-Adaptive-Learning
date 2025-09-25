import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PersonalizedOnboarding from './PersonalizedOnboarding';

const AuthModal = ({ isOpen, onClose, mode: initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', 'guest'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);
  
  const { signIn, signUp, continueAsGuest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        // Store signup data temporarily - don't create user yet
        setPendingSignupData({
          email,
          password,
          name
        });
        setError('');
        // Show onboarding for new users
        setShowOnboarding(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    // Show onboarding for guest users too
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (onboardingData) => {
    // onboardingData will include the signup completion flag
    setShowOnboarding(false);
    onClose();
  };

  const handleOnboardingSkip = async () => {
    // User skipped onboarding - create account with minimal data
    if (pendingSignupData) {
      setLoading(true);
      try {
        const { error } = await signUp(pendingSignupData.email, pendingSignupData.password, { 
          name: pendingSignupData.name,
          onboarding_completed: false 
        });
        if (error) {
          setError(error.message);
          return;
        }
      } catch (err) {
        setError('Failed to create account');
        return;
      } finally {
        setLoading(false);
      }
    }
    setShowOnboarding(false);
    onClose();
  };

  // If showing onboarding, render that instead
  if (showOnboarding) {
    return (
      <PersonalizedOnboarding
        isOpen={true}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        pendingSignupData={pendingSignupData}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4 p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'Welcome Back!' : 'Join Our Learning Community'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-3 text-gray-400 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          <button
            onClick={handleGuestAccess}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium mb-4"
          >
            Continue as Guest
          </button>

          <div className="text-center">
            {mode === 'signin' ? (
              <p className="text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {mode === 'signin' && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600 rounded-md">
            <h3 className="text-blue-300 font-medium mb-2">🎯 Why Create an Account?</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Personalized learning recommendations</li>
              <li>• Track your progress across sessions</li>
              <li>• Save your learning goals and achievements</li>
              <li>• Adaptive content based on your style</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
