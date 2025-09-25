// Header.js

import React, { useState, useEffect, useRef } from 'react';
import {
    // RiShareForwardLine, // Unused
    RiDownload2Line,
    RiDeleteBinLine,
    RiLinksLine,
    RiStarLine,
    RiMore2Fill,
    RiChat1Line,
    RiEdit2Line
} from 'react-icons/ri';

function Header({ 
    filename, 
    onSave, // Assuming onSave is the prop for filename changes if it persists them
    onExportPDF, 
    onDelete, 
    onCopyURL, 
    onBookmark, 
    isChatActive 
}) {
    const [currentFilename, setCurrentFilename] = useState(filename || '');
    const [isEditing, setIsEditing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // For detecting clicks outside
    const inputRef = useRef(null);

    useEffect(() => {
        setCurrentFilename(filename || '');
    }, [filename]);

    // Handle clicks outside of the dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleFilenameChange = (e) => {
        setCurrentFilename(e.target.value);
    };

    const handleFilenameBlur = () => {
        if (onSave && currentFilename.trim()) {
            onSave(currentFilename);
        }
        setIsEditing(false);
    };
    
    const handleFilenameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleActionClick = (actionCallback) => {
        if (actionCallback) {
            actionCallback();
        }
        setDropdownOpen(false);
    };

    return (
        <header className="sticky top-0 bg-card shadow-lg z-10 border-b border-border py-3 px-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                <div className="flex items-center">
                    {!isChatActive ? (
                        <span className="text-lg font-medium text-primary flex items-center">
                            <RiChat1Line className="mr-2 text-brand" /> {currentFilename || "New Chat"}
                        </span>
                    ) : (
                        <div className="relative flex items-center">
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={currentFilename}
                                    onChange={handleFilenameChange}
                                    onBlur={handleFilenameBlur}
                                    onKeyDown={handleFilenameKeyDown}
                                    placeholder="Chat Title"
                                    className="bg-hover border border-border rounded px-3 py-1 text-primary w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                            ) : (
                                <div className="flex items-center group">
                                    <h1 className="text-lg font-medium text-primary mr-2">
                                        {currentFilename || "New Chat"}
                                    </h1>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <RiEdit2Line />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {isChatActive && (
                    <div className="flex items-center space-x-2">
                        {/* <button onClick={() => handleActionClick(onShare)} className="action-btn share-btn" title="Share Conversation">
                            <RiShareForwardLine />
                        </button> */}
                        <button 
                            onClick={() => handleActionClick(onExportPDF)} 
                            className="p-2 text-gray-400 hover:text-gray-100 rounded transition-colors" 
                            title="Export as PDF"
                        >
                            <RiDownload2Line />
                        </button>
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={toggleDropdown} 
                                className="p-2 text-gray-400 hover:text-gray-100 rounded transition-colors" 
                                title="More Options"
                            >
                                <RiMore2Fill />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10 border border-gray-600">
                                    <button 
                                        onClick={() => handleActionClick(onDelete)} 
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" 
                                        title="Delete Chat"
                                    >
                                        <RiDeleteBinLine className="mr-2" /> Delete
                                    </button>
                                    <button 
                                        onClick={() => handleActionClick(onCopyURL)} 
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" 
                                        title="Copy Chat URL"
                                    >
                                        <RiLinksLine className="mr-2" /> Copy URL
                                    </button>
                                    <button 
                                        onClick={() => handleActionClick(onBookmark)} 
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" 
                                        title="Bookmark Chat"
                                    >
                                        <RiStarLine className="mr-2" /> Bookmark
                                    </button>
                                    {/* Add other actions here if needed */}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;