import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CodeEditor from './visualize/CodeEditor';

const AdvancedCodeAnalysisPage = () => {
    const { currentTheme } = useTheme();
    const [code, setCode] = useState(`def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Calculate fibonacci numbers
for i in range(10):
    result = fibonacci(i)
    print(f"Fibonacci({i}) = {result}")
`);
    const [language, setLanguage] = useState('python');
    const [userLevel, setUserLevel] = useState('intermediate');
    const [analysisResults, setAnalysisResults] = useState(null);
    const [activeTab, setActiveTab] = useState('refactoring');
    const [loading, setLoading] = useState(false);

    const getThemeColors = () => {
        const themes = {
            light: {
                background: 'bg-light-background',
                card: 'bg-light-card',
                text: 'text-light-text-primary',
                textSecondary: 'text-light-text-secondary',
                border: 'border-light-border',
                accent: '#3B82F6',
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444'
            },
            dark: {
                background: 'bg-dark-background',
                card: 'bg-dark-card',
                text: 'text-dark-text-primary',
                textSecondary: 'text-dark-text-secondary',
                border: 'border-dark-border',
                accent: '#60A5FA',
                success: '#34D399',
                warning: '#FBBF24',
                danger: '#F87171'
            },
            forest: {
                background: 'bg-forest-background',
                card: 'bg-forest-card',
                text: 'text-forest-text-primary',
                textSecondary: 'text-forest-text-secondary',
                border: 'border-forest-border',
                accent: '#059669',
                success: '#10B981',
                warning: '#D97706',
                danger: '#DC2626'
            },
            sunset: {
                background: 'bg-sunset-background',
                card: 'bg-sunset-card',
                text: 'text-sunset-text-primary',
                textSecondary: 'text-sunset-text-secondary',
                border: 'border-sunset-border',
                accent: '#EA580C',
                success: '#16A34A',
                warning: '#CA8A04',
                danger: '#DC2626'
            },
            purple: {
                background: 'bg-purple-background',
                card: 'bg-purple-card',
                text: 'text-purple-text-primary',
                textSecondary: 'text-purple-text-secondary',
                border: 'border-purple-border',
                accent: '#7C3AED',
                success: '#059669',
                warning: '#D97706',
                danger: '#DC2626'
            }
        };
        return themes[currentTheme] || themes.dark;
    };

    const colors = getThemeColors();

    const analyzeCode = async (analysisType) => {
        setLoading(true);
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            let endpoint = '';
            let payload = {
                code,
                language,
                user_level: userLevel
            };

            switch (analysisType) {
                case 'refactoring':
                    endpoint = '/api/refactor-code';
                    break;
                case 'security':
                    endpoint = '/api/security-analysis';
                    break;
                case 'algorithm':
                    endpoint = '/api/explain-algorithm';
                    break;
                case 'responsive':
                    endpoint = '/api/make-responsive';
                    payload.component_type = 'web';
                    break;
                default:
                    endpoint = '/api/refactor-code';
            }

            const response = await fetch(`${backendUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAnalysisResults({ type: analysisType, data });
        } catch (error) {
            console.error('Error analyzing code:', error);
            setAnalysisResults({ 
                type: analysisType, 
                data: null, 
                error: 'Failed to analyze code. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const QualityMetricsCard = ({ metrics }) => (
        <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
            <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Code Quality Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(metrics).map(([key, value]) => {
                    const percentage = Math.round(value * 100);
                    const getColor = (score) => {
                        if (score >= 80) return colors.success;
                        if (score >= 60) return colors.warning;
                        return colors.danger;
                    };

                    return (
                        <div key={key} className="text-center">
                            <div 
                                className="text-2xl font-bold mb-1"
                                style={{ color: getColor(percentage) }}
                            >
                                {percentage}%
                            </div>
                            <div className={`${colors.textSecondary} text-sm capitalize`}>
                                {key.replace('_', ' ')}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: getColor(percentage)
                                    }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const RefactoringSuggestionCard = ({ suggestion }) => {
        const getPriorityColor = (priority) => {
            switch (priority) {
                case 'critical': return colors.danger;
                case 'high': return colors.warning;
                case 'medium': return colors.accent;
                case 'low': return colors.success;
                default: return colors.accent;
            }
        };

        const getDifficultyIcon = (difficulty) => {
            switch (difficulty) {
                case 'beginner': return '🟢';
                case 'intermediate': return '🟡';
                case 'advanced': return '🔴';
                default: return '⚪';
            }
        };

        return (
            <div className={`${colors.card} border ${colors.border} rounded-lg p-6 mb-4`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <h4 className={`${colors.text} font-semibold mr-3`}>{suggestion.title}</h4>
                            <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ 
                                    backgroundColor: getPriorityColor(suggestion.priority) + '20',
                                    color: getPriorityColor(suggestion.priority)
                                }}
                            >
                                {suggestion.priority}
                            </span>
                            <span className="ml-2" title={`${suggestion.difficulty} level`}>
                                {getDifficultyIcon(suggestion.difficulty)}
                            </span>
                        </div>
                        <p className={`${colors.textSecondary} mb-3`}>{suggestion.description}</p>
                    </div>
                    <div className={`${colors.textSecondary} text-sm`}>
                        ⏱️ {suggestion.estimated_time}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h5 className={`${colors.text} font-medium mb-2`}>Before:</h5>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{suggestion.code_before}</code>
                        </pre>
                    </div>
                    <div>
                        <h5 className={`${colors.text} font-medium mb-2`}>After:</h5>
                        <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                            <code>{suggestion.code_after}</code>
                        </pre>
                    </div>
                </div>

                <div className="mb-3">
                    <h5 className={`${colors.text} font-medium mb-2`}>Explanation:</h5>
                    <p className={`${colors.textSecondary} text-sm`}>{suggestion.explanation}</p>
                </div>

                <div className="mb-3">
                    <h5 className={`${colors.text} font-medium mb-2`}>Benefits:</h5>
                    <ul className="list-disc list-inside">
                        {suggestion.benefits.map((benefit, index) => (
                            <li key={index} className={`${colors.textSecondary} text-sm`}>{benefit}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                    <h6 className="text-blue-800 font-medium text-sm mb-1">Learning Opportunity:</h6>
                    <p className="text-blue-700 text-sm">{suggestion.learning_opportunity}</p>
                </div>
            </div>
        );
    };

    const SecurityIssueCard = ({ issue }) => {
        const getSeverityColor = (severity) => {
            switch (severity) {
                case 'critical': return colors.danger;
                case 'high': return colors.warning;
                case 'medium': return colors.accent;
                case 'low': return colors.success;
                default: return colors.accent;
            }
        };

        return (
            <div className={`${colors.card} border ${colors.border} rounded-lg p-6 mb-4`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <h4 className={`${colors.text} font-semibold mr-3`}>{issue.title}</h4>
                            <span 
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ 
                                    backgroundColor: getSeverityColor(issue.severity) + '20',
                                    color: getSeverityColor(issue.severity)
                                }}
                            >
                                {issue.severity}
                            </span>
                            {issue.cwe_id && (
                                <span className={`${colors.textSecondary} text-xs ml-2`}>
                                    {issue.cwe_id}
                                </span>
                            )}
                        </div>
                        <p className={`${colors.textSecondary} mb-2`}>{issue.description}</p>
                        <p className={`${colors.textSecondary} text-sm`}>Location: {issue.location}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <h5 className={`${colors.text} font-medium mb-2`}>Code Snippet:</h5>
                    <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto border-l-4 border-red-400">
                        <code>{issue.code_snippet}</code>
                    </pre>
                </div>

                <div className="mb-4">
                    <h5 className={`${colors.text} font-medium mb-2`}>Recommendation:</h5>
                    <p className={`${colors.textSecondary} text-sm`}>{issue.recommendation}</p>
                </div>

                <div className="mb-3">
                    <h5 className={`${colors.text} font-medium mb-2`}>Fix Example:</h5>
                    <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                        <code>{issue.fix_example}</code>
                    </pre>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                    <h6 className="text-blue-800 font-medium text-sm mb-1">Learn More:</h6>
                    <p className="text-blue-700 text-sm">{issue.learning_resource}</p>
                </div>
            </div>
        );
    };

    const AlgorithmExplanationCard = ({ explanation }) => (
        <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
            <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Algorithm Analysis</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h4 className={`${colors.text} font-medium mb-2`}>Algorithm Details</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className={`${colors.textSecondary}`}>Name:</span>
                            <span className={`${colors.text} font-medium`}>{explanation.algorithm_explanation.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={`${colors.textSecondary}`}>Type:</span>
                            <span className={`${colors.text} font-medium`}>{explanation.algorithm_explanation.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={`${colors.textSecondary}`}>Time Complexity:</span>
                            <span className={`${colors.text} font-medium`}>{explanation.algorithm_explanation.time_complexity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={`${colors.textSecondary}`}>Space Complexity:</span>
                            <span className={`${colors.text} font-medium`}>{explanation.algorithm_explanation.space_complexity}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 className={`${colors.text} font-medium mb-2`}>Purpose</h4>
                    <p className={`${colors.textSecondary} text-sm`}>{explanation.algorithm_explanation.purpose}</p>
                </div>
            </div>

            <div className="mb-6">
                <h4 className={`${colors.text} font-medium mb-2`}>Description</h4>
                <p className={`${colors.textSecondary}`}>{explanation.algorithm_explanation.description}</p>
            </div>

            <div className="mb-6">
                <h4 className={`${colors.text} font-medium mb-2`}>Key Concepts</h4>
                <div className="flex flex-wrap gap-2">
                    {explanation.algorithm_explanation.key_concepts.map((concept, index) => (
                        <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                            {concept}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h4 className={`${colors.text} font-medium mb-2`}>Step-by-Step Flow</h4>
                <div className="space-y-3">
                    {explanation.code_flow.slice(0, 5).map((step) => (
                        <div key={step.step} className="border-l-4 border-blue-400 pl-4">
                            <div className="flex items-center mb-1">
                                <span className={`${colors.text} font-medium text-sm`}>
                                    Step {step.step} (Line {step.line}):
                                </span>
                                <span className={`${colors.textSecondary} text-xs ml-2`}>
                                    {step.complexity}
                                </span>
                            </div>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{step.code}</code>
                            <p className={`${colors.textSecondary} text-sm mt-1`}>{step.explanation}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h4 className={`${colors.text} font-medium mb-2`}>Learning Objectives</h4>
                <ul className="list-disc list-inside space-y-1">
                    {explanation.algorithm_explanation.learning_objectives.map((objective, index) => (
                        <li key={index} className={`${colors.textSecondary} text-sm`}>{objective}</li>
                    ))}
                </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 className={`${colors.text} font-medium mb-2`}>Common Mistakes</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {explanation.algorithm_explanation.common_mistakes.map((mistake, index) => (
                            <li key={index} className={`${colors.textSecondary} text-sm`}>{mistake}</li>
                        ))}
                    </ul>
                </div>
                
                <div>
                    <h4 className={`${colors.text} font-medium mb-2`}>Real-world Applications</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {explanation.algorithm_explanation.real_world_applications.map((app, index) => (
                            <li key={index} className={`${colors.textSecondary} text-sm`}>{app}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`${colors.background} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className={`${colors.text} text-3xl font-bold mb-2`}>Advanced Code Analysis</h1>
                    <p className={`${colors.textSecondary}`}>
                        Comprehensive code analysis for refactoring, security, performance, and learning
                    </p>
                </div>

                {/* Controls */}
                <div className={`${colors.card} border ${colors.border} rounded-lg p-6 mb-6`}>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className={`${colors.text} block text-sm font-medium mb-2`}>
                                Programming Language
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className={`w-full p-2 border ${colors.border} rounded-lg ${colors.text}`}
                            >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                            </select>
                        </div>
                        <div>
                            <label className={`${colors.text} block text-sm font-medium mb-2`}>
                                Your Skill Level
                            </label>
                            <select
                                value={userLevel}
                                onChange={(e) => setUserLevel(e.target.value)}
                                className={`w-full p-2 border ${colors.border} rounded-lg ${colors.text}`}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                    onClick={() => analyzeCode('refactoring')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                                >
                                    {loading ? '⏳' : '🔧'} Refactor
                                </button>
                                <button
                                    onClick={() => analyzeCode('security')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                                >
                                    {loading ? '⏳' : '🔒'} Security
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2">
                        <button
                            onClick={() => analyzeCode('algorithm')}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '⏳' : '📊'} Explain Algorithm
                        </button>
                        <button
                            onClick={() => analyzeCode('responsive')}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '⏳' : '📱'} Make Responsive
                        </button>
                    </div>
                </div>

                {/* Code Editor and Results */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Code Editor */}
                    <div className="space-y-4">
                        <h2 className={`${colors.text} text-xl font-semibold`}>Code Editor</h2>
                        <div style={{ height: '500px' }}>
                            <CodeEditor
                                code={code}
                                onChange={setCode}
                                language={language}
                            />
                        </div>
                    </div>

                    {/* Analysis Results */}
                    <div className="space-y-4">
                        <h2 className={`${colors.text} text-xl font-semibold`}>Analysis Results</h2>
                        <div style={{ height: '500px', overflowY: 'auto' }}>
                            {loading ? (
                                <div className={`${colors.card} border ${colors.border} rounded-lg p-6 text-center`}>
                                    <div className="animate-spin text-2xl mb-2">⏳</div>
                                    <p className={`${colors.text}`}>Analyzing your code...</p>
                                </div>
                            ) : analysisResults ? (
                                <div className="space-y-4">
                                    {analysisResults.error ? (
                                        <div className={`${colors.card} border border-red-300 rounded-lg p-6 text-center`}>
                                            <div className="text-red-500 text-xl mb-2">⚠️</div>
                                            <p className="text-red-600">{analysisResults.error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {analysisResults.type === 'refactoring' && analysisResults.data && (
                                                <>
                                                    <QualityMetricsCard metrics={analysisResults.data.quality_metrics} />
                                                    <div>
                                                        <h3 className={`${colors.text} text-lg font-semibold mb-4`}>
                                                            Refactoring Suggestions
                                                        </h3>
                                                        {analysisResults.data.refactoring_suggestions.map((suggestion, index) => (
                                                            <RefactoringSuggestionCard key={index} suggestion={suggestion} />
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {analysisResults.type === 'security' && analysisResults.data && (
                                                <>
                                                    <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                                                        <h3 className={`${colors.text} text-lg font-semibold mb-4`}>
                                                            Security Summary
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-4 text-center">
                                                            <div>
                                                                <div className={`${colors.text} text-2xl font-bold`}>
                                                                    {analysisResults.data.security_summary.security_score}
                                                                </div>
                                                                <div className={`${colors.textSecondary} text-sm`}>Security Score</div>
                                                            </div>
                                                            <div>
                                                                <div className={`${colors.text} text-2xl font-bold`}>
                                                                    {analysisResults.data.security_summary.total_issues}
                                                                </div>
                                                                <div className={`${colors.textSecondary} text-sm`}>Total Issues</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {analysisResults.data.security_issues.length > 0 && (
                                                        <div>
                                                            <h3 className={`${colors.text} text-lg font-semibold mb-4`}>
                                                                Security Issues
                                                            </h3>
                                                            {analysisResults.data.security_issues.map((issue, index) => (
                                                                <SecurityIssueCard key={index} issue={issue} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {analysisResults.type === 'algorithm' && analysisResults.data && (
                                                <AlgorithmExplanationCard explanation={analysisResults.data} />
                                            )}

                                            {analysisResults.type === 'responsive' && analysisResults.data && (
                                                <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                                                    <h3 className={`${colors.text} text-lg font-semibold mb-4`}>
                                                        Responsive Design Suggestions
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {analysisResults.data.responsive_suggestions.map((suggestion, index) => (
                                                            <li key={index} className={`${colors.textSecondary} text-sm`}>
                                                                • {suggestion}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className={`${colors.card} border ${colors.border} rounded-lg p-6 text-center`}>
                                    <div className={`${colors.textSecondary} text-lg mb-2`}>🔍</div>
                                    <p className={`${colors.textSecondary}`}>
                                        Select an analysis type to get started. Your code will be analyzed for improvements, 
                                        security issues, algorithm understanding, and more.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedCodeAnalysisPage;
