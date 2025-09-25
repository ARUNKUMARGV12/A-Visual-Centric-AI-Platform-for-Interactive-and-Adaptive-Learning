// src/components/Sidebar.js

import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import '../css/sidebar.css'; // We will create this CSS file

// Assume chat structure is { id, filename, preview }
function Sidebar({ chats, onNewChat, onSelectChat, activeChatId, userEmail }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                 {/* Placeholder for logo; replace with your logo */}
                 <div className="sidebar-logo">
                    <svg className="logo-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7h20L12 2zm0 3.5L5 9v10h14V9l-7-3.5zm0 2.5l5 2.5v6l-5-2.5-5 2.5v-6l5-2.5z" />
                    </svg>
                 </div>
                {/* New Chat Button */}
                <button className="new-chat-btn" onClick={onNewChat} title="Start New Chat">
                     {/* Plus icon */}
                     <svg className="plus-icon" viewBox="0 0 24 24" fill="white">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    New Chat
                </button>
            </div>


            <nav className="sidebar-nav">
                 {/* Home Button - Keep this for navigation */}
                <button className={`nav-item ${activeChatId === null ? 'active' : ''}`} onClick={() => onSelectChat(null)}>
                     {/* Assuming activeChatId === null means Home/New Chat view */}
                    <span role="img" aria-label="home">🏠</span> Home
                </button>

                {/* Add this Link to the Voice Assistant Page */}
                <Link to="/voice-assistant" className="voice-assistant-button">
                    Voice Assistant
                </Link>
                
                {/* Test Your Knowledge Link */}
                <Link to="/knowledge-games" className="knowledge-games-button">
                    <span role="img" aria-label="games">🎮</span> Test Your Knowledge
                </Link>

                {/* Library Section */}
                <div className="sidebar-library">
                    <div className="library-header">Library</div>
                    <ul className="chat-list">
                        {chats.length > 0 ? (
                            chats.map((chat) => (
                                <li
                                    key={chat.id}
                                    className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat.id)}
                                    title={chat.filename || chat.preview} // Show filename or preview on hover
                                >
                                    {/* Display filename, or a preview of the first message */}
                                    {chat.filename || (chat.preview ? chat.preview.substring(0, 25) + '...' : 'Untitled Chat')}
                                </li>
                            ))
                        ) : (
                            <li className="no-chats">No saved chats yet.</li>
                        )}
                    </ul>
                </div>

                 {/* You can decide to keep Discover/Spaces or remove them */}
                 {/*
                <button className="nav-item">
                   <span role="img" aria-label="discover">🔍</span> Discover
                </button>
                <button className="nav-item">
                   <span role="img" aria-label="spaces">🌌</span> Spaces
                </button>
                 */}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <span className="user-icon">👤</span>
                     {/* Display email passed from App.js */}
                    <span className="user-email">{userEmail}</span>
                    {/* <span className="pro-label">Pro</span> You can keep this if applicable */}
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;