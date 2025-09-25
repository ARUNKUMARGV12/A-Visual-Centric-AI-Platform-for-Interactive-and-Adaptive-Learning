import React, { useState } from 'react';
import axios from 'axios'; // Using axios for easier multipart/form-data handling

function DocumentUpload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(''); // To show success/error messages
    const [progress, setProgress] = useState(0);

    const handleFileChange = (event) => {
        setSelectedFiles([...event.target.files]);
        setUploadStatus(''); // Clear previous status
        setProgress(0);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setUploadStatus('Please select files to upload.');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading...');
        setProgress(0);

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file); // 'files' should match the backend File(...) parameter name
        });

        try {
            const response = await axios.post('http://localhost:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });
            
            setUploadStatus(response.data.message || 'Files uploaded successfully!');
            setSelectedFiles([]); // Clear selection
            document.getElementById('fileInput').value = null; // Reset file input
        } catch (error) {
            console.error('Error uploading files:', error);
            if (error.response && error.response.data && error.response.data.detail) {
                setUploadStatus(`Upload failed: ${error.response.data.detail}`);
            } else if (error.message) {
                setUploadStatus(`Upload failed: ${error.message}`);
            } else {
                setUploadStatus('Upload failed. Please try again.');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-6 bg-card rounded-lg shadow-custom">
            <h2 className="text-2xl font-bold text-primary mb-3">Upload Documents</h2>
            <p className="text-accent mb-6">Upload PDF or DOCX files to add them to the knowledge base.</p>
            
            <div className="space-y-6">
                <div className="relative">
                    <input 
                        type="file" 
                        id="fileInput"
                        multiple 
                        onChange={handleFileChange} 
                        accept=".pdf,.docx"
                        className="sr-only"
                        disabled={uploading}
                    />
                    <label 
                        htmlFor="fileInput" 
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-hover transition-colors duration-200"
                    >
                        <div className="text-center">
                            <svg className="w-8 h-8 mx-auto mb-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-primary">
                                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Choose Files...'}
                            </p>
                            <p className="text-sm text-secondary mt-1">PDF, DOCX up to 10MB</p>
                        </div>
                    </label>
                </div>

                {selectedFiles.length > 0 && !uploading && (
                    <div className="bg-hover rounded-lg p-4 border border-border">
                        <h4 className="text-primary font-medium mb-2">Selected Files:</h4>
                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                                <li key={index} className="text-accent text-sm flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-brand" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    {file.name} ({Math.round(file.size / 1024)} KB)
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button 
                    onClick={handleUpload} 
                    disabled={uploading || selectedFiles.length === 0}
                    className={`w-full py-3 rounded-md font-medium ${
                        uploading || selectedFiles.length === 0
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-brand hover:bg-brand-hover'
                    } text-white transition-colors duration-200`}
                >
                    {uploading ? `Uploading... ${progress}%` : 'Upload Selected Files'}
                </button>
            </div>

            {uploadStatus && (
                <div className={`mt-4 p-3 rounded-md ${
                    uploadStatus.startsWith('Upload failed')
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-green-900/30 text-green-400'
                }`}>
                    {uploadStatus}
                </div>
            )}
            
            {uploading && progress > 0 && (
                <div className="mt-4 bg-hover rounded-full h-4 overflow-hidden">
                    <div 
                        className="h-full bg-brand text-xs flex items-center justify-center text-white transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    >
                        {progress}%
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentUpload; 