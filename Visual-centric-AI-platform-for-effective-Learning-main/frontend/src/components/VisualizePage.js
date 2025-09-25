import React, { useState, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import WelcomeView from './visualize/WelcomeView';
import GenerationView from './visualize/GenerationView';

function VisualizePage() {
    const { currentTheme } = useTheme();
    const [currentView, setCurrentView] = useState('welcome'); // 'welcome' or 'generation'
    const [generatedCode, setGeneratedCode] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    // Theme-aware colors for VisualizePage
    const getVisualizeThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    container: 'bg-light-bg',
                    card: 'bg-light-card border-light-border',
                    text: 'text-light-text-primary',
                    textSecondary: 'text-light-text-secondary',
                    accent: 'text-light-accent-primary',
                    border: 'border-light-border'
                };
            case 'forest':
                return {
                    container: 'bg-forest-bg',
                    card: 'bg-forest-card border-forest-border',
                    text: 'text-forest-text-primary',
                    textSecondary: 'text-forest-text-secondary',
                    accent: 'text-forest-accent-primary',
                    border: 'border-forest-border'
                };
            case 'sunset':
                return {
                    container: 'bg-sunset-bg',
                    card: 'bg-sunset-card border-sunset-border',
                    text: 'text-sunset-text-primary',
                    textSecondary: 'text-sunset-text-secondary',
                    accent: 'text-sunset-accent-primary',
                    border: 'border-sunset-border'
                };
            case 'purple':
                return {
                    container: 'bg-purple-bg',
                    card: 'bg-purple-card border-purple-border',
                    text: 'text-purple-text-primary',
                    textSecondary: 'text-purple-text-secondary',
                    accent: 'text-purple-accent-primary',
                    border: 'border-purple-border'
                };
            default: // dark
                return {
                    container: 'bg-dark-bg',
                    card: 'bg-dark-card border-dark-border',
                    text: 'text-dark-text-primary',
                    textSecondary: 'text-dark-text-secondary',
                    accent: 'text-dark-accent-primary',
                    border: 'border-dark-border'
                };
        }
    };

    const colors = getVisualizeThemeColors();

    const handleGenerateCode = async (userPrompt) => {
        setPrompt(userPrompt);
        setIsGenerating(true);
        setGenerationError('');
        setCurrentView('generation');

        try {
            // Call the real backend API endpoint
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: userPrompt,
                    provider: 'gemini'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setGeneratedCode(data.code);
            } else {
                throw new Error(data.error || 'Failed to generate code');
            }
        } catch (error) {
            console.error('Error generating code:', error);
            setGenerationError(`Failed to generate code: ${error.message}. Please try again.`);
            
            // Fallback code for when the API fails
            const fallbackCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Service Unavailable</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.9; }
        .retry-btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .retry-btn:hover {
            background: white;
            color: #ee5a24;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>🚫 Service Unavailable</h1>
        <p>The AI code generation service is temporarily unavailable.</p>
        <p>Please ensure the backend server is running and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
            Try Again
        </button>
    </div>
</body>
</html>`;
            setGeneratedCode(fallbackCode);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBackToWelcome = () => {
        setCurrentView('welcome');
        setGeneratedCode('');
        setPrompt('');
        setGenerationError('');
    };

    return (
        <div className={`min-h-screen ${colors.container} transition-colors duration-200`}>
            <div className="container mx-auto px-4 py-8">
                {currentView === 'welcome' ? (
                    <WelcomeView onGenerate={handleGenerateCode} />
                ) : (
                    <GenerationView
                        prompt={prompt}
                        generatedCode={generatedCode}
                        isGenerating={isGenerating}
                        error={generationError}
                        onBack={handleBackToWelcome}
                        onNewGeneration={() => setCurrentView('welcome')}
                        onCodeUpdate={setGeneratedCode}
                    />
                )}
            </div>
        </div>
    );
}

export default VisualizePage;
