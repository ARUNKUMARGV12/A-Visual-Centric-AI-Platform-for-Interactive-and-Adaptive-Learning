import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaYoutube, FaMicrophone, FaArrowRight, FaQuestionCircle, FaVolumeUp } from 'react-icons/fa';
import { BsStars, BsChatDots } from 'react-icons/bs';
import { RiSendPlaneFill, RiThumbUpLine, RiThumbDownLine, RiShareForwardLine, RiFileCopyLine, RiDownload2Line, RiEdit2Line, RiFileList2Line, RiLightbulbFlashLine, RiCodeSSlashLine } from 'react-icons/ri';
import { IoMdAttach } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import Sources from './response_srcs';
import Header from './header';
import '../css/chat.css';
import VisualizationSuggestions from './VisualizationSuggestions';
import DynamicCodeRenderer from './DynamicCodeRenderer';
import { useTheme } from '../contexts/ThemeContext';
import { useLearningTracker } from '../contexts/LearningTracker';
import { useChatContext } from '../contexts/ChatContextContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'; // Backend API URL

const generateUniqueId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Extract concepts from AI response
const extractConceptsFromResponse = (response) => {
    const concepts = [];
    const conceptKeywords = [
        'algorithm', 'function', 'variable', 'loop', 'condition', 'array', 'object',
        'class', 'method', 'api', 'database', 'framework', 'library', 'debugging',
        'testing', 'optimization', 'data structure', 'recursion', 'async', 'promise'
    ];
    
    const lowerResponse = response.toLowerCase();
    conceptKeywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) {
            concepts.push(keyword);
        }
    });
    
    return [...new Set(concepts)]; // Remove duplicates
};

const extractAndProcessCode = (markdownContent) => {
    if (!markdownContent) return [];
    const codeBlocks = [];
    const codeBlockRegex = /```(?:([\w.-]+)(?::([\w.-]+)|{filename(?:=|:)"([\w.-]+)"})?)?\\s*([\\s\\S]*?)```/g;
    let match;
    let blockIndex = 0;
    while ((match = codeBlockRegex.exec(markdownContent)) !== null) {
        const language = match[1] || '';
        const content = match[4].trim();
        codeBlocks.push({
            id: `code-${blockIndex}-${generateUniqueId()}`,
            content,
            filename: match[2] || match[3] || `snippet_${blockIndex + 1}${language ? '.' + language.split(/[^a-zA-Z0-9]/)[0] : '.txt'}`,
            language,
            originalMarkdown: match[0]
        });
        blockIndex++;
    }
    return codeBlocks;
};

