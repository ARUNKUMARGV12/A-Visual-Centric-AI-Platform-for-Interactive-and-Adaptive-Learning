import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContextContext';

const PersonalizationTester = () => {
  const { user, userProfile, continueAsGuest, isAuthenticated, isGuest } = useAuth();
  const { getPersonalizedContext, createChatSession } = useChatContext();

  const handleStartGuest = () => {
    continueAsGuest();
  };

  const handleTestPersonalization = () => {
    try {
      const context = getPersonalizedContext();
      console.log('Personalized Context:', context);
      alert(`Personalization Test:\nUser Name: ${userProfile?.name}\nLearning Style: ${context?.user?.learningStyle}\nSkill Level: ${context?.user?.skillLevel}`);
    } catch (error) {
      console.error('Personalization test failed:', error);
      alert('Personalization test failed: ' + error.message);
    }
  };

  const handleTestChatSession = () => {
    const sessionId = createChatSession('javascript');
    console.log('Created chat session:', sessionId);
    alert('Created chat session: ' + sessionId);
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900 border border-green-500 rounded-lg p-4 shadow-xl">
      <h3 className="text-white font-semibold mb-3">🧪 Personalization Tester</h3>
      
      <div className="space-y-2 text-sm">
        <div className="text-gray-300">
          <p>User: {user?.email || 'Not signed in'}</p>
          <p>Profile: {userProfile?.name || 'No profile'}</p>
          <p>Is Guest: {isGuest ? 'Yes' : 'No'}</p>
          <p>Is Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="space-y-2">
          {!isAuthenticated && (
            <button
              onClick={handleStartGuest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Start Guest Mode
            </button>
          )}
          
          {userProfile && (
            <>
              <button
                onClick={handleTestPersonalization}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Test Personalization
              </button>
              
              <button
                onClick={handleTestChatSession}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
              >
                Test Chat Session
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizationTester;
