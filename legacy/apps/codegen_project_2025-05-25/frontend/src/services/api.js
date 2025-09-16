import axios from 'axios';

// Determine the base URL for the backend API.
// This assumes an environment variable `REACT_APP_BACKEND_URL` is set,
// common in React applications configured with Create React App or similar tools.
// Provides a fallback for local development if the variable is not set.
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

// Create an Axios instance with a base URL and default headers.
// This centralizes configuration and makes it easier to manage requests.
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Standardizes successful API responses.
 * @param {object} response - The Axios response object.
 * @returns {{success: boolean, data: any, error: null}} A consistent success object.
 */
const handleApiResponse = (response) => ({
  success: true,
  data: response.data,
  error: null,
});

/**
 * Standardizes API error handling.
 * @param {Error} error - The Axios error object.
 * @returns {{success: boolean, data: null, error: {message: string, details: any, statusCode: number|null}}} A consistent error object.
 */
const handleApiError = (error) => {
  console.error('API call failed:', error); // Log the full error for debugging

  let errorMessage = 'An unexpected error occurred.';
  let errorDetails = null;
  let statusCode = null;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = error.response.data.message || error.response.statusText || 'Server error';
    errorDetails = error.response.data;
    statusCode = error.response.status;
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from the server. Please check your network connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

  return {
    success: false,
    data: null,
    error: {
      message: errorMessage,
      details: errorDetails,
      statusCode: statusCode,
    },
  };
};

// --- API Functions for DermRefGen ---

/**
 * Submits the user's external LLM API key to the backend for secure handling.
 * This key is not stored client-side but sent to the backend for its AI operations.
 * @param {string} apiKey - The API key provided by the user.
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const submitUserApiKey = async (apiKey) => {
  try {
    const response = await api.post('/api-key', { apiKey }); // Endpoint for API key submission
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Uploads PDF files to the backend for processing.
 * Uses 'multipart/form-data' for file uploads.
 * @param {FileList} files - A FileList object (e.g., from an HTML <input type="file" multiple>).
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const uploadPdfs = async (files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    // Append each file under the name 'pdfs'. This name should match the backend's expected field.
    formData.append('pdfs', files[i]);
  }

  try {
    const response = await api.post('/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Override default Content-Type for file uploads
      },
      // You can add an onUploadProgress callback here for showing upload progress
      // onUploadProgress: (progressEvent) => {
      //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      //   console.log(`Upload progress: ${percentCompleted}%`);
      // }
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Triggers the backend to start processing previously uploaded documents.
 * Can optionally specify which documents to process by their IDs.
 * @param {string[]} [documentIds=[]] - Optional array of document IDs to process. If empty, the backend might process all pending.
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const triggerDocumentProcessing = async (documentIds = []) => {
  try {
    const response = await api.post('/process-documents', { documentIds });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetches a list of all processed dermatologic condition entries from the backend.
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getConditions = async () => {
  try {
    const response = await api.get('/conditions');
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetches a specific dermatologic condition entry by its unique ID.
 * @param {string} conditionId - The unique identifier of the dermatologic condition.
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getConditionById = async (conditionId) => {
  try {
    const response = await api.get(`/conditions/${conditionId}`);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Updates a specific dermatologic condition entry on the backend.
 * This is used during the iterative review and refinement process.
 * @param {string} conditionId - The unique identifier of the condition to update.
 * @param {object} updatedConditionData - An object containing the fields to update for the condition.
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updateCondition = async (conditionId, updatedConditionData) => {
  try {
    const response = await api.put(`/conditions/${conditionId}`, updatedConditionData);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Requests the backend to provide the finalized dermatologic condition data for download.
 * The backend is expected to return the data as a JSON array.
 * @param {string[]} [conditionIds=[]] - Optional array of specific condition IDs to download. If empty, all refined conditions might be returned.
 * @returns {Promise<{success: boolean, data: any, error: any}>} The processed JSON data.
 */
export const downloadConditions = async (conditionIds = []) => {
  try {
    const response = await api.post('/download', { conditionIds }, {
      responseType: 'json', // Expecting JSON data from the backend
    });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};