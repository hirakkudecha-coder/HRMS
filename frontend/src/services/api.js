// Import axios to make HTTP requests
import axios from 'axios';

// Create a pre-configured axios instance
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`, // Base URL of our Express backend API
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios Request Interceptor: Run this before every single API request is dispatched
api.interceptors.request.use(
  (config) => {
    // Attempt to pull the JWT authentication token from the browser's localStorage
    const token = localStorage.getItem('token');
    
    // If a token is found, inject it into the HTTP Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // If interceptor encounters an error, reject the promise
    return Promise.reject(error);
  }
);

// Export the API client
export default api;
