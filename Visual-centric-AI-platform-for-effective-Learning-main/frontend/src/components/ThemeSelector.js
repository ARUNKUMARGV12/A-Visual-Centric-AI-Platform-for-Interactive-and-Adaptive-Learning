import React, { useState } from 'react';
import { FaPalette, FaTimes } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector = () => {
  const { currentTheme, changeTheme, themes, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme) => {
    changeTheme(theme);
    setIsOpen(false);
  };

  return (
    <>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: currentTheme === 'light' ? '#10B981' : 
                          currentTheme === 'forest' ? '#22C55E' : 
                          currentTheme === 'sunset' ? '#F97316' : 
                          currentTheme === 'purple' ? '#8B5CF6' : '#10B981',
          color: 'white'
        }}
        aria-label="Change theme"
      >
        <FaPalette className="h-5 w-5" />
      </button>

      {/* Theme Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative max-w-md w-full mx-4 p-6 rounded-2xl shadow-2xl"
               style={{
                 backgroundColor: currentTheme === 'light' ? '#FFFFFF' : 
                                 currentTheme === 'forest' ? '#1A2E1A' : 
                                 currentTheme === 'sunset' ? '#2D1B14' : 
                                 currentTheme === 'purple' ? '#1B142D' : '#1E293B',
                 color: currentTheme === 'light' ? '#1F2937' : '#F1F5F9'
               }}>
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200/20 transition-colors"
              aria-label="Close theme selector"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Choose Theme</h2>
              <p className="text-sm opacity-75">Select your preferred color scheme</p>
            </div>

            {/* Theme Options */}
            <div className="grid grid-cols-1 gap-3">
              {availableThemes.map((theme) => {
                const config = themes[theme];
                const isSelected = currentTheme === theme;
                
                return (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`flex items-center p-4 rounded-xl transition-all duration-200 border-2 ${
                      isSelected 
                        ? 'border-opacity-100 shadow-lg transform scale-105' 
                        : 'border-opacity-20 hover:border-opacity-40 hover:scale-102'
                    }`}
                    style={{
                      borderColor: theme === 'light' ? '#10B981' : 
                                  theme === 'forest' ? '#22C55E' : 
                                  theme === 'sunset' ? '#F97316' : 
                                  theme === 'purple' ? '#8B5CF6' : '#10B981',
                      backgroundColor: isSelected 
                        ? (theme === 'light' ? '#10B981' + '20' : 
                           theme === 'forest' ? '#22C55E' + '20' : 
                           theme === 'sunset' ? '#F97316' + '20' : 
                           theme === 'purple' ? '#8B5CF6' + '20' : '#10B981' + '20')
                        : 'transparent'
                    }}
                  >
                    {/* Theme Preview */}
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-2xl">{config.icon}</div>
                      <div className="text-left">
                        <div className="font-semibold">{config.name}</div>
                        <div className="text-sm opacity-75">{config.description}</div>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: theme === 'light' ? '#FFFFFF' : 
                                          theme === 'forest' ? '#0F1B0F' : 
                                          theme === 'sunset' ? '#1A0F0A' : 
                                          theme === 'purple' ? '#0F0A1A' : '#0F172A'
                        }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: theme === 'light' ? '#10B981' : 
                                          theme === 'forest' ? '#22C55E' : 
                                          theme === 'sunset' ? '#F97316' : 
                                          theme === 'purple' ? '#8B5CF6' : '#10B981'
                        }}
                      />
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="ml-2 w-2 h-2 rounded-full bg-current opacity-75" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs opacity-50">
              Theme preference is saved locally
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelector;
