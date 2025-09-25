import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RiLightbulbLine, RiCodeSSlashLine, RiPaletteLine } from 'react-icons/ri';

function ThinkingIndicator() {
    const { currentTheme } = useTheme();

    // Theme-aware colors
    const getThinkingThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    text: 'text-light-text-primary',
                    textSecondary: 'text-light-text-secondary',
                    accent: 'text-light-accent-primary'
                };
            case 'forest':
                return {
                    text: 'text-forest-text-primary',
                    textSecondary: 'text-forest-text-secondary',
                    accent: 'text-forest-accent-primary'
                };
            case 'sunset':
                return {
                    text: 'text-sunset-text-primary',
                    textSecondary: 'text-sunset-text-secondary',
                    accent: 'text-sunset-accent-primary'
                };
            case 'purple':
                return {
                    text: 'text-purple-text-primary',
                    textSecondary: 'text-purple-text-secondary',
                    accent: 'text-purple-accent-primary'
                };
            default: // dark
                return {
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    accent: 'text-blue-400'
                };
        }
    };

    const colors = getThinkingThemeColors();

    const thinkingSteps = [
        { icon: <RiLightbulbLine />, text: "Analyzing your prompt..." },
        { icon: <RiCodeSSlashLine />, text: "Generating HTML structure..." },
        { icon: <RiPaletteLine />, text: "Applying styles and interactions..." }
    ];

    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className={`absolute inset-0 flex items-center justify-center ${colors.accent}`}>
                        <RiCodeSSlashLine className="text-2xl" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className={`text-xl font-semibold ${colors.text}`}>
                    AI is generating your code...
                </h3>
                
                <div className="space-y-3">
                    {thinkingSteps.map((step, index) => (
                        <div key={index} className="flex items-center justify-center space-x-3">
                            <div className={`${colors.accent} text-lg`}>
                                {step.icon}
                            </div>
                            <span className={`${colors.textSecondary}`}>
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>
                
                <p className={`${colors.textSecondary} text-sm mt-4`}>
                    This usually takes 10-30 seconds...
                </p>
            </div>
        </div>
    );
}

export default ThinkingIndicator;
