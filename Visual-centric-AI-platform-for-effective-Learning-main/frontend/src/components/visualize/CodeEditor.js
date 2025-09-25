import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, onChange, language = 'html' }) {
    const { currentTheme } = useTheme();

    // Determine Monaco theme based on current app theme
    const getMonacoTheme = () => {
        switch (currentTheme) {
            case 'light':
                return 'light'; // Monaco's light theme
            case 'forest':
            case 'sunset':
            case 'purple':
            default: // dark
                return 'vs-dark'; // Monaco's dark theme
        }
    };

    // Theme-aware colors for the container
    const getCodeEditorThemeColors = () => {
        switch (currentTheme) {
            case 'light':
                return {
                    container: 'bg-light-card border-light-border',
                    text: 'text-light-text-primary',
                    border: 'border-light-border'
                };
            case 'forest':
                return {
                    container: 'bg-forest-card border-forest-border',
                    text: 'text-forest-text-primary',
                    border: 'border-forest-border'
                };
            case 'sunset':
                return {
                    container: 'bg-sunset-card border-sunset-border',
                    text: 'text-sunset-text-primary',
                    border: 'border-sunset-border'
                };
            case 'purple':
                return {
                    container: 'bg-purple-card border-purple-border',
                    text: 'text-purple-text-primary',
                    border: 'border-purple-border'
                };
            default: // dark
                return {
                    container: 'bg-dark-card border-dark-border',
                    text: 'text-dark-text-primary',
                    border: 'border-dark-border'
                };
        }
    };

    const colors = getCodeEditorThemeColors();

    const handleEditorChange = (value) => {
        if (onChange && typeof onChange === 'function') {
            onChange(value || '');
        }
    };

    return (
        <div className={`w-full h-full ${colors.container} border rounded-lg overflow-hidden`}>
            <div className={`px-4 py-2 ${colors.text} border-b ${colors.border} text-sm font-medium`}>
                Code Editor
            </div>
            <div className="h-full" style={{ height: 'calc(100% - 45px)' }}>
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    value={code}
                    onChange={handleEditorChange}
                    theme={getMonacoTheme()}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 2,
                        folding: true,
                        lineHeight: 22,
                        padding: { top: 16, bottom: 16 },
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true,
                        autoIndent: 'full',
                        cursorBlinking: 'smooth',
                        renderWhitespace: 'boundary'
                    }}
                    loading={
                        <div className="flex items-center justify-center h-full">
                            <div className={`${colors.text} text-sm`}>Loading Monaco editor...</div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}

export default CodeEditor;
