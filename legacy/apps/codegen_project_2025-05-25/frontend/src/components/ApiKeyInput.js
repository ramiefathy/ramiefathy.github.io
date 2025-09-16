import React, { useState } from 'react';
import axios from 'axios';

const ApiKeyInput = ({ onApiKeySet, initialApiKeyStatus = false }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [keyAlreadyProvided, setKeyAlreadyProvided] = useState(initialApiKeyStatus);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!apiKey.trim()) {
      setError('API Key cannot be empty.');
      return;
    }

    setIsLoading(true);

    try {
      // Send the API key to the backend for secure handling and session management.
      // The Backend_API_Agent is responsible for validating and storing it.
      const response = await axios.post('/api/set-gemini-api-key', { apiKey });
      setMessage(response.data.message || 'API Key successfully set!');
      setKeyAlreadyProvided(true);
      setApiKey(''); // Clear the input field after successful submission
      if (onApiKeySet) {
        onApiKeySet(true); // Notify parent component that API key is set
      }
    } catch (err) {
      console.error('Failed to send API key:', err);
      const errorMessage = err.response?.data?.error || 'Failed to set API Key. Please ensure it is valid and try again.';
      setError(errorMessage);
      setKeyAlreadyProvided(false); // If there was an error, the key might not be set
      if (onApiKeySet) {
        onApiKeySet(false); // Notify parent component that API key setting failed
      }
    } finally {
      setIsLoading(false);
    }
  };

  const componentStyles = `
    .api-key-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      background-color: #f9f9f9;
      font-family: 'Arial, sans-serif';
    }

    .api-key-title {
      text-align: center;
      color: #333;
      margin-bottom: 25px;
      font-size: 24px;
    }

    .api-key-info-message {
      background-color: #e6ffe6;
      color: #006400;
      border: 1px solid #a3e9a4;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 15px;
    }

    .api-key-form-group {
      margin-bottom: 20px;
    }

    .api-key-label {
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: #555;
      font-size: 16px;
    }

    .api-key-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }

    .api-key-input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .api-key-input-description {
      font-size: 0.85em;
      color: #777;
      margin-top: 10px;
      line-height: 1.4;
    }

    .api-key-submit-button {
      width: 100%;
      padding: 12px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s ease, opacity 0.2s ease;
      box-shadow: 0 2px 5px rgba(0,123,255,0.2);
    }

    .api-key-submit-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .api-key-message-box {
      margin-top: 25px;
      border-radius: 4px;
      padding: 12px;
      text-align: center;
      font-size: 15px;
    }

    .api-key-success-message {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .api-key-error-message {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `;

  return (
    <>
      <style>{componentStyles}</style>
      <div className="api-key-container">
        <h2 className="api-key-title">Gemini Pro API Key Input</h2>

        {keyAlreadyProvided && !error && !message && (
          <p className="api-key-info-message">
            API Key is currently set for this session. You can enter a new one to update it.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="api-key-form-group">
            <label htmlFor="apiKey" className="api-key-label">
              Your Gemini Pro API Key:
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini Pro API key here"
              disabled={isLoading}
              className="api-key-input"
            />
            <p className="api-key-input-description">
              This key is required for our system to leverage Gemini Pro's capabilities for information extraction and refinement. It will be securely transmitted to our backend for session-based use only and will not be persistently stored on the client side.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="api-key-submit-button"
          >
            {isLoading ? 'Setting Key...' : 'Set API Key'}
          </button>
        </form>

        {message && (
          <p className="api-key-message-box api-key-success-message">
            {message}
          </p>
        )}
        {error && (
          <p className="api-key-message-box api-key-error-message">
            {error}
          </p>
        )}
      </div>
    </>
  );
};

export default ApiKeyInput;