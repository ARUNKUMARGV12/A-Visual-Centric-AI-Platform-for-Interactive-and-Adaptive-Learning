import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component that displays visualization suggestions with clickable buttons
 */
function VisualizationSuggestions({ suggestions, onSelectVisualization }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="visualization-suggestions bg-gray-800 p-4 rounded-lg border border-blue-500 mt-4">
      <h3 className="text-lg font-medium text-white mb-2">Suggested Visualizations</h3>
      <p className="text-gray-300 text-sm mb-3">
        Click on any of these suggestions to see a visualization that will help you understand the concept better:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectVisualization(suggestion)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm flex items-center transition duration-200"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

VisualizationSuggestions.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.string),
  onSelectVisualization: PropTypes.func.isRequired
};

export default VisualizationSuggestions; 