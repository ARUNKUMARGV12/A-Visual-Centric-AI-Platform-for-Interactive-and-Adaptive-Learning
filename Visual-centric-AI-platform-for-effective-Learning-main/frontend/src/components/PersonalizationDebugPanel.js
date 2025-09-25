import React, { useState } from 'react';
import { useChatContext } from '../contexts/ChatContextContext';
import { useAuth } from '../contexts/AuthContext';

const PersonalizationDebugPanel = () => {
  const { getPersonalizedContext } = useChatContext();
  const { user, userProfile } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);

  const handleDebugCheck = () => {
    try {
      const context = getPersonalizedContext();
      setDebugData({
        personalizedContext: context,
        userProfile: userProfile,
        user: user,
        chatContextAvailable: !!getPersonalizedContext,
        timestamp: new Date().toISOString()
      });
      setShowDebug(true);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugData({ 
        error: error.message,
        userProfile: userProfile,
        user: user,
        chatContextAvailable: !!getPersonalizedContext
      });
      setShowDebug(true);
    }
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleDebugCheck}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
          title="Debug Personalization"
        >
          🔍 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-gray-900 border border-purple-500 rounded-lg shadow-xl">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">🔍 Personalization Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 max-h-96 overflow-y-auto">
        {debugData?.error ? (
          <div className="text-red-400">
            <p>Error: {debugData.error}</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="text-yellow-300 font-medium">Basic Info:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 mt-1 overflow-x-auto">
                {JSON.stringify({
                  userExists: !!debugData?.user,
                  userProfileExists: !!debugData?.userProfile,
                  userName: debugData?.userProfile?.name,
                  userEmail: debugData?.user?.email,
                  isGuest: debugData?.user?.isGuest,
                  chatContextAvailable: debugData?.chatContextAvailable
                }, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="text-purple-300 font-medium">User Context:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 mt-1 overflow-x-auto">
                {JSON.stringify(debugData?.personalizedContext?.user, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="text-blue-300 font-medium">Session Info:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 mt-1 overflow-x-auto">
                {JSON.stringify(debugData?.personalizedContext?.session, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="text-green-300 font-medium">Context Flags:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 mt-1 overflow-x-auto">
                {JSON.stringify(debugData?.personalizedContext?.context, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="text-yellow-300 font-medium">Profile Data:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 mt-1 overflow-x-auto">
                {JSON.stringify({
                  learningStyle: debugData?.userProfile?.learningPreferences?.style,
                  skillLevel: debugData?.userProfile?.skill_level,
                  preferredDifficulty: debugData?.userProfile?.preferred_difficulty,
                  totalInteractions: debugData?.userProfile?.total_interactions
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <button
            onClick={handleDebugCheck}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationDebugPanel;
