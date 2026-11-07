/**
 * WorkNear HTTP API Client
 * Configures Axios instance with baseURL, automatic Bearer JWT injection,
 * and global 401 interception to synchronize authentication state across the app.
 */

import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor: Token & Cookie Credentials
// ============================================================================
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const token = localStorage.getItem('worknear_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// Response Interceptor: 401 Auto-Purge
// ============================================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('worknear_token');
      localStorage.removeItem('worknear_user');
    }
    return Promise.reject(error);
  }
);

export default api;
