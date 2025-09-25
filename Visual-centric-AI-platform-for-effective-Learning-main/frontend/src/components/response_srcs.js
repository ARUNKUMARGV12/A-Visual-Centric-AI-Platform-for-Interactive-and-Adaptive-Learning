import React from 'react';
import { RiFileTextLine } from 'react-icons/ri';

const Sources = ({ sources }) => {
    if (!sources || sources.length === 0) {
        return <div className="text-gray-400 p-4 text-center italic">No sources available.</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-gray-100 font-medium text-lg mb-3 flex items-center">
                <RiFileTextLine className="mr-2 text-blue-400" />
                Sources
            </h3>
            <div className="space-y-3">
                {sources.map((source, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-md p-3 border border-gray-600/50">
                        <div className="text-gray-200 text-sm mb-3 leading-relaxed">
                            {source.page_content.slice(0, 200)}{source.page_content.length > 200 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                            {source.metadata && source.metadata.filename && (
                                <div className="flex items-center">
                                    <RiFileTextLine className="mr-1" />
                                    <span>{source.metadata.filename}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sources;