// Component to render code blocks on a right-side canvas
const CodeCanvas = ({ codeBlocks, onClose }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editedCode, setEditedCode] = useState('');
    const [currentCodeSnippets, setCurrentCodeSnippets] = useState([]);

    useEffect(() => {
        if (codeBlocks && codeBlocks.length > 0) {
            setCurrentCodeSnippets([...codeBlocks]);
            setEditingIndex(null);
            setEditedCode('');
        } else {
            setCurrentCodeSnippets([]);
        }
    }, [codeBlocks]);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        });
    };

    const handleDownload = (code, filename = 'code.txt') => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleEdit = (index, code) => {
        setEditingIndex(index);
        setEditedCode(code);
    };

    const handleSaveEdit = (index) => {
        const updatedSnippets = [...currentCodeSnippets];
        updatedSnippets[index].content = editedCode;
        setCurrentCodeSnippets(updatedSnippets);
        setEditingIndex(null);
        setEditedCode('');
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditedCode('');
    };

    if (!currentCodeSnippets || currentCodeSnippets.length === 0) {
        return null;
    }

    return (
        <div className={`code-canvas-container ${codeBlocks && codeBlocks.length > 0 && onClose ? 'visible' : ''}`}>
            <div className="code-canvas">
                <div className="code-canvas-header">
                    <span className="code-canvas-title">
                        <RiFileCopyLine style={{ marginRight: '8px' }} />
                        {currentCodeSnippets[0]?.filename || 'Code Snippet'}
                    </span>
                    <button onClick={onClose} className="canvas-close-btn" title="Close Canvas">
                        <IoClose />
                    </button>
                </div>
                {currentCodeSnippets.map((snippet, index) => (
                    <div key={snippet.id || index} className="code-block-section">
                        {editingIndex === index ? (
                            <div className="code-editor">
                                <textarea
                                    value={editedCode}
                                    onChange={(e) => setEditedCode(e.target.value)}
                                    className="code-textarea"
                                    rows={15}
                                />
                                <div className="editor-buttons">
                                    <button onClick={() => handleSaveEdit(index)} className="canvas-btn">Save</button>
                                    <button onClick={handleCancelEdit} className="canvas-btn cancel-btn">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <pre className="code-content">
                                    <code>{snippet.content}</code>
                                </pre>
                                <div className="code-canvas-buttons">
                                    <button onClick={() => handleCopy(snippet.content)} className="canvas-btn" title="Copy code">
                                        <RiFileCopyLine /> <span>Copy</span>
                                    </button>
                                    <button onClick={() => handleDownload(snippet.content, snippet.filename)} className="canvas-btn" title="Download code">
                                        <RiDownload2Line /> <span>Download</span>
                                    </button>
                                    <button onClick={() => handleEdit(index, snippet.content)} className="canvas-btn" title="Edit code">
                                        <RiEdit2Line /> <span>Edit</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

function Chat({ chatHistory: propChatHistory = [], chatFilename = '', isInitialHomeScreen = false }) {
    const { currentTheme } = useTheme();
    const { trackQuery } = useLearningTracker();
    const { 
        createChatSession, 
        addMessageToSession, 
        getPersonalizedContext, 
        updateEngagement,
        currentSessionId,
        endCurrentSession 
    } = useChatContext();
    
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeForCanvas, setCodeForCanvas] = useState([]);
    const [showCodeCanvas, setShowCodeCanvas] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // Track TTS state
    const [filename, setFilename] = useState(chatFilename);
    const [visualSuggestions, setVisualSuggestions] = useState([]);
    const [selectedVisualization, setSelectedVisualization] = useState(null);
    const [isExplainerMode, setIsExplainerMode] = useState(false);
    const [sourceOnly, setSourceOnly] = useState(false); // Add source-only mode state
    const [tooltipText, setTooltipText] = useState("");
    const [showTooltip, setShowTooltip] = useState(false);

    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null); // Define textareaRef

    // Define handleSaveChat with useCallback before any useEffect hooks that use it
    const handleSaveChat = useCallback(async (filenameToSave) => {
        if (!filenameToSave || typeof filenameToSave !== 'string' || !filenameToSave.trim()) {
            console.log("Save chat: filename is invalid or empty, skipping save.", filenameToSave);
            return;
        }
        if (chatHistory.length === 0) {
            console.log("Save chat: chat history is empty, skipping save for filename:", filenameToSave);
            return;
        }
        console.log(`Attempting to save chat with filename: "${filenameToSave}"`);
        console.log("Chat history to save:", JSON.stringify(chatHistory.map(m => ({role: m.role, content: m.content, sources: m.sources, youtube_videos: m.youtube_videos, relatedQuestions: m.relatedQuestions }))));

        try {
            const payload = {
                filename: filenameToSave,
                chat_history: chatHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    sources: msg.sources || [],
                    youtube_videos: msg.youtube_videos || [],
                    relatedQuestions: msg.relatedQuestions || []
                }))
            };
            const response = await fetch('http://localhost:8000/save-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error from server' }));
                console.error('Failed to save chat:', errorData.detail || response.statusText);
            } else {
                const result = await response.json();
                console.log('Chat saved successfully response:', result);
            }
        } catch (err) {
            console.error('Error saving chat:', err);
        }
    }, [chatHistory]);

    // Transform propChatHistory to match the expected format
    useEffect(() => {
        if (propChatHistory.length > 0) {
            const formattedHistory = propChatHistory.map((msg, index) => ({
                id: msg.id || `restored-${index}-${Date.now()}`,
                role: msg.role,
                content: msg.content,
                youtube_videos: msg.youtube_videos || [],
                sources: msg.sources || [],
                relatedQuestions: msg.relatedQuestions || [],
                parsedCodeBlocks: extractAndProcessCode(msg.content),
                liked: msg.liked || false,
                disliked: msg.disliked || false,
                activeTabForMessage: msg.activeTabForMessage || 'answer',
                isSpeaking: false
            }));
            setChatHistory(formattedHistory);
            setFilename(chatFilename || '');
        } else {
            setChatHistory([]);
            setFilename('');
        }
    }, [propChatHistory, chatFilename]);

    // Set default filename based on the first query only if filename is not already set
    useEffect(() => {
        if (!isInitialHomeScreen && !filename && chatHistory.length > 0 && chatHistory.some(msg => msg.role === 'user')) {
            const firstQuery = chatHistory.find(msg => msg.role === 'user')?.content;
            if (firstQuery) {
                setFilename(firstQuery.substring(0, 50).replace(/[^a-zA-Z0-9-_]/g, '_'));
            }
        }
    }, [chatHistory, filename, isInitialHomeScreen]);

    // Auto-save to backend when chatHistory changes
    useEffect(() => {
        if (!isInitialHomeScreen && filename && chatHistory.length > 0) {
            handleSaveChat(filename);
        }
    }, [chatHistory, filename, isInitialHomeScreen, handleSaveChat]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleQuery = async (inputQuery) => {
        // Use the provided inputQuery or the current state if not provided
        const queryToUse = inputQuery || query;
        
        if (!queryToUse.trim()) {
            setError('Please enter a query');
            return;
        }

        // Create new chat session if none exists
        if (!currentSessionId) {
            createChatSession();
        }

        setLoading(true);
        
        // Add user message to chat context
        addMessageToSession(queryToUse, true);
        
        // Get personalized context for AI
        const personalizedContext = getPersonalizedContext();
        
        try {
            console.log(`Attempting to fetch ${API_URL}/query for: "${queryToUse}"`);
            console.log('Personalized context:', personalizedContext);
            
            const response = await fetch(`${API_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    query: queryToUse,
                    use_source_only: sourceOnly,
                    user_context: personalizedContext // Include personalized context
                })
            });

            console.log("/query response status:", response.status, "statusText:", response.statusText);

            if (!response.ok) {
                let errorDetail;
                try {
                    const errorData = await response.json();
                    console.log("Error data from /query response:", errorData);
                    errorDetail = errorData.detail || `Status: ${response.status}`;
                } catch (e) {
                    errorDetail = `Status: ${response.status}`;
                }
                throw new Error(`HTTP error! status: ${response.status}, detail: ${errorDetail}`);
            }

            const data = await response.json();
            console.log("Received query response:", data);
            console.log("Related questions from backend:", data.related_questions);

            // Add user message to chat history
            const userMessage = {
                id: generateUniqueId(),
                role: 'user',
                content: queryToUse,
                sources: [],
                youtube_videos: [],
                relatedQuestions: [],
                parsedCodeBlocks: [],
                liked: false,
                disliked: false,
                activeTabForMessage: 'answer',
                isSpeaking: false,
                timestamp: new Date().toISOString()
            };

            // Add messages to the state - Use related questions directly from LLM backend
            const newMessage = {
                id: generateUniqueId(),
                role: 'assistant',
                content: data.answer,
                sources: data.source_documents || [],
                relatedQuestions: data.related_questions || [], // Use questions from LLM backend only
                youtube_videos: data.youtube_videos || [],
                parsedCodeBlocks: extractAndProcessCode(data.answer),
                liked: false,
                disliked: false,
                activeTabForMessage: 'answer',
                isSpeaking: false,
                timestamp: new Date().toISOString()
            };

            setChatHistory(prevHistory => [...prevHistory, userMessage, newMessage]);
            
            // Add AI response to chat context
            addMessageToSession(data.answer, false);
            
            // Update engagement based on response quality
            updateEngagement(0.8); // High engagement for successful interaction
            
            // Track the query for learning insights
            trackQuery(queryToUse, data.answer, extractConceptsFromResponse(data.answer));
            
            setError(null);
        } catch (error) {
            console.error('Failed to fetch query response:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExplainerRequest = async (query) => {
        if (!query.trim()) return;

        // Create new chat session if none exists
        if (!currentSessionId) {
            createChatSession('explanation');
        }

        setLoading(true);
        setError('');
        setVisualSuggestions([]); // Clear previous suggestions
        setSelectedVisualization(null); // Clear previously selected visualization

        const userMessageId = generateUniqueId();
        const botMessageId = generateUniqueId();

        // Add user message to chat context
        addMessageToSession(query, true);

        // Get personalized context for AI
        const personalizedContext = getPersonalizedContext();

        // Add user message immediately to chat history
        const userMessage = {
            id: userMessageId,
            role: 'user',
            content: query,
            sources: [],
            youtube_videos: [],
            relatedQuestions: [],
            parsedCodeBlocks: [],
            liked: false,
            disliked: false,
            activeTabForMessage: 'answer',
            isSpeaking: false
        };

        setChatHistory(prev => [...prev, userMessage]);

        try {
            // Call the new /explainer/explain-topic endpoint
            const explainerResponse = await fetch(`${API_URL}/explainer/explain-topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_text: query,
                    include_related_questions: true,
                    user_context: personalizedContext // Include personalized context
                })
            });

            if (!explainerResponse.ok) {
                const errorData = await explainerResponse.json().catch(() => ({ detail: 'Unknown error during explanation generation.' }));
                throw new Error(`Explainer Error: ${errorData.detail || explainerResponse.statusText}`);
            }

            const explainerData = await explainerResponse.json();
            console.log("Explainer Data:", explainerData); // Debugging
            console.log("Related questions from explainer backend:", explainerData.related_questions);

            const explanationText = explainerData.explanation || 'Could not generate explanation.';
            const suggestedVisualMethods = explainerData.suggested_visual_methods || [];
            
            // Use related questions directly from explainer backend (no fallbacks)
            const relatedQuestions = explainerData.related_questions || [];

            // Update chat history with the explanation and suggestions
            const assistantMessage = {
                id: botMessageId,
                role: 'assistant',
                content: explanationText,
                sources: explainerData.sources || [],
                youtube_videos: explainerData.youtube_videos || [],
                relatedQuestions: relatedQuestions,
                parsedCodeBlocks: extractAndProcessCode(explanationText),
                liked: false,
                disliked: false,
                activeTabForMessage: 'answer',
                isSpeaking: false,
                visualSuggestions: suggestedVisualMethods
            };

            setChatHistory(prev => [...prev, assistantMessage]);

            // Add AI response to chat context
            addMessageToSession(explanationText, false);
            
            // Update engagement based on successful explanation
            updateEngagement(0.9); // Very high engagement for explanations

            // Set the visual suggestions state for the UI component
            setVisualSuggestions(suggestedVisualMethods);

        } catch (err) {
            console.error('Error in explainer request:', err);
            setError('Failed to get explanation: ' + err.message);
            
            // Update engagement for error
            updateEngagement(0.3); // Low engagement for errors
            
             // Add an error message to chat history if needed
             setChatHistory(prev => [
                 ...prev,
                 {
                id: generateUniqueId(),
                role: 'assistant',
                     content: `Error fetching explanation: ${err.message}`,
                     sources: [], youtube_videos: [], relatedQuestions: [], parsedCodeBlocks: [],
                     liked: false, disliked: false, activeTabForMessage: 'answer', isSpeaking: false,
                     visualSuggestions: [] // No suggestions on error
                 }
             ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectVisualization = async (visualization) => {
        console.log("handleSelectVisualization called with:", visualization);
        setSelectedVisualization(visualization);
        setLoading(true);
        
        // Find the latest assistant message to get the explanation text
        const latestExplanationMessage = chatHistory
            .filter(msg => msg.role === 'assistant' && msg.content)
            .slice(-1)[0];

        const latestExplanation = latestExplanationMessage ? latestExplanationMessage.content : '';

        if (!latestExplanation) {
            console.error("Could not find a recent explanation in chat history to generate visualization.");
            setError("Could not find explanation context for visualization.");
            setLoading(false);
            setVisualSuggestions([]); // Clear suggestions on error
            return;
        }

        // Construct a prompt for the coding agent
        const visualGenerationPrompt = `Generate HTML, CSS, and JavaScript code for an educational visualization titled "${visualization.chosen_visual_type || visualization}". The visualization should illustrate the following concept: ${latestExplanation}. Focus on creating a simple, static or animated representation as appropriate for the type "${visualization.chosen_visual_type || visualization}". Provide the complete code bundle (HTML, CSS, JS) suitable for embedding or dynamic rendering.`;

        try {
            console.log("Making fetch call to /coding/generate-code...");
            // Call the new Coding Agent API endpoint
            const response = await fetch(`${API_URL}/coding/generate-code`, { // Corrected endpoint URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visual_generation_prompt: visualGenerationPrompt,
                    chosen_visual_type: visualization.chosen_visual_type || visualization
                })
            });

            console.log("Fetch response received.", response);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error generating visualization code.' }));
                throw new Error(`HTTP error! status: ${response.status}, Detail: ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            console.log("Generated Visualization Code Data:", data);

            // TODO: Add logic here to dynamically render the received HTML, CSS, and JS code
            // For now, add a placeholder message to the chat history
            const visualizationMessage = {
                id: generateUniqueId(),
                role: 'assistant',
                content: `Generated visualization code for "${visualization.chosen_visual_type || visualization}".`,
                sources: [], youtube_videos: [], relatedQuestions: [], parsedCodeBlocks: [],
                liked: false, disliked: false, activeTabForMessage: 'answer', isSpeaking: false,
                visualSuggestions: [], // No suggestions after generating code
                generatedCode: data // Store the generated code data in the message
            };

            setChatHistory(prevMessages => [...prevMessages, visualizationMessage]);
            setVisualSuggestions([]); // Clear suggestions after selection

        } catch (error) {
            console.error('Error generating visualization code:', error);

            // Add an error message to chat history
            const errorMessage = {
                id: generateUniqueId(),
                role: 'assistant',
                content: `I couldn't generate the visualization code for "${visualization.chosen_visual_type || visualization}" at this time. ${error.message}`,
                sources: [], youtube_videos: [], relatedQuestions: [], parsedCodeBlocks: [],
                liked: false, disliked: false, activeTabForMessage: 'answer', isSpeaking: false,
                visualSuggestions: [] // No suggestions
            };

            setChatHistory(prevMessages => [...prevMessages, errorMessage]);
            setVisualSuggestions([]); // Clear suggestions
            setError('Failed to generate visualization code: ' + error.message);

        } finally {
            setLoading(false);
            setSelectedVisualization(null); // Clear selected visualization state
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        try {
            // Process the query based on mode - the functions will handle adding messages
            if (isExplainerMode) {
                await handleExplainerRequest(query);
            } else {
                await handleQuery(query);
            }
            
            // Clear the input after sending
            setQuery('');
        } catch (error) {
            console.error('Failed to fetch response:', error);
            // Error is already handled in the respective functions
        }
    };

    const handleLikeDislike = (messageId, action) => {
        setChatHistory(prevHistory =>
            prevHistory.map(msg => {
                if (msg.id === messageId) {
                    if (action === 'like') return { ...msg, liked: !msg.liked, disliked: false };
                    if (action === 'dislike') return { ...msg, disliked: !msg.disliked, liked: false };
                }
                return msg;
            })
        );
    };

    const handleTabChangeForMessage = (messageId, tabName) => {
        setChatHistory(prevHistory =>
            prevHistory.map(msg =>
                msg.id === messageId ? { ...msg, activeTabForMessage: tabName } : msg
            )
        );
    };

    const handleCodeButtonClick = (codeSnippet) => {
        setCodeForCanvas([codeSnippet]);
        setShowCodeCanvas(true);
    };

    const handleShowCode = (messageId, content) => {
        const codeBlocks = extractAndProcessCode(content);
        if (codeBlocks.length > 0) {
            setCodeForCanvas(codeBlocks);
            setShowCodeCanvas(true);
        }
    };

    const handleRelatedQuestionClick = async (question) => {
        // Set the query to the related question and submit it
        setQuery(question);
        
        // Create a user message for the related question
        const userMessage = {
            id: generateUniqueId(),
            role: 'user',
            content: question,
            sources: [],
            youtube_videos: [],
            relatedQuestions: [],
            parsedCodeBlocks: [],
            liked: false,
            disliked: false,
            activeTabForMessage: 'answer',
            isSpeaking: false,
            timestamp: new Date().toISOString()
        };
        
        // Add user message to chat history
        setChatHistory(prevMessages => [...prevMessages, userMessage]);
        
        try {
            // Process the query based on mode
            if (isExplainerMode) {
                await handleExplainerRequest(question);
            } else {
                await handleQuery(question);
            }
            
            // Clear the input after sending
            setQuery('');
        } catch (error) {
            console.error('Failed to fetch response for related question:', error);
        }
    };

    // Function to handle textarea input and resize
    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            // Set a slight delay to allow the browser to update scrollHeight correctly after value change
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
                }
            }, 0);
        }
    };

    // Handle Enter to submit and Shift+Enter for new line
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit(e); // Assuming handleFormSubmit is already defined and calls handleQuery
        }
        // Auto-resize on Shift+Enter as well
        if (e.key === 'Enter' && e.shiftKey) {
            setTimeout(() => { // Timeout to allow newline character to be added
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                }
            }, 0);
        }
    };

    const handleVoiceInput = async () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        setIsListening(true);
        setError('');

        setTimeout(() => {
            const sampleVoiceQuery = "What is React JS explained simply";
            setQuery(sampleVoiceQuery);
            setIsListening(false);
        }, 2000);
    };

    const handleTextToSpeech = async (messageId, text) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, isSpeaking: false } : msg));
            return;
        }

        if (!text) return;

        setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, isSpeaking: true } : msg));
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            setIsSpeaking(false);
            setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, isSpeaking: false } : msg));
        };
        utterance.onerror = (event) => {
            console.error("Speech synthesis error", event);
            setError("Sorry, couldn't play audio.");
            setIsSpeaking(false);
            setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, isSpeaking: false } : msg));
        };
        window.speechSynthesis.speak(utterance);
    };

    const handleShare = () => {
        console.log("Share action triggered for chat:", filename);
        alert("Share functionality to be implemented. Current chat filename: " + (filename || "New Chat"));
    };

    const handleExportPDF = () => {
        console.log("Export PDF action triggered for chat:", filename);
        alert("Export to PDF functionality to be implemented.");
    };

    const handleDelete = () => {
        console.log("Delete action triggered for chat:", filename);
        alert("Delete functionality to be implemented.");
    };

    const handleCopyURL = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert("URL copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy URL: ", err);
            alert("Failed to copy URL.");
        });
    };

    const handleBookmark = () => {
        alert("Bookmark functionality to be implemented.");
    };

    const showHelpTooltip = (text) => {
        setTooltipText(text);
        setShowTooltip(true);
    };

    const hideHelpTooltip = () => {
        setShowTooltip(false);
    };

    // Effect to listen for messages from the iframe
    useEffect(() => {
        const handleMessage = async (event) => {
            // WARNING: Verify event.origin in production to prevent security issues
            // console.log("Message received from iframe:", event.data);

            if (event.data && event.data.type === 'iframe-error') {
                console.error('Received error from iframe:', event.data.detail);
                // Find the message associated with this visualization (assuming the last one for simplicity for now)
                // In a more robust app, you might pass the message ID via the iframe URL or a message
                const latestAssistantMessage = chatHistory.filter(msg => msg.role === 'assistant' && msg.generatedCode).slice(-1)[0];

                if (latestAssistantMessage) {
                    const messageId = latestAssistantMessage.id;
                    const originalCode = latestAssistantMessage.generatedCode;
                    const errorDetails = event.data.detail;

                    // Update message state to show error and potentially a loading indicator for fixing
                    setChatHistory(prevChatHistory =>
                        prevChatHistory.map(msg =>
                            msg.id === messageId
                                ? { ...msg, renderingError: `Rendering failed: ${errorDetails.message || 'Unknown error'}`, isFixingCode: true } // Add error and fixing state
                                : msg
                        )
                    );

                    try {
                        // Call the Code Fixer Agent
                        console.log("Attempting to fix code using Code Fixer Agent...", { originalCode, errorDetails });
                        const response = await fetch(`${API_URL}/code-fixer/fix-code`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ original_code: originalCode, error: errorDetails }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            // Use template literal for error message for better readability
                            throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || response.statusText}`);
                        }

                        const fixedCode = await response.json();
                        console.log("Received fixed code:", fixedCode);

                        // Update message state with the fixed code and remove error/fixing state
                        setChatHistory(prevChatHistory =>
                            prevChatHistory.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, generatedCode: fixedCode, renderingError: null, isFixingCode: false } // Update with fixed code
                                    : msg
                            )
                        );

                    } catch (fixError) {
                        console.error('Error calling Code Fixer Agent:', fixError);
                        // Update message state to show fixing failed
                        setChatHistory(prevChatHistory =>
                            prevChatHistory.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, renderingError: `Fixing failed: ${fixError.message || 'Unknown fixing error'}`, isFixingCode: false } // Update with fixing error
                                    : msg
                            )
                        );
                    }
                }
             } else if (event.data && event.data.type === 'iframe-loaded') {
                 console.log('Iframe reported loaded.');
                 // Optional: Use this to confirm load if timeout wasn't enough
                 // set loading state to false for the message if needed
                 // You might need to pass the message id with the load event
                 // setChatHistory(prevChatHistory =>
                 //     prevChatHistory.map(msg =>
                 //         msg.id === the_relevant_message_id
                 //             ? { ...msg, isLoading: false } // Assuming you have an isLoading flag
                 //             : msg
                 //     )
                 // );
             }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [chatHistory]); // Depend on chatHistory to access latest messages

    if (isInitialHomeScreen && chatHistory.length === 0) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
                    <h2 className="text-2xl text-gray-100 font-medium mb-8 text-center">Ask me anything</h2>
                    <form onSubmit={handleFormSubmit} className="w-full">
                        <div className="relative">
                            <div className="flex flex-col mb-3 space-y-2">
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsExplainerMode(!isExplainerMode)}
                                        className={`mr-2 px-3 py-1 rounded-md text-sm ${
                                            isExplainerMode 
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        {isExplainerMode ? 'Explainer Mode' : 'RAG Mode'}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {isExplainerMode 
                                            ? 'Ask to explain concepts with visualizations'
                                            : 'Search and query documents'}
                                    </span>
                                    <button
                                        className="ml-2 text-gray-400 hover:text-gray-300 text-sm"
                                        onMouseEnter={() => showHelpTooltip(isExplainerMode 
                                            ? "Explainer Mode generates educational explanations with visual suggestions. Perfect for learning new concepts."
                                            : "RAG Mode searches through your uploaded documents to answer questions based on their content.")}
                                        onMouseLeave={hideHelpTooltip}
                                    >
                                        <FaQuestionCircle />
                                    </button>
                                </div>
                                {!isExplainerMode && (
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sourceOnly}
                                                onChange={() => setSourceOnly(!sourceOnly)}
                                                className="sr-only"
                                            />
                                            <div className={`relative w-10 h-5 rounded-full transition-colors ${sourceOnly ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${sourceOnly ? 'transform translate-x-5' : ''}`}></div>
                                            </div>
                                            <span className="ml-2 text-xs text-gray-400">Source-only mode {sourceOnly ? 'ON' : 'OFF'}</span>
                                        </label>
                                        <button
                                            className="ml-2 text-gray-400 hover:text-gray-300 text-sm"
                                            onMouseEnter={() => showHelpTooltip("Source-only mode restricts answers to only use content from your documents. When disabled, the AI can use its general knowledge too.")}
                                            onMouseLeave={hideHelpTooltip}
                                        >
                                            <FaQuestionCircle />
                                        </button>
                                    </div>
                                )}
                                {showTooltip && (
                                    <div className="bg-gray-700 text-white p-2 rounded shadow-lg text-xs max-w-xs">
                                        {tooltipText}
                                    </div>
                                )}
                            </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                                placeholder="Type your question here..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-4 px-5 pr-12 text-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        disabled={loading}
                    />
                            <button 
                                type="submit" 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-full transition-colors"
                                disabled={loading || !query.trim()}
                            >
                        <FaArrowRight />
                    </button>
                        </div>
                        {loading && <p className="text-gray-300 mt-4 text-center">Getting your answer...</p>}
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </form>
                </div>
            </div>
        );
    }

    // Theme-aware colors for Chat component
    const getChatThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    chatSection: 'bg-light-bg',
                    chatContainer: 'bg-light-card border border-light-border',
                    chatHistory: 'bg-light-bg',
                    text: 'text-light-text-primary',
                    placeholder: 'text-light-text-secondary',
                    accent: 'text-light-accent-primary',
                    messageUser: 'bg-light-accent-primary/10 border-light-accent-primary',
                    messageAssistant: 'bg-light-sidebar border-light-border',
                    inputBg: 'bg-light-card border-light-border',
                    inputText: 'text-light-text-primary placeholder:text-light-text-secondary'
                };
            case 'forest':
                return {
                    chatSection: 'bg-forest-bg',
                    chatContainer: 'bg-forest-card border border-forest-border',
                    chatHistory: 'bg-forest-bg',
                    text: 'text-forest-text-primary',
                    placeholder: 'text-forest-text-secondary',
                    accent: 'text-forest-accent-primary',
                    messageUser: 'bg-forest-accent-primary/10 border-forest-accent-primary',
                    messageAssistant: 'bg-forest-sidebar border-forest-border',
                    inputBg: 'bg-forest-card border-forest-border',
                    inputText: 'text-forest-text-primary placeholder:text-forest-text-secondary'
                };
            case 'sunset':
                return {
                    chatSection: 'bg-sunset-bg',
                    chatContainer: 'bg-sunset-card border border-sunset-border',
                    chatHistory: 'bg-sunset-bg',
                    text: 'text-sunset-text-primary',
                    placeholder: 'text-sunset-text-secondary',
                    accent: 'text-sunset-accent-primary',
                    messageUser: 'bg-sunset-accent-primary/10 border-sunset-accent-primary',
                    messageAssistant: 'bg-sunset-sidebar border-sunset-border',
                    inputBg: 'bg-sunset-card border-sunset-border',
                    inputText: 'text-sunset-text-primary placeholder:text-sunset-text-secondary'
                };
            case 'purple':
                return {
                    chatSection: 'bg-purple-bg',
                    chatContainer: 'bg-purple-card border border-purple-border',
                    chatHistory: 'bg-purple-bg',
                    text: 'text-purple-text-primary',
                    placeholder: 'text-purple-text-secondary',
                    accent: 'text-purple-accent-primary',
                    messageUser: 'bg-purple-accent-primary/10 border-purple-accent-primary',
                    messageAssistant: 'bg-purple-sidebar border-purple-border',
                    inputBg: 'bg-purple-card border-purple-border',
                    inputText: 'text-purple-text-primary placeholder:text-purple-text-secondary'
                };
            default: // dark
                return {
                    chatSection: 'bg-dark-bg',
                    chatContainer: 'bg-dark-card border border-dark-border',
                    chatHistory: 'bg-dark-bg',
                    text: 'text-dark-text-primary',
                    placeholder: 'text-dark-text-secondary',
                    accent: 'text-dark-accent-primary',
                    messageUser: 'bg-dark-accent-primary/10 border-dark-accent-primary',
                    messageAssistant: 'bg-dark-sidebar border-dark-border',
                    inputBg: 'bg-dark-card border-dark-border',
                    inputText: 'text-dark-text-primary placeholder:text-dark-text-secondary'
                };
        }
    };

    const chatColors = getChatThemeColors();

    return (
        <div>
            {/* Session Status Bar */}
            {currentSessionId && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4 mx-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-blue-300">
                                Active Learning Session: {currentSessionId.split('_')[1]}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-400">
                                Personalized for your learning style
                            </span>
                            <button
                                onClick={endCurrentSession}
                                className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className={`chat-container ${chatColors.chatContainer} rounded-lg p-0 overflow-hidden bg-transparent flex flex-col h-[calc(100vh-110px)]`}>
                <div className={`chat-history ${chatColors.chatHistory} flex-grow overflow-y-auto p-4 pb-24 mx-auto w-full max-w-4xl`} ref={chatContainerRef}>
                    {chatHistory.length === 0 ? (
                        <div className={`placeholder-text flex flex-col bg-transparent items-center justify-center h-full ${chatColors.text}`}>
                            <BsStars className={`text-6xl mb-5 ${chatColors.accent}`} />
                            <h2 className="text-2xl mb-3">How can I help you today?</h2>
                            <p className={chatColors.placeholder}>Ask me anything, or try one of the suggestions below.</p>
                        </div>
                    ) : (
                        chatHistory.map((msg, index) => (
                            <div key={msg.id || index} className="message-container mb-6">
                                {msg.role === 'user' ? (
                                    // User message - compact, right-aligned bubble
                                    <div className="flex justify-end mb-4">
                                        <div className="user-message-wrapper max-w-[80%] text-right">
                                            <div className="user-label text-xs text-gray-400 mb-1 mr-2">You</div>
                                            <div className="user-message text-white rounded-2xl rounded-br-md px-5 py-3 inline-block shadow-md " style={{ backgroundColor: 'rgba(22, 61, 86, 0.48)',  border: '1px solid rgb(20, 89, 132)' }}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Assistant message - full-width card with tabs
                                    <div className="assistant-message-wrapper mb-6">
                                        <div className="assistant-label text-xs text-gray-400 mb-2 ml-1">Assistant</div>
                                        <div className="assistant-message rounded-xl border border-blue-700 shadow-lg overflow-hidden" style={{ backgroundColor: 'rgba(22, 61, 86, 0.48)',  border: '1px solid rgb(20, 89, 132)' }}>
                                            {/* Tabs Header */}
                                            <div className="message-tabs bg-gray-750 border-b border-gray-700 px-4 py-2">
                                                <div className="flex space-x-1 overflow-x-auto">
                                                    <button 
                                                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                                                            msg.activeTabForMessage === 'answer' 
                                                                ? 'bg-blue-600 text-white font-medium shadow-sm' 
                                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                        }`}
                                                        onClick={() => handleTabChangeForMessage(msg.id, 'answer')}
                                                    >
                                                        <BsChatDots className="mr-2" /> Answer
                                                    </button>
                                                    {msg.sources && msg.sources.length > 0 && (
                                                        <button 
                                                            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                                                                msg.activeTabForMessage === 'sources' 
                                                                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                            }`}
                                                            onClick={() => handleTabChangeForMessage(msg.id, 'sources')}
                                                        >
                                                            <RiFileList2Line className="mr-2" /> Sources ({msg.sources.length})
                                                        </button>
                                                    )}
                                                    {msg.youtube_videos && msg.youtube_videos.length > 0 && (
                                                        <button 
                                                            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                                                                msg.activeTabForMessage === 'youtube_videos' 
                                                                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                            }`}
                                                            onClick={() => handleTabChangeForMessage(msg.id, 'youtube_videos')}
                                                        >
                                                            <FaYoutube className="mr-2" /> Videos ({msg.youtube_videos.length})
                                                        </button>
                                                    )}
                                                    {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                                        <button 
                                                            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                                                                msg.activeTabForMessage === 'related_questions' 
                                                                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                            }`}
                                                            onClick={() => handleTabChangeForMessage(msg.id, 'related_questions')}
                                                        >
                                                            <FaQuestionCircle className="mr-2" /> Related ({msg.relatedQuestions.length})
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {msg.activeTabForMessage === 'answer' && (
                                                <div className="message-content p-5">
                                                    <div className="message-content-area text-gray-100">
                                                        {msg.generatedCode ? (
                                                            <>
                                                                {/* Only render the explanation text, not the markdown code block placeholder */}
                                                                <div className="mb-4">{msg.content}</div>
                                                                <DynamicCodeRenderer fullHtmlCode={msg.generatedCode.html_code} />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        h1: ({node, children, ...props}) => <h1 className="text-xl font-semibold text-gray-100 mb-4 mt-2 pb-2 border-b border-gray-700" {...props}>{children}</h1>,
                                                                        h2: ({node, children, ...props}) => <h2 className="text-lg font-semibold text-gray-100 mb-3 mt-5" {...props}>{children}</h2>,
                                                                        h3: ({node, children, ...props}) => <h3 className="text-base font-semibold text-gray-100 mb-2 mt-4" {...props}>{children}</h3>,
                                                                        p: ({node, children, ...props}) => {
                                                                            const containsCodeBlock = React.Children.toArray(children).some(child =>
                                                                                React.isValidElement(child) && child.type === 'pre'
                                                                            );
                                                                            if (containsCodeBlock) {
                                                                                return <div className="text-gray-100 mb-4 leading-relaxed text-base" {...props}>{children}</div>;
                                                                            }
                                                                            return <p className="text-gray-100 mb-4 leading-relaxed text-base" {...props}>{children}</p>;
                                                                        },
                                                                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-gray-100 space-y-2" {...props} />, 
                                                                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-gray-100 space-y-2" {...props} />, 
                                                                        li: ({node, ...props}) => <li className="mb-1 text-gray-100" {...props} />, 
                                                                        a: ({node, children, ...props}) => <a className="text-blue-400 hover:underline font-medium" {...props}>{children}</a>,
                                                                        blockquote: ({node, children, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic my-4" {...props}>{children}</blockquote>,
                                                                        em: ({node, ...props}) => <em className="italic text-gray-100" {...props} />, 
                                                                        strong: ({node, ...props}) => <strong className="font-bold text-gray-100" {...props} />, 
                                                                        hr: ({node, ...props}) => <hr className="border-gray-700 my-6" {...props} />, 
                                                                        table: ({node, ...props}) => <div className="overflow-x-auto mb-6"><table className="min-w-full text-gray-100 border-collapse" {...props} /></div>,
                                                                        thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />, 
                                                                        tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-700" {...props} />, 
                                                                        tr: ({node, ...props}) => <tr className="hover:bg-gray-750" {...props} />, 
                                                                        th: ({node, ...props}) => <th className="px-4 py-2 text-left text-gray-100 font-medium" {...props} />, 
                                                                        td: ({node, ...props}) => <td className="px-4 py-2 text-gray-100" {...props} />, 
                                                                        code: ({node, inline, className, children, ...props}) => {
                                                                            const match = /language-(\w+)/.exec(className || '');
                                                                            const language = match && match[1];
                                                                            const codeMeta = node.data?.meta || '';
                                                                            let extractedFilename = `code_snippet.${language || 'txt'}`;
                                                                            if (typeof codeMeta === 'string') {
                                                                                const fnMatch = codeMeta.match(/filename="([^"]+)"/);
                                                                                if (fnMatch && fnMatch[1]) {
                                                                                    extractedFilename = fnMatch[1];
                                                                                }
                                                                            }
                                                                            if (inline) {
                                                                                return <code className="bg-gray-700 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                                                                            }
                                                                            const originalMarkdownForBlock = "```" + (language || '') + (codeMeta ? `{${codeMeta}}` : '') + "\n" + String(children).trim() + "\n```";
                                                                            const codeBlockForButton = msg.parsedCodeBlocks?.find(cb => 
                                                                                cb.originalMarkdown === originalMarkdownForBlock || cb.content === String(children).trim()
                                                                            );
                                                                            return (
                                                                                <div className="mt-3 mb-4 rounded-md overflow-hidden">
                                                                                    {codeBlockForButton ? (
                                                                                        <button 
                                                                                            onClick={() => handleCodeButtonClick(codeBlockForButton)} 
                                                                                            className="flex items-center bg-gray-700 hover:bg-gray-600 text-gray-100 px-4 py-2.5 rounded-t-md text-sm transition-colors w-full font-mono"
                                                                                        >
                                                                                            <RiCodeSSlashLine className="mr-2" /> 
                                                                                            <span>View Code: {codeBlockForButton.filename}</span>
                                                                                        </button>
                                                                                    ) : null}
                                                                                    <pre className="bg-gray-700 p-4 rounded-md overflow-x-auto text-sm text-gray-100 my-3 font-mono leading-relaxed"><code className={className} {...props}>{children}</code></pre>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                                {msg.visualSuggestions && msg.visualSuggestions.length > 0 && (
                                                                    <VisualizationSuggestions
                                                                        suggestions={msg.visualSuggestions}
                                                                        onSelectSuggestion={handleSelectVisualization}
                                                                    />
                                                                )}
                                                                
                                                                {/* Related Questions - Display prominently after every response */}
                                                                {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                                                    <div className="related-questions-section mt-6 pt-4 border-t border-gray-700/50">
                                                                        <h3 className="flex items-center text-gray-200 font-medium mb-4 text-base">
                                                                            <RiLightbulbFlashLine className="mr-2 text-yellow-400 text-lg" />
                                                                            Related Questions
                                                                        </h3>
                                                                        <div className="grid gap-2">
                                                                            {msg.relatedQuestions.map((question, i) => (
                                                                                <button 
                                                                                    key={i} 
                                                                                    onClick={() => handleRelatedQuestionClick(question)} 
                                                                                    className="text-left bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-blue-500/50 p-3 rounded-lg transition-all duration-200 text-sm text-gray-200 hover:text-blue-300 group"
                                                                                >
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="text-gray-400 group-hover:text-blue-400 transition-colors mt-0.5">→</span>
                                                                                        <span className="leading-relaxed">{question}</span>
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        
                                        {msg.activeTabForMessage === 'sources' && (
                                            <div className="message-content p-5">
                                                <Sources sources={msg.sources} />
                                            </div>
                                        )}
                                        
                                        {msg.activeTabForMessage === 'youtube_videos' && msg.youtube_videos && msg.youtube_videos.length > 0 && (
                                            <div className="message-content p-5">
                                                <div className="youtube-videos-container">
                                                    <h4 className="text-gray-100 font-medium mb-3">Related Videos:</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {msg.youtube_videos.map((video, i) => (
                                                            <a key={i} href={video.url} target="_blank" rel="noopener noreferrer" 
                                                               className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors flex flex-col">
                                                                <img src={video.thumbnail} alt={video.title} className="w-full rounded mb-2" />
                                                                <p className="text-sm text-gray-200 line-clamp-2">{video.title}</p>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {msg.activeTabForMessage === 'related_questions' && msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                            <div className="message-content p-5">
                                                <div className="bg-gray-700/50 rounded-md p-4">
                                                    <h3 className="flex items-center text-gray-200 font-medium mb-3">
                                                        <RiLightbulbFlashLine className="mr-2 text-yellow-400" />
                                                        Related Questions
                                                    </h3>
                                                    <div className="grid gap-2">
                                                        {msg.relatedQuestions.map((question, i) => (
                                                            <button key={i} 
                                                                onClick={() => handleRelatedQuestionClick(question)} 
                                                                className="text-left text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 p-2 rounded transition-colors text-sm">
                                                                {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Action buttons for assistant messages */}
                                        <div className="px-5 pb-4">
                                            <div className="action-buttons flex space-x-2 pt-3 border-t border-gray-700/50">
                                                <button onClick={() => handleLikeDislike(msg.id, 'like')} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.liked ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title="Like">
                                                    <RiThumbUpLine />
                                                </button>
                                                <button onClick={() => handleLikeDislike(msg.id, 'dislike')} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.disliked ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title="Dislike">
                                                    <RiThumbDownLine />
                                                </button>
                                                <button onClick={() => handleTextToSpeech(msg.id, msg.content)} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.isSpeaking ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title={msg.isSpeaking ? "Stop Speech" : "Read Aloud"} 
                                                    disabled={isSpeaking && !msg.isSpeaking}>
                                                    <FaVolumeUp />
                                                </button>
                                                <button onClick={() => handleShare(msg.id)} 
                                                    className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-700/50" 
                                                    title="Share">
                                                    <RiShareForwardLine />
                                                </button>
                                                {/* Show Code button */}
                                                {extractAndProcessCode(msg.content).length > 0 && (
                                                    <button 
                                                        onClick={() => handleShowCode(msg.id, msg.content)}
                                                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                                                        title="Show Code"
                                                    >
                                                        <RiCodeSSlashLine />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                        
                                        {msg.activeTabForMessage === 'sources' && (
                                            <div className="message-content p-5">
                                                <Sources sources={msg.sources} />
                                            </div>
                                        )}
                                        
                                        {msg.activeTabForMessage === 'youtube_videos' && msg.youtube_videos && msg.youtube_videos.length > 0 && (
                                            <div className="message-content p-5">
                                                <div className="youtube-videos-container">
                                                    <h4 className="text-gray-100 font-medium mb-3">Related Videos:</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {msg.youtube_videos.map((video, i) => (
                                                            <a key={i} href={video.url} target="_blank" rel="noopener noreferrer" 
                                                               className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors flex flex-col">
                                                                <img src={video.thumbnail} alt={video.title} className="w-full rounded mb-2" />
                                                                <p className="text-sm text-gray-200 line-clamp-2">{video.title}</p>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {msg.activeTabForMessage === 'related_questions' && msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                            <div className="message-content p-5">
                                                <div className="bg-gray-700/50 rounded-md p-4">
                                                    <h3 className="flex items-center text-gray-200 font-medium mb-3">
                                                        <RiLightbulbFlashLine className="mr-2 text-yellow-400" />
                                                        Related Questions
                                                    </h3>
                                                    <div className="grid gap-2">
                                                        {msg.relatedQuestions.map((question, i) => (
                                                            <button key={i} 
                                                                onClick={() => handleRelatedQuestionClick(question)} 
                                                                className="text-left text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 p-2 rounded transition-colors text-sm">
                                                                {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Action buttons for assistant messages */}
                                        <div className="px-5 pb-4">
                                            <div className="action-buttons flex space-x-2 pt-3 border-t border-gray-700/50">
                                                <button onClick={() => handleLikeDislike(msg.id, 'like')} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.liked ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title="Like">
                                                    <RiThumbUpLine />
                                                </button>
                                                <button onClick={() => handleLikeDislike(msg.id, 'dislike')} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.disliked ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title="Dislike">
                                                    <RiThumbDownLine />
                                                </button>
                                                <button onClick={() => handleTextToSpeech(msg.id, msg.content)} 
                                                    className={`p-2 rounded-lg transition-colors ${msg.isSpeaking ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`} 
                                                    title={msg.isSpeaking ? "Stop Speech" : "Read Aloud"} 
                                                    disabled={isSpeaking && !msg.isSpeaking}>
                                                    <FaVolumeUp />
                                                </button>
                                                <button onClick={() => handleShare(msg.id)} 
                                                    className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-700/50" 
                                                    title="Share">
                                                    <RiShareForwardLine />
                                                </button>
                                                {/* Show Code button */}
                                                {extractAndProcessCode(msg.content).length > 0 && (
                                                    <button 
                                                        onClick={() => handleShowCode(msg.id, msg.content)}
                                                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                                                        title="Show Code"
                                                    >
                                                        <RiCodeSSlashLine />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex items-center justify-center p-4">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    {error && <div className="bg-red-900/50 text-red-400 p-3 rounded-md">{error}</div>}
                </div>

                {showCodeCanvas && codeForCanvas.length > 0 && (
                    <CodeCanvas 
                        codeBlocks={codeForCanvas} 
                        onClose={() => setShowCodeCanvas(false)} 
                    />
                )}

                {visualSuggestions.length > 0 && (
                    <VisualizationSuggestions 
                        suggestions={visualSuggestions}
                        onSelectVisualization={handleSelectVisualization}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-[245px] right-0 bg-transparent p-4 border-t border-transparent z-10 flex justify-center">
                <form className="flex items-center gap-2 shadow-xl  rounded-3xl  border border-gray-600 p-2.5 w-[835px] mx-auto" onSubmit={handleFormSubmit} style={{ backgroundColor: 'rgb(22, 61, 86)',  border: '1px solid rgb(20, 89, 132)' }}>
                        <button 
                            type="button" 
                            onClick={() => alert('Attach file clicked - implement functionality')} 
                        className="p-2 text-gray-400 hover:text-gray-200 rounded-full" 
                            title="Attach files"
                        >
                            <IoMdAttach />
                        </button>
                    <textarea
                        ref={textareaRef}
                        className="flex-1 bg-transparent text-gray-100 border-none outline-none resize-none px-2 py-2 min-h-[44px] text-base"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening... Speak now." : "Ask anything..."}
                        rows="1"
                        disabled={loading}
                    />
                        <button 
                            type="button" 
                            onClick={handleVoiceInput} 
                        className={`p-2.5 rounded-full ${isListening ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            title={isListening ? "Stop listening" : "Use voice"}
                            disabled={loading}
                        >
                            <FaMicrophone />
                        </button>
                    <button 
                        type="submit" 
                        className={`p-2.5 rounded-full ${!query.trim() || loading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        disabled={!query.trim() || loading}
                        title="Send message"
                    >
                        <RiSendPlaneFill className="text-lg" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Chat;