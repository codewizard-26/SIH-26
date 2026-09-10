import axios from 'axios';

// Resolve base URL from Vite environment variable or fall back to /api
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds for heavy OCR/vision processing
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor (can attach auth tokens or inspection context if needed)
api.interceptors.request.use(
  (config) => {
    // If sending FormData (e.g. image uploads), allow browser to set boundary header
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error formatting
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Format error response consistently
    const formattedError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      details: error.response?.data?.error?.details || [],
      status: error.response?.status || 0,
    };
    return Promise.reject(formattedError);
  }
);

export default api;
