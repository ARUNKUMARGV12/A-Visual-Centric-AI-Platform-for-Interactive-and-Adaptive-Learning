import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FaMicrophone, FaStop, FaSpinner, FaRobot, FaUser, FaExclamationTriangle, FaHandPaper, FaPause, FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useLearningTracker } from '../contexts/LearningTracker';

const VOICE_ASSISTANT_CONVERSATION_LOG = 'voiceAssistantConversationLog';
const VOICE_ASSISTANT_API_HISTORY = 'voiceAssistantApiHistory';

// Initialize SpeechRecognition with browser prefixes
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const Message = React.memo(({ message }) => {
    const { currentTheme } = useTheme();
    
    const formatAssistantMessage = (rawText) => {
        if (!rawText) return { __html: '' };

        let html = rawText;

        // Dynamic color based on theme
        const accentColor = currentTheme === 'light' ? 'text-light-accent-primary' : 
                           currentTheme === 'forest' ? 'text-forest-accent-primary' : 
                           currentTheme === 'sunset' ? 'text-sunset-accent-primary' : 
                           currentTheme === 'purple' ? 'text-purple-accent-primary' : 'text-dark-accent-primary';

        // Process headers like "Title:" or "**Title:**"
        html = html.replace(/^\s*(\*\*.*?\*\*):\s*$/gm, `<h3 class="font-semibold ${accentColor} mt-3 mb-1">$1</h3>`);
        html = html.replace(/^\s*([A-Za-z\s()]+):\s*$/gm, `<h3 class="font-semibold ${accentColor} mt-3 mb-1">$1:</h3>`);

        // Process bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Process lists, including multiple items on one line
        const lines = html.split('\n');
        const processedLines = lines.map(line => {
            if (line.trim().startsWith('*')) {
                // Split by ", *" to handle multiple items on one line
                const items = line.trim().substring(1).split(/,?\s*\*\s*/).map(item => item.trim()).filter(Boolean);
                return '<ul>' + items.map(item => `<li class="ml-5 list-disc">${item}</li>`).join('') + '</ul>';
            }
            return line;
        });

        html = processedLines.join('\n').replace(/<\/ul>\n<ul>/g, '');
        html = html.replace(/\n/g, '<br />');

        return { __html: html };
    };

    // Theme-aware message styling
    const getMessageClasses = () => {
        const baseClasses = 'mb-4 p-3 rounded-lg shadow-md flex items-start';
        
        if (message.role === 'user') {
            const userBg = currentTheme === 'light' ? 'bg-light-accent-primary/80' : 
                          currentTheme === 'forest' ? 'bg-forest-accent-primary/80' : 
                          currentTheme === 'sunset' ? 'bg-sunset-accent-primary/80' : 
                          currentTheme === 'purple' ? 'bg-purple-accent-primary/80' : 'bg-dark-accent-primary/80';
            return `${baseClasses} ml-auto max-w-[85%] ${userBg} text-white rounded-br-none`;
        } else if (message.role === 'assistant') {
            const assistantBg = currentTheme === 'light' ? 'bg-light-card border border-light-border' : 
                               currentTheme === 'forest' ? 'bg-forest-card border border-forest-border' : 
                               currentTheme === 'sunset' ? 'bg-sunset-card border border-sunset-border' : 
                               currentTheme === 'purple' ? 'bg-purple-card border border-purple-border' : 'bg-dark-card border border-dark-border';
            const textColor = currentTheme === 'light' ? 'text-light-text-primary' : 'text-white';
            return `${baseClasses} mr-auto max-w-[85%] ${assistantBg} ${textColor} rounded-bl-none`;
        } else {
            const systemBg = currentTheme === 'light' ? 'bg-light-accent-warning/50' : 'bg-yellow-600/50';
            const textColor = currentTheme === 'light' ? 'text-light-text-primary' : 'text-yellow-200';
            return `${baseClasses} mx-auto max-w-[90%] ${systemBg} ${textColor} italic text-sm`;
        }
    };

    const getIconColor = () => {
        if (message.role === 'user') return 'text-white';
        if (message.role === 'assistant') {
            return currentTheme === 'light' ? 'text-light-text-secondary' : 'text-gray-300';
        }
        return currentTheme === 'light' ? 'text-light-accent-warning' : 'text-yellow-300';
    };

    return (
        <div className={getMessageClasses()}>
            <div className="mr-3 flex-shrink-0 mt-1">
                {message.role === 'user' ? <FaUser className={`h-5 w-5 ${getIconColor()}`} /> : message.role === 'assistant' ? <FaRobot className={`h-5 w-5 ${getIconColor()}`} /> : <FaExclamationTriangle className={`h-5 w-5 ${getIconColor()}`} />}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm mb-1 capitalize">
                    {message.role}
                </p>
                {message.role === 'assistant' ? (
                    <div className="text-base" dangerouslySetInnerHTML={formatAssistantMessage(message.text)} />
                ) : (
                    <p className="text-base whitespace-pre-wrap">{message.text}</p>
                )}
                {message.role === 'assistant' && message.code_block && (
                    <pre className={`mt-2 p-3 rounded-md overflow-x-auto text-sm font-mono ${
                        currentTheme === 'light' ? 'bg-gray-100 text-gray-800' : 
                        currentTheme === 'forest' ? 'bg-black/40 text-forest-accent-secondary' : 
                        currentTheme === 'sunset' ? 'bg-black/40 text-sunset-accent-secondary' : 
                        currentTheme === 'purple' ? 'bg-black/40 text-purple-accent-secondary' : 'bg-gray-900 text-green-300'
                    }`}>
                        <code>{message.code_block}</code>
                    </pre>
                )}
                {message.role === 'assistant' && message.code_explanation && (
                    <p className={`mt-2 italic text-sm ${
                        currentTheme === 'light' ? 'text-light-text-secondary' : 'text-gray-400'
                    }`}>
                        {message.code_explanation}
                    </p>
                )}
            </div>
        </div>
    );
});

