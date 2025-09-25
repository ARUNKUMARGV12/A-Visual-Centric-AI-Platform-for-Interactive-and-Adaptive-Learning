import React, { useState } from 'react';
import axios from 'axios';

function Sources() {
  const [files, setFiles] = useState([]);
  const [uploadedSources, setUploadedSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    for (let file of files) {
      formData.append('files', file);
    }

    try {
      await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedSources(prev => [...prev, ...Array.from(files).map(file => file.name)]);
      setFiles([]);
    } catch (err) {
      setError('Failed to upload files: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sources-section">
      <h2>Sources</h2>
      <input
        type="file"
        accept=".pdf,.docx"
        multiple
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <p className="error">{error}</p>}
      <div className="sources-list">
        {uploadedSources.length > 0 ? (
          <ul>
            {uploadedSources.map((source, index) => (
              <li key={index}>{source}</li>
            ))}
          </ul>
        ) : (
          <p>No sources uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

export default Sources;