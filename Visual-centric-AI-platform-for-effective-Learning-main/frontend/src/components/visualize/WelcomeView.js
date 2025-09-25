import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RiCodeSSlashLine, RiSendPlaneFill, RiLightbulbLine } from 'react-icons/ri';
import { FaRocket, FaMagic, FaPalette } from 'react-icons/fa';

function WelcomeView({ onGenerate }) {
    const { currentTheme } = useTheme();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Theme-aware colors
    const getWelcomeThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    container: 'bg-light-bg',
                    card: 'bg-light-card border-light-border',
                    text: 'text-light-text-primary',
                    textSecondary: 'text-light-text-secondary',
                    accent: 'text-light-accent-primary',
                    border: 'border-light-border',
                    input: 'bg-light-card border-light-border text-light-text-primary',
                    button: 'bg-light-accent-primary hover:bg-light-accent-primary/80',
                    suggestionCard: 'bg-light-sidebar border-light-border hover:border-light-accent-primary/50'
                };
            case 'forest':
                return {
                    container: 'bg-forest-bg',
                    card: 'bg-forest-card border-forest-border',
                    text: 'text-forest-text-primary',
                    textSecondary: 'text-forest-text-secondary',
                    accent: 'text-forest-accent-primary',
                    border: 'border-forest-border',
                    input: 'bg-forest-card border-forest-border text-forest-text-primary',
                    button: 'bg-forest-accent-primary hover:bg-forest-accent-primary/80',
                    suggestionCard: 'bg-forest-sidebar border-forest-border hover:border-forest-accent-primary/50'
                };
            case 'sunset':
                return {
                    container: 'bg-sunset-bg',
                    card: 'bg-sunset-card border-sunset-border',
                    text: 'text-sunset-text-primary',
                    textSecondary: 'text-sunset-text-secondary',
                    accent: 'text-sunset-accent-primary',
                    border: 'border-sunset-border',
                    input: 'bg-sunset-card border-sunset-border text-sunset-text-primary',
                    button: 'bg-sunset-accent-primary hover:bg-sunset-accent-primary/80',
                    suggestionCard: 'bg-sunset-sidebar border-sunset-border hover:border-sunset-accent-primary/50'
                };
            case 'purple':
                return {
                    container: 'bg-purple-bg',
                    card: 'bg-purple-card border-purple-border',
                    text: 'text-purple-text-primary',
                    textSecondary: 'text-purple-text-secondary',
                    accent: 'text-purple-accent-primary',
                    border: 'border-purple-border',
                    input: 'bg-purple-card border-purple-border text-purple-text-primary',
                    button: 'bg-purple-accent-primary hover:bg-purple-accent-primary/80',
                    suggestionCard: 'bg-purple-sidebar border-purple-border hover:border-purple-accent-primary/50'
                };
            default: // dark
                return {
                    container: 'bg-dark-bg',
                    card: 'bg-dark-card border-dark-border',
                    text: 'text-dark-text-primary',
                    textSecondary: 'text-dark-text-secondary',
                    accent: 'text-dark-accent-primary',
                    border: 'border-dark-border',
                    input: 'bg-dark-card border-dark-border text-dark-text-primary',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    suggestionCard: 'bg-dark-sidebar border-dark-border hover:border-blue-500/50'
                };
        }
    };

    const colors = getWelcomeThemeColors();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isGenerating) return;
        
        setIsGenerating(true);
        await onGenerate(prompt.trim());
        setIsGenerating(false);
    };

    const examplePrompts = [
        {
            icon: <FaRocket className="text-blue-400" />,
            title: "Landing Page",
            description: "Create a modern landing page for a tech startup",
            prompt: "Create a modern, responsive landing page for a tech startup called 'InnovateLab' with a hero section, features showcase, and contact form"
        },
        {
            icon: <FaPalette className="text-purple-400" />,
            title: "Portfolio Site",
            description: "Build a creative portfolio website",
            prompt: "Design a creative portfolio website for a graphic designer with image gallery, about section, and smooth animations"
        },
        {
            icon: <FaMagic className="text-green-400" />,
            title: "Dashboard",
            description: "Generate an analytics dashboard",
            prompt: "Create an interactive analytics dashboard with charts, metrics cards, and data tables using modern design principles"
        },
        {
            icon: <RiLightbulbLine className="text-yellow-400" />,
            title: "Blog Layout",
            description: "Design a clean blog interface",
            prompt: "Build a clean, minimal blog layout with article cards, sidebar navigation, and responsive design"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className={`inline-flex items-center justify-center w-20 h-20 ${colors.card} border-2 ${colors.border} rounded-2xl mb-6`}>
                    <RiCodeSSlashLine className={`text-3xl ${colors.accent}`} />
                </div>
                <h1 className={`text-4xl font-bold ${colors.text} mb-4`}>
                    AI Code Visualizer
                </h1>
                <p className={`text-lg ${colors.textSecondary} max-w-2xl mx-auto`}>
                    Transform your ideas into beautiful, functional web pages using the power of AI. 
                    Describe what you want to build, and watch it come to life instantly.
                </p>
            </div>

            {/* Main Input Form */}
            <div className={`${colors.card} border-2 ${colors.border} rounded-2xl p-8 mb-8 shadow-lg`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={`block text-sm font-medium ${colors.text} mb-3`}>
                            Describe your web page
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Example: Create a modern landing page for a coffee shop with a hero section, menu showcase, and contact information..."
                            className={`w-full ${colors.input} border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200`}
                            rows={4}
                            disabled={isGenerating}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!prompt.trim() || isGenerating}
                        className={`w-full ${colors.button} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <RiSendPlaneFill className="text-lg" />
                                <span>Generate Code</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Example Prompts */}
            <div className="mb-8">
                <h2 className={`text-2xl font-semibold ${colors.text} mb-6 text-center`}>
                    Or try these examples
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examplePrompts.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => setPrompt(example.prompt)}
                            className={`${colors.suggestionCard} border-2 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1`}
                            disabled={isGenerating}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 text-2xl">
                                    {example.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${colors.text} mb-2`}>
                                        {example.title}
                                    </h3>
                                    <p className={`text-sm ${colors.textSecondary}`}>
                                        {example.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div className={`${colors.card} border ${colors.border} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold ${colors.text} mb-4 text-center`}>
                    What you can create
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div className={`text-2xl ${colors.accent} mb-2`}>🎨</div>
                        <p className={`text-sm ${colors.textSecondary}`}>Beautiful, responsive designs</p>
                    </div>
                    <div>
                        <div className={`text-2xl ${colors.accent} mb-2`}>⚡</div>
                        <p className={`text-sm ${colors.textSecondary}`}>Interactive components</p>
                    </div>
                    <div>
                        <div className={`text-2xl ${colors.accent} mb-2`}>📱</div>
                        <p className={`text-sm ${colors.textSecondary}`}>Mobile-first layouts</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WelcomeView;