const VoiceAssistantPage = () => {
    const { currentTheme } = useTheme();
    const { trackLearningActivity } = useLearningTracker();
    
    const [state, setState] = useState({
        isConversationActive: false,
        isListening: false,
        isAssistantSpeaking: false,
        isPaused: false,
        status: 'Ready. Click the mic to start.',
        error: ''
    });
    
    const [conversationLog, setConversationLog] = useState(() => {
        const saved = localStorage.getItem(VOICE_ASSISTANT_CONVERSATION_LOG);
        return saved ? JSON.parse(saved) : [];
    });
    
    const [apiChatHistory, setApiChatHistory] = useState(() => {
        const saved = localStorage.getItem(VOICE_ASSISTANT_API_HISTORY);
        return saved ? JSON.parse(saved) : [];
    });
    const [voices, setVoices] = useState([]);
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const containerRef = useRef(null);

    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const apiChatHistoryRef = useRef(apiChatHistory);
    useEffect(() => {
        apiChatHistoryRef.current = apiChatHistory;
    }, [apiChatHistory]);

    const refs = {
        recognition: useRef(null),
        audioContext: useRef(null),
        lastFinalTranscript: useRef(''),
        conversationEnd: useRef(null),
        interruption: useRef(false)
    };

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const handleError = useCallback((message, err) => {
        console.error(message, err);
        setState(prev => ({
            ...prev,
            error: message,
            status: `Error: ${message.substring(0, 50)}...`,
            isListening: false,
            isAssistantSpeaking: false,
        }));
    }, []);

    const handleStopTalking = async () => {
        if (state.isAssistantSpeaking) {
            window.speechSynthesis.cancel();
            refs.interruption.current = true;

            setState(prev => ({
                ...prev,
                isAssistantSpeaking: false,
                isPaused: false,
                status: 'Speech stopped by user.'
            }));

            try {
                await fetch('http://localhost:8000/stop-talking', { method: 'POST' });
            } catch (error) {
                console.error('Failed to notify backend of interruption:', error);
            }
        }
    };

    const handlePauseTalking = () => {
        if (state.isAssistantSpeaking && !state.isPaused) {
            window.speechSynthesis.pause();
            setState(prev => ({ ...prev, isPaused: true, status: 'Speech paused.' }));
        }
    };

    const handleResumeTalking = () => {
        if (state.isAssistantSpeaking && state.isPaused) {
            window.speechSynthesis.resume();
            setState(prev => ({ ...prev, isPaused: false, status: 'Assistant is speaking...' }));
        }
    };

    const synthesis = useMemo(() => ({
        speak: (text, onEnd) => {
            if (!text || voices.length === 0) {
                if (onEnd) onEnd();
                return;
            }

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const cleanedText = text.replace(/[*_#`]/g, '').trim();
                const sentences = cleanedText.match(/[^.?!]+[.?!]*/g) || [cleanedText];

                if (sentences.length === 0 || !sentences[0]) {
                    if (onEnd) onEnd();
                    return;
                }

                const utterances = sentences.map(sentence => {
                    const utterance = new SpeechSynthesisUtterance(sentence.trim());
                    const enUsVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || 
                                      voices.find(v => v.lang === 'en-US' && v.name.includes('Zira')) || 
                                      voices.find(v => v.lang === 'en-US');

                    if (enUsVoice) {
                        utterance.voice = enUsVoice;
                    } else {
                        console.warn("No 'en-US' voice found, using browser default.");
                    }

                    utterance.lang = 'en-US';
                    let rate = 1.0;
                    let pitch = 1.0;
                    const lowerCaseSentence = sentence.toLowerCase();

                    if (sentence.includes('?')) {
                        pitch = 1.2;
                    } else if (sentence.includes('!')) {
                        pitch = 1.1;
                        rate = 1.1;
                    } else if (lowerCaseSentence.includes('sorry') || lowerCaseSentence.includes('apologize')) {
                        pitch = 0.9;
                        rate = 0.9;
                    } else if (lowerCaseSentence.includes('excellent') || lowerCaseSentence.includes('wonderful') || lowerCaseSentence.includes('great')) {
                        pitch = 1.1;
                        rate = 1.1;
                    }

                    utterance.rate = rate;
                    utterance.pitch = pitch;
                    
                    return utterance;
                });

                if (utterances.length > 0) {
                    utterances[0].onstart = () => {
                        refs.interruption.current = false;
                        setState(prev => ({
                            ...prev,
                            isAssistantSpeaking: true,
                            status: 'Assistant is speaking...'
                        }));
                        if (refs.recognition.current && stateRef.current.isListening) {
                            refs.recognition.current.stop();
                        }
                    };

                    utterances[utterances.length - 1].onend = () => {
                        if (refs.interruption.current) {
                            refs.interruption.current = false;
                            return;
                        }

                        setState(prev => ({
                            ...prev,
                            isAssistantSpeaking: false,
                            isPaused: false,
                            status: 'Listening for your response...'
                        }));

                        if (onEnd) {
                            onEnd();
                        } else if (stateRef.current.isConversationActive && refs.recognition.current) {
                            setTimeout(() => {
                                try {
                                    refs.recognition.current.start();
                                } catch (e) {
                                    if (e.name !== 'InvalidStateError') {
                                        console.error("Error restarting recognition:", e);
                                    }
                                }
                            }, 100);
                        }
                    };
                }

                utterances.forEach(utterance => window.speechSynthesis.speak(utterance));
            }
        }
    }), [voices]);

    const processTranscript = useCallback(async (userSaid) => {
        if (!userSaid || !userSaid.trim()) return;

        const newUserMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: userSaid,
        };
        setConversationLog(prev => [...prev, newUserMessage]);
        
        setState(prev => ({
            ...prev,
            status: 'Processing your message...'
        }));

        const newApiUserEntry = { role: "user", parts: [userSaid] };
        const updatedApiHistory = [...apiChatHistoryRef.current, newApiUserEntry];
        setApiChatHistory(updatedApiHistory);

        try {
            const response = await fetch('http://localhost:8000/voice-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: userSaid,
                    chat_history: updatedApiHistory
                })
            });

            if (!response.ok) {
                throw new Error('API response was not ok');
            }

            const data = await response.json();
            const assistantText = data.spoken_response || data.raw_response || 'I apologize, but I am having trouble generating a response. Could you please try again?';
            
            setConversationLog(prev => [...prev, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: assistantText,
                raw_response: data.raw_response,
                code_block: data.code_block,
                code_explanation: data.code_explanation
            }]);

            // Track voice interaction for learning insights
            trackLearningActivity(`voice_conversation: ${userSaid}`, 3);

            if (Array.isArray(data.chat_history)) {
                setApiChatHistory(data.chat_history);
            } else {
                const modelResponse = {
                    role: "model",
                    parts: [data.raw_response || assistantText]
                };
                setApiChatHistory([...updatedApiHistory, modelResponse]);
            }

            synthesis.speak(assistantText);
        } catch (err) {
            console.error('Error processing transcript:', err);
            const errorMessage = 'Sorry, I encountered an error while processing your message. Please try again.';
            
            handleError(errorMessage, err);

            setConversationLog(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'system',
                text: errorMessage
            }]);

            synthesis.speak(errorMessage);
        }
    }, [synthesis, handleError]);

    useEffect(() => {
        if (!SpeechRecognition) {
            handleError("Speech recognition is not supported in this browser.");
            return;
        }

        refs.recognition.current = new SpeechRecognition();
        const rec = refs.recognition.current;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                rec.stop();
                processTranscript(finalTranscript.trim());
            }
        };

        rec.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                handleError(`Speech recognition error: ${event.error}`, event);
            }
            setState(prev => ({ ...prev, isListening: false }));
        };

        rec.onstart = () => {
            setState(prev => ({ ...prev, isListening: true, status: 'Listening...' }));
        };

        rec.onend = () => {
            setState(prev => ({ ...prev, isListening: false }));
        };

        return () => {
            if (refs.recognition.current) {
                refs.recognition.current.abort();
            }
        };
    }, [processTranscript, handleError]);

    useEffect(() => {
        if (refs.conversationEnd.current) {
            refs.conversationEnd.current.scrollIntoView({ behavior: "smooth" });
        }
        localStorage.setItem(VOICE_ASSISTANT_CONVERSATION_LOG, JSON.stringify(conversationLog));
    }, [conversationLog]);

    useEffect(() => {
        localStorage.setItem(VOICE_ASSISTANT_API_HISTORY, JSON.stringify(apiChatHistory));
    }, [apiChatHistory]);

    const toggleConversationMode = useCallback(async () => {
        if (!state.isConversationActive) {
            setState(prev => ({
                ...prev,
                isConversationActive: true,
                status: 'Starting conversation...',
                error: ''
            }));

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                refs.audioContext.current = new AudioContext();
                refs.audioContext.current.createMediaStreamSource(stream);
                
                const welcomeMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    text: "Hello! I'm your voice assistant. How can I help you today?"
                };
                setConversationLog([welcomeMessage]);

                synthesis.speak(welcomeMessage.text, () => {
                    if (refs.recognition.current) {
                        try {
                           refs.recognition.current.start();
                        } catch(e) {
                            if (e.name !== 'InvalidStateError') {
                                console.error("Error starting recognition:", e);
                            }
                        }
                    }
                });

            } catch (err) {
                handleError(err.name === 'NotAllowedError' 
                    ? 'Microphone access denied. Please allow microphone access.'
                    : `Failed to start conversation: ${err.message}`, err);
            }
        } else {
            if (refs.recognition.current) {
                refs.recognition.current.stop();
            }
            if (refs.audioContext.current) {
                refs.audioContext.current.close();
            }
            window.speechSynthesis.cancel();

            setState(prev => ({
                ...prev,
                isConversationActive: false,
                isListening: false,
                isAssistantSpeaking: false,
                status: 'Conversation stopped.',
            }));

            setConversationLog(prev => [...prev, {
                id: `system-${Date.now()}`,
                role: 'system',
                text: 'Conversation ended.'
            }]);
        }
    }, [state.isConversationActive, synthesis, handleError]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    const handleMouseDownOnResizer = (e) => {
        e.preventDefault();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        
        const handleMouseMove = (e_move) => {
            const newWidth = containerRect.right - e_move.clientX;
            const mainContentMinWidth = 400;
            
            if (newWidth >= 320 && (containerRect.width - newWidth) >= mainContentMinWidth) { 
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Theme-aware colors
    const getThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    bg: 'bg-light-bg/95',
                    container: 'bg-light-card',
                    header: 'bg-light-sidebar/80',
                    border: 'border-light-border',
                    text: {
                        primary: 'text-light-text-primary',
                        secondary: 'text-light-text-secondary',
                        accent: 'text-light-accent-primary'
                    },
                    accent: 'bg-light-accent-primary',
                    sidebar: 'bg-light-sidebar/60',
                    listening: 'border-light-accent-success',
                    speaking: 'ring-light-accent-primary',
                    robot: 'text-light-accent-primary',
                    user: 'text-light-text-secondary'
                };
            case 'forest':
                return {
                    bg: 'bg-forest-bg/95',
                    container: 'bg-forest-card',
                    header: 'bg-forest-sidebar/80',
                    border: 'border-forest-border',
                    text: {
                        primary: 'text-forest-text-primary',
                        secondary: 'text-forest-text-secondary',
                        accent: 'text-forest-accent-primary'
                    },
                    accent: 'bg-forest-accent-primary',
                    sidebar: 'bg-forest-sidebar/60',
                    listening: 'border-forest-accent-success',
                    speaking: 'ring-forest-accent-primary',
                    robot: 'text-forest-accent-primary',
                    user: 'text-forest-text-secondary'
                };
            case 'sunset':
                return {
                    bg: 'bg-sunset-bg/95',
                    container: 'bg-sunset-card',
                    header: 'bg-sunset-sidebar/80',
                    border: 'border-sunset-border',
                    text: {
                        primary: 'text-sunset-text-primary',
                        secondary: 'text-sunset-text-secondary',
                        accent: 'text-sunset-accent-primary'
                    },
                    accent: 'bg-sunset-accent-primary',
                    sidebar: 'bg-sunset-sidebar/60',
                    listening: 'border-sunset-accent-success',
                    speaking: 'ring-sunset-accent-primary',
                    robot: 'text-sunset-accent-primary',
                    user: 'text-sunset-text-secondary'
                };
            case 'purple':
                return {
                    bg: 'bg-purple-bg/95',
                    container: 'bg-purple-card',
                    header: 'bg-purple-sidebar/80',
                    border: 'border-purple-border',
                    text: {
                        primary: 'text-purple-text-primary',
                        secondary: 'text-purple-text-secondary',
                        accent: 'text-purple-accent-primary'
                    },
                    accent: 'bg-purple-accent-primary',
                    sidebar: 'bg-purple-sidebar/60',
                    listening: 'border-purple-accent-success',
                    speaking: 'ring-purple-accent-primary',
                    robot: 'text-purple-accent-primary',
                    user: 'text-purple-text-secondary'
                };
            default: // dark
                return {
                    bg: 'bg-dark-bg/95',
                    container: 'bg-dark-card',
                    header: 'bg-dark-sidebar/80',
                    border: 'border-dark-border',
                    text: {
                        primary: 'text-dark-text-primary',
                        secondary: 'text-dark-text-secondary',
                        accent: 'text-dark-accent-primary'
                    },
                    accent: 'bg-dark-accent-primary',
                    sidebar: 'bg-dark-sidebar/60',
                    listening: 'border-dark-accent-success',
                    speaking: 'ring-dark-accent-primary',
                    robot: 'text-dark-accent-primary',
                    user: 'text-dark-text-secondary'
                };
        }
    };

    const colors = getThemeColors();

    return (
        <div className={`flex inset-0 w-150 h-[460px] ${colors.bg} backdrop-blur-sm font-sans flex items-center justify-center`}>
                <div ref={containerRef} className={`w-full h-[90vh] max-h-[800px] ${colors.container} rounded-2xl shadow-2xl flex ${colors.text.primary} overflow-hidden`}>
                    
                    <div className="flex-1 flex flex-col relative" style={{ minWidth: '400px' }}>
                        <header className={`p-3 shadow-md ${colors.header} z-20 border-b ${colors.border} flex-shrink-0`}>
                            <h1 className={`text-lg font-bold text-center ${colors.text.accent}`}>My RAG App Voice Call</h1>
                        </header>

                        <main className="flex-1 flex items-center justify-center p-4 bg-black/20 relative overflow-hidden">
                            <div className="text-center">
                                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center bg-gray-700/60 transition-all duration-300
                                    ${state.isAssistantSpeaking ? `ring-4 ${colors.speaking}/70 shadow-2xl shadow-current/30` : `border-4 ${colors.border}`}`}>
                                    
                                    <FaRobot className={`h-20 w-20 ${colors.robot} transition-transform duration-500 ${state.isAssistantSpeaking ? 'scale-110' : ''}`} />
                                    
                                    {state.isAssistantSpeaking && (
                                        <>
                                            <div className={`absolute inset-0 border-2 ${colors.speaking} rounded-full animate-ping opacity-75`}></div>
                                            <div className={`absolute inset-0 border-2 ${colors.speaking} rounded-full animate-pulse`}></div>
                                        </>
                                    )}
                                </div>
                                <p className={`mt-3 text-lg font-medium ${colors.text.primary}`}>Assistant</p>
                                <p className={`text-md font-light ${colors.text.secondary} h-7 mt-1`}>{state.status}</p>
                            </div>

                            <div className={`absolute bottom-5 right-5 w-40 h-[100px] bg-gray-900/70 rounded-lg border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-sm
                                ${state.isListening ? `${colors.listening}/80 shadow-lg shadow-current/20` : `${colors.border}`}`}>
                                 <div className="text-center">
                                    <FaUser className={`h-10 w-10 transition-colors ${state.isListening ? colors.text.accent : colors.user}`} />
                                    <p className={`mt-2 text-sm ${colors.text.secondary}`}>You</p>
                                    {state.isListening && <p className={`text-xs ${colors.text.accent} animate-pulse`}>Listening...</p>}
                                 </div>
                            </div>

                            <div className="absolute top-3 right-3 max-w-xs z-30">
                                {state.error && (
                                    <div className="bg-red-900/80 border border-red-700 rounded-lg p-3 text-red-300 shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center font-semibold text-sm">
                                            <FaExclamationTriangle className="mr-2 h-4 w-4" />
                                            Error
                                        </div>
                                        <p className="text-xs mt-1">{state.error}</p>
                                    </div>
                                )}
                            </div>
                        </main>

                        <footer className={`bg-transparent bottom-0 p-3 flex justify-center items-center space-x-4 border-t border-transparent flex-shrink-0`}>
                            <div className="flex items-center space-x-3 w-1/3 justify-end">
                                {state.isAssistantSpeaking && !state.isPaused && (
                                    <button
                                        onClick={handlePauseTalking}
                                        className={`p-3 rounded-full ${colors.accent} hover:opacity-90 text-white shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-current`}
                                        aria-label="Pause talking"
                                    >
                                        <FaPause className="h-5 w-5" />
                                    </button>
                                )}
                                {state.isAssistantSpeaking && state.isPaused && (
                                     <button
                                        onClick={handleResumeTalking}
                                        className="p-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-400"
                                        aria-label="Resume talking"
                                    >
                                        <FaPlay className="h-5 w-5" />
                                    </button>
                                )}
                                {state.isAssistantSpeaking && (
                                    <button
                                        onClick={handleStopTalking}
                                        className="p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-400"
                                        aria-label="Stop talking"
                                    >
                                        <FaHandPaper className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            <div className="w-1/3 flex justify-start">
                                <button
                                    onClick={toggleConversationMode}
                                    className={`ml-[-250px] rounded-full w-16 h-16 flex items-center justify-center shadow-lg 
                                        transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-gray-900
                                        ${state.isConversationActive
                                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                        : `${colors.accent} hover:opacity-90 focus:ring-current`}
                                        text-white`}
                                    aria-label={state.isConversationActive ? "Stop conversation" : "Start conversation"}
                                >
                                    {state.isListening ? (
                                        <FaSpinner className="h-6 w-6 animate-spin" />
                                    ) : state.isConversationActive ? (
                                        <FaStop className="h-6 w-6" />
                                    ) : (
                                        <FaMicrophone className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                            
                            <div className="w-1/3"></div>
                        </footer>
                    </div>

                    {!isSidebarCollapsed && (
                        <div 
                            className={`w-1.5 cursor-col-resize ${colors.border} hover:${colors.accent} transition-colors duration-200 flex-shrink-0`}
                            onMouseDown={handleMouseDownOnResizer}
                        />
                    )}
        
                    <aside 
                        style={{ width: isSidebarCollapsed ? '50px' : `${sidebarWidth}px` }}
                        className={`${colors.sidebar} flex flex-col backdrop-blur-sm flex-shrink-0 transition-all duration-300 ease-in-out relative`}
                    >
                        {/* Toggle Button */}
                        <button
                            onClick={toggleSidebar}
                            className={`absolute top-1/2 -translate-y-1/2 ${isSidebarCollapsed ? '-right-3' : '-left-3'} z-30 
                                w-6 h-6 ${colors.accent} hover:opacity-90 rounded-full flex items-center justify-center 
                                text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
                            aria-label={isSidebarCollapsed ? "Expand conversation log" : "Collapse conversation log"}
                        >
                            {isSidebarCollapsed ? (
                                <FaChevronLeft className="h-3 w-3" />
                            ) : (
                                <FaChevronRight className="h-3 w-3" />
                            )}
                        </button>

                        <div className={`p-3 border-b ${colors.border} flex-shrink-0 ${isSidebarCollapsed ? 'p-2' : ''}`}>
                            {!isSidebarCollapsed ? (
                                <h2 className={`text-lg font-semibold text-center ${colors.text.secondary}`}>Conversation Log</h2>
                            ) : (
                                <div className="text-center">
                                    <FaRobot className={`h-6 w-6 mx-auto ${colors.text.secondary}`} />
                                </div>
                            )}
                        </div>
                        
                        {!isSidebarCollapsed ? (
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2">
                                {conversationLog.map((message) => (
                                    <Message key={message.id} message={message} />
                                ))}
                                <div ref={refs.conversationEnd} />
                            </div>
                        ) : (
                            <p></p>
                        )}
                    </aside>
                </div>
            </div>
    );
};

export default VoiceAssistantPage;
