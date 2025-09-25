import React, { useEffect, useState } from 'react';

// Function to strip markdown code fences from the HTML code
function stripMarkdownFences(code) {
    if (!code) return '';
    // Remove triple backtick blocks with optional language
    return code
        .replace(/^```[a-zA-Z0-9]*\s*([\s\S]*?)```$/gm, '$1')
        .replace(/^```[\s\S]*?```$/gm, '$1')
        .trim();
}

function patchArrowCreation(html) {
    // Look for the arrow creation block and wrap it in setTimeout
    if (!html.includes('// Create Arrows')) return html;
    return html.replace(
        /(\/\/ Create Arrows[\s\S]*?arrowsData\.forEach\([\s\S]*?\{[\s\S]*?\}[\s\S]*?\);)/,
        match => `// Delay arrow creation to ensure layout is complete\nsetTimeout(() => {\n${match}\n}, 50);`
    );
}

function injectVisualizationReady(html) {
    // Inject postMessage at the end of every <script> block
    return html.replace(/<script>([\s\S]*?)<\/script>/g, (match, scriptContent) => {
        // Only inject if not already present
        if (scriptContent.includes('visualization-ready')) return match;
        return `<script>${scriptContent}\nwindow.parent.postMessage({ type: 'visualization-ready' }, '*');<\/script>`;
    });
}

const DynamicCodeRenderer = ({ fullHtmlCode }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Clean the HTML code (strip markdown fences)
    let cleanHtml = stripMarkdownFences(fullHtmlCode);
    cleanHtml = patchArrowCreation(cleanHtml);
    cleanHtml = injectVisualizationReady(cleanHtml);

    console.log('DynamicCodeRenderer cleanHtml:', cleanHtml);

    useEffect(() => {
        // Simulate loading for a short time, then show the content
        setLoading(true);
        setError(null);
        const timer = setTimeout(() => setLoading(false), 300); // 300ms delay for effect
        return () => clearTimeout(timer);
    }, [cleanHtml]);

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }
    if (loading) {
        return <div>Loading visualization...</div>;
    }

    return (
        <div
            style={{
                width: '100%',
                minHeight: '500px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                marginTop: '10px',
                background: '#fff',
                overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
};

export default DynamicCodeRenderer; 