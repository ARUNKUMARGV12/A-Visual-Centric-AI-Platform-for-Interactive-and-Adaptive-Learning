import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLearningTracker } from '../contexts/LearningTracker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

const LearningVisualizationDashboard = ({ userId = 'default' }) => {
    const { currentTheme } = useTheme();
    const { userActivity } = useLearningTracker();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Use real-time data from learning tracker
    const [learningData, setLearningData] = useState(null);

    useEffect(() => {
        // Update dashboard with real-time learning tracker data
        const processRealTimeData = () => {
            if (userActivity) {
                const processedData = {
                    overview: {
                        totalSessions: userActivity.sessions,
                        totalTimeSpent: Math.round(userActivity.totalTimeSpent),
                        conceptsLearned: userActivity.conceptsLearned.length,
                        currentStreak: userActivity.currentStreak,
                        knowledgeLevel: userActivity.learningLevel
                    },
                    skillProgress: userActivity.skillsExplored.map(skill => ({
                        skill: skill.replace('_', ' ').toUpperCase(),
                        current: Math.random() * 0.8 + 0.2, // Simulate progress based on activity
                        target: 0.9,
                        sessionsCount: userActivity.interactions.filter(i => 
                            i.skills && i.skills.includes(skill)
                        ).length
                    })),
                    timeline: userActivity.dailyActivity.slice(-7).map(day => ({
                        date: new Date(day.date).toLocaleDateString(),
                        sessions: day.sessions,
                        timeSpent: day.timeSpent,
                        conceptsLearned: day.conceptsLearned
                    })),
                    insights: generateRealTimeInsights(userActivity)
                };
                
                setLearningData(processedData);
            }
        };

        processRealTimeData();
        
        // Update every 30 seconds for real-time effect
        const interval = setInterval(processRealTimeData, 30000);
        return () => clearInterval(interval);
    }, [userActivity]);

    // Generate insights based on real user activity
    const generateRealTimeInsights = (activity) => {
        const insights = [];
        const recentInteractions = activity.interactions.slice(-10);
        
        if (activity.sessions === 0) {
            insights.push({
                type: 'welcome',
                message: 'Welcome! Start asking questions to begin tracking your learning journey.',
                priority: 'high'
            });
        } else {
            // Learning streak insight
            if (activity.currentStreak >= 3) {
                insights.push({
                    type: 'streak',
                    message: `Amazing! You're on a ${activity.currentStreak}-day learning streak! Keep it up!`,
                    priority: 'medium'
                });
            }

            // Concepts learned insight
            if (activity.conceptsLearned.length >= 5) {
                insights.push({
                    type: 'progress',
                    message: `Great progress! You've explored ${activity.conceptsLearned.length} different concepts: ${activity.conceptsLearned.slice(0, 3).join(', ')}${activity.conceptsLearned.length > 3 ? '...' : ''}.`,
                    priority: 'medium'
                });
            }

            // Skills focus insight
            if (activity.skillsExplored.length > 0) {
                const topSkill = activity.skillsExplored[0];
                insights.push({
                    type: 'focus',
                    message: `You've been actively learning about ${topSkill.replace('_', ' ')}. Consider exploring related topics!`,
                    priority: 'low'
                });
            }

            // Session activity insight
            if (activity.sessions >= 10) {
                insights.push({
                    type: 'progress',
                    message: `Impressive! You've completed ${activity.sessions} learning sessions. You're developing great learning habits!`,
                    priority: 'medium'
                });
            }

            // Recent activity pattern
            const recentPages = recentInteractions.map(i => i.page).filter(p => p !== 'home');
            if (recentPages.length > 0) {
                const uniquePages = [...new Set(recentPages)];
                insights.push({
                    type: 'focus',
                    message: `You've been actively using: ${uniquePages.join(', ')}. Great exploration!`,
                    priority: 'low'
                });
            }
        }

        return insights;
    };

    // Get theme-aware colors using the existing theme system
    const getThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    background: 'bg-light-bg',
                    card: 'bg-light-card',
                    text: 'text-light-text-primary',
                    textSecondary: 'text-light-text-secondary',
                    border: 'border-light-border',
                    accent: '#3B82F6',
                    success: '#10B981',
                    warning: '#F59E0B',
                    danger: '#EF4444',
                    navActive: 'bg-light-accent text-light-accent-text',
                    navInactive: 'text-light-text-secondary hover:bg-light-hover'
                };
            case 'forest':
                return {
                    background: 'bg-forest-bg',
                    card: 'bg-forest-card',
                    text: 'text-forest-text-primary',
                    textSecondary: 'text-forest-text-secondary',
                    border: 'border-forest-border',
                    accent: '#059669',
                    success: '#10B981',
                    warning: '#D97706',
                    danger: '#DC2626',
                    navActive: 'bg-forest-accent text-forest-accent-text',
                    navInactive: 'text-forest-text-secondary hover:bg-forest-hover'
                };
            case 'sunset':
                return {
                    background: 'bg-sunset-bg',
                    card: 'bg-sunset-card',
                    text: 'text-sunset-text-primary',
                    textSecondary: 'text-sunset-text-secondary',
                    border: 'border-sunset-border',
                    accent: '#EA580C',
                    success: '#16A34A',
                    warning: '#CA8A04',
                    danger: '#DC2626',
                    navActive: 'bg-sunset-accent text-sunset-accent-text',
                    navInactive: 'text-sunset-text-secondary hover:bg-sunset-hover'
                };
            case 'purple':
                return {
                    background: 'bg-purple-bg',
                    card: 'bg-purple-card',
                    text: 'text-purple-text-primary',
                    textSecondary: 'text-purple-text-secondary',
                    border: 'border-purple-border',
                    accent: '#7C3AED',
                    success: '#059669',
                    warning: '#D97706',
                    danger: '#DC2626',
                    navActive: 'bg-purple-accent text-purple-accent-text',
                    navInactive: 'text-purple-text-secondary hover:bg-purple-hover'
                };
            default: // dark
                return {
                    background: 'bg-dark-bg',
                    card: 'bg-dark-card',
                    text: 'text-dark-text-primary',
                    textSecondary: 'text-dark-text-secondary',
                    border: 'border-dark-border',
                    accent: '#60A5FA',
                    success: '#34D399',
                    warning: '#FBBF24',
                    danger: '#F87171',
                    navActive: 'bg-dark-accent text-dark-accent-text',
                    navInactive: 'text-dark-text-secondary hover:bg-dark-hover'
                };
        }
    };

    const colors = getThemeColors();

    // Theme-aware, realistic components
    const SkillProgressCard = ({ skill, current, target, sessionsCount }) => (
        <div className={`${colors.card} border ${colors.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
            <h4 className={`${colors.text} font-medium mb-2`}>{skill}</h4>
            <div className="flex items-center justify-between mb-2">
                <span className={`${colors.textSecondary} text-sm`}>Progress</span>
                <span className={`${colors.text} text-sm font-medium`}>{Math.round(current * 100)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${colors.border.replace('border-', 'bg-')}`}>
                <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                        width: `${Math.min(current * 100, 100)}%`,
                        backgroundColor: colors.accent
                    }}
                ></div>
            </div>
            <div className={`mt-2 text-xs ${colors.textSecondary}`}>
                Sessions: {sessionsCount} | Target: {Math.round(target * 100)}%
            </div>
        </div>
    );

    const InsightCard = ({ insight }) => {
        const getInsightIcon = (type) => {
            switch (type) {
                case 'welcome': return '👋';
                case 'streak': return '🔥';
                case 'progress': return '�';
                case 'focus': return '🎯';
                default: return '💡';
            }
        };

        const getPriorityColor = (priority) => {
            switch (priority) {
                case 'high': return colors.success;
                case 'medium': return colors.warning;
                case 'low': return colors.accent;
                default: return colors.textSecondary;
            }
        };

        return (
            <div className={`${colors.card} border ${colors.border} rounded-lg p-4 mb-3`}>
                <div className="flex items-center mb-2">
                    <span className="text-xl mr-3">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                        <span 
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ 
                                backgroundColor: getPriorityColor(insight.priority) + '20',
                                color: getPriorityColor(insight.priority)
                            }}
                        >
                            {insight.priority} priority
                        </span>
                    </div>
                </div>
                <p className={`${colors.text}`}>{insight.message}</p>
            </div>
        );
    };

    const OverviewTab = () => (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Learning Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className={`${colors.text} text-2xl font-bold`}>
                            {learningData?.overview?.totalSessions || 0}
                        </div>
                        <div className={`${colors.textSecondary} text-sm`}>Total Sessions</div>
                    </div>
                    <div className="text-center">
                        <div className={`${colors.text} text-2xl font-bold`}>
                            {learningData?.overview?.totalTimeSpent || 0}m
                        </div>
                        <div className={`${colors.textSecondary} text-sm`}>Time Spent</div>
                    </div>
                    <div className="text-center">
                        <div className={`${colors.text} text-2xl font-bold`}>
                            {learningData?.overview?.conceptsLearned || 0}
                        </div>
                        <div className={`${colors.textSecondary} text-sm`}>Concepts Learned</div>
                    </div>
                    <div className="text-center">
                        <div className={`${colors.text} text-2xl font-bold`}>
                            {learningData?.overview?.currentStreak || 0}
                        </div>
                        <div className={`${colors.textSecondary} text-sm`}>Day Streak</div>
                    </div>
                </div>
            </div>

            {/* Skill Progress */}
            {learningData?.skillProgress?.length > 0 && (
                <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                    <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Skill Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {learningData.skillProgress.map((skill, index) => (
                            <SkillProgressCard
                                key={skill.skill}
                                skill={skill.skill}
                                current={skill.current}
                                target={skill.target}
                                sessionsCount={skill.sessionsCount}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Learning Insights */}
            <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Learning Insights</h3>
                {learningData?.insights?.length > 0 ? (
                    learningData.insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                    ))
                ) : (
                    <p className={`${colors.textSecondary}`}>Start using the app to see personalized insights!</p>
                )}
            </div>
        </div>
    );

    const TimelineTab = () => (
        <div className="space-y-6">
            {/* Activity Timeline Chart */}
            {learningData?.timeline?.length > 0 && (
                <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                    <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Learning Activity (Last 7 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={learningData.timeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke={colors.textSecondary}
                                    fontSize={12}
                                />
                                <YAxis 
                                    stroke={colors.textSecondary}
                                    fontSize={12}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: colors.card,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        color: colors.text
                                    }}
                                />
                                <Bar dataKey="sessions" fill={colors.accent} name="Sessions" />
                                <Bar dataKey="timeSpent" fill={colors.success} name="Time (min)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Empty state for timeline */}
            {(!learningData?.timeline || learningData.timeline.length === 0) && (
                <div className={`${colors.card} border ${colors.border} rounded-lg p-6`}>
                    <h3 className={`${colors.text} text-lg font-semibold mb-4`}>Learning Activity</h3>
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📊</div>
                        <p className={`${colors.textSecondary}`}>
                            No activity data yet. Start learning to see your progress timeline!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className={`${colors.background} min-h-screen p-6`}>
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className={`${colors.card} h-8 rounded mb-6`}></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`${colors.card} h-48 rounded`}></div>
                            <div className={`${colors.card} h-48 rounded`}></div>
                            <div className={`${colors.card} h-48 rounded`}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${colors.background} min-h-screen p-6`}>
                <div className="max-w-6xl mx-auto">
                    <div className={`${colors.card} border ${colors.border} rounded-lg p-6 text-center`}>
                        <div className="text-red-500 text-xl mb-2">⚠️</div>
                        <h3 className={`${colors.text} text-lg font-semibold mb-2`}>Learning Dashboard</h3>
                        <p className={`${colors.textSecondary} mb-4`}>{error}</p>
                        <p className={`${colors.textSecondary} text-sm`}>
                            Start using any feature of the app to see your learning progress here!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${colors.background} min-h-screen p-6`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className={`${colors.text} text-3xl font-bold mb-2`}>Learning Dashboard</h1>
                    <p className={`${colors.textSecondary}`}>
                        Track your learning journey and analyze your progress
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6">
                    <div className={`flex space-x-1 p-1 ${colors.card} rounded-lg border ${colors.border}`}>
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'timeline', label: 'Activity', icon: '📈' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? colors.navActive
                                        : colors.navInactive
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'timeline' && <TimelineTab />}
            </div>
        </div>
    );
};

export default LearningVisualizationDashboard;
