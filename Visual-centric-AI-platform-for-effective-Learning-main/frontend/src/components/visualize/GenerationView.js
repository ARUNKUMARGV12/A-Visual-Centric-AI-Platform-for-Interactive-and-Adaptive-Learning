import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RiArrowLeftLine, RiRefreshLine, RiDownload2Line, RiEyeLine, RiCodeSSlashLine } from 'react-icons/ri';
import { FaDesktop, FaTabletAlt, FaMobile } from 'react-icons/fa';
import CodeEditor from './CodeEditor';
import ThinkingIndicator from './ThinkingIndicator';

function GenerationView({ 
    prompt, 
    generatedCode, 
    isGenerating, 
    error, 
    onBack, 
    onNewGeneration, 
    onCodeUpdate 
}) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'code'
    const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'

    // Theme-aware colors
    const getGenerationThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    container: 'bg-light-bg',
                    card: 'bg-light-card border-light-border',
                    text: 'text-light-text-primary',
                    textSecondary: 'text-light-text-secondary',
                    accent: 'text-light-accent-primary',
                    border: 'border-light-border',
                    button: 'bg-light-accent-primary hover:bg-light-accent-primary/80',
                    tabActive: 'bg-light-accent-primary text-white',
                    tabInactive: 'text-light-text-secondary hover:text-light-text-primary'
                };
            case 'forest':
                return {
                    container: 'bg-forest-bg',
                    card: 'bg-forest-card border-forest-border',
                    text: 'text-forest-text-primary',
                    textSecondary: 'text-forest-text-secondary',
                    accent: 'text-forest-accent-primary',
                    border: 'border-forest-border',
                    button: 'bg-forest-accent-primary hover:bg-forest-accent-primary/80',
                    tabActive: 'bg-forest-accent-primary text-white',
                    tabInactive: 'text-forest-text-secondary hover:text-forest-text-primary'
                };
            case 'sunset':
                return {
                    container: 'bg-sunset-bg',
                    card: 'bg-sunset-card border-sunset-border',
                    text: 'text-sunset-text-primary',
                    textSecondary: 'text-sunset-text-secondary',
                    accent: 'text-sunset-accent-primary',
                    border: 'border-sunset-border',
                    button: 'bg-sunset-accent-primary hover:bg-sunset-accent-primary/80',
                    tabActive: 'bg-sunset-accent-primary text-white',
                    tabInactive: 'text-sunset-text-secondary hover:text-sunset-text-primary'
                };
            case 'purple':
                return {
                    container: 'bg-purple-bg',
                    card: 'bg-purple-card border-purple-border',
                    text: 'text-purple-text-primary',
                    textSecondary: 'text-purple-text-secondary',
                    accent: 'text-purple-accent-primary',
                    border: 'border-purple-border',
                    button: 'bg-purple-accent-primary hover:bg-purple-accent-primary/80',
                    tabActive: 'bg-purple-accent-primary text-white',
                    tabInactive: 'text-purple-text-secondary hover:text-purple-text-primary'
                };
            default: // dark
                return {
                    container: 'bg-dark-bg',
                    card: 'bg-dark-card border-dark-border',
                    text: 'text-dark-text-primary',
                    textSecondary: 'text-dark-text-secondary',
                    accent: 'text-dark-accent-primary',
                    border: 'border-dark-border',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    tabActive: 'bg-blue-600 text-white',
                    tabInactive: 'text-gray-400 hover:text-gray-200'
                };
        }
    };

    const colors = getGenerationThemeColors();

    const getDeviceClasses = () => {
        switch (previewDevice) {
            case 'tablet':
                return 'w-full max-w-2xl';
            case 'mobile':
                return 'w-full max-w-sm';
            default:
                return 'w-full';
        }
    };

    const handleDownload = () => {
        if (!generatedCode) return;
        
        const blob = new Blob([generatedCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className={`${colors.card} border ${colors.border} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className={`flex items-center space-x-2 ${colors.textSecondary} hover:${colors.text} transition-colors`}
                    >
                        <RiArrowLeftLine className="text-lg" />
                        <span>Back to Generator</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onNewGeneration}
                            className={`${colors.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                        >
                            <RiRefreshLine className="text-lg" />
                            <span>New Generation</span>
                        </button>
                        {generatedCode && (
                            <button
                                onClick={handleDownload}
                                className={`${colors.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                            >
                                <RiDownload2Line className="text-lg" />
                                <span>Download</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className={`${colors.card} border ${colors.border} rounded-lg p-4`}>
                    <h2 className={`text-lg font-semibold ${colors.text} mb-2`}>Your Prompt:</h2>
                    <p className={`${colors.textSecondary} leading-relaxed`}>{prompt}</p>
                </div>
            </div>

            {/* Loading/Error State */}
            {isGenerating && (
                <div className={`${colors.card} border ${colors.border} rounded-xl p-8`}>
                    <ThinkingIndicator />
                </div>
            )}

            {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-6">
                    <h3 className="text-red-400 font-semibold mb-2">Generation Failed</h3>
                    <p className="text-red-300">{error}</p>
                </div>
            )}

            {/* Main Content */}
            {generatedCode && !isGenerating && (
                <div className={`${colors.card} border ${colors.border} rounded-xl overflow-hidden`}>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                                activeTab === 'preview' ? colors.tabActive : colors.tabInactive
                            }`}
                        >
                            <RiEyeLine className="text-lg" />
                            <span>Preview</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                                activeTab === 'code' ? colors.tabActive : colors.tabInactive
                            }`}
                        >
                            <RiCodeSSlashLine className="text-lg" />
                            <span>Code</span>
                        </button>
                    </div>

                    {/* Preview Tab */}
                    {activeTab === 'preview' && (
                        <div className="p-6">
                            {/* Device Toggle */}
                            <div className="flex items-center justify-center space-x-4 mb-6">
                                <button
                                    onClick={() => setPreviewDevice('desktop')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        previewDevice === 'desktop' 
                                            ? 'bg-blue-600 text-white' 
                                            : `${colors.textSecondary} hover:${colors.text}`
                                    }`}
                                >
                                    <FaDesktop />
                                    <span>Desktop</span>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('tablet')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        previewDevice === 'tablet' 
                                            ? 'bg-blue-600 text-white' 
                                            : `${colors.textSecondary} hover:${colors.text}`
                                    }`}
                                >
                                    <FaTabletAlt />
                                    <span>Tablet</span>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('mobile')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        previewDevice === 'mobile' 
                                            ? 'bg-blue-600 text-white' 
                                            : `${colors.textSecondary} hover:${colors.text}`
                                    }`}
                                >
                                    <FaMobile />
                                    <span>Mobile</span>
                                </button>
                            </div>

                            {/* Preview Frame */}
                            <div className="flex justify-center">
                                <div className={`${getDeviceClasses()} transition-all duration-300`}>
                                    <iframe
                                        srcDoc={generatedCode}
                                        className="w-full h-[600px] border border-gray-600 rounded-lg"
                                        title="Generated Page Preview"
                                        sandbox="allow-scripts allow-same-origin"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Code Tab */}
                    {activeTab === 'code' && (
                        <div className="h-[600px]">
                            <CodeEditor 
                                code={generatedCode} 
                                onChange={onCodeUpdate}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GenerationView;
