import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY, USER_KEY } from '../utils/constants';
import authService from './authService';

// Define base API URL - ensuring no trailing slash
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increase timeout to 60 seconds (from 15 seconds)
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to process queue of pending requests
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Function to add request to queue
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};


// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    // Skip authentication for login, register, and password reset
    const skipAuthPaths = [
      '/auth/login/', 
      '/auth/register/', 
      '/auth/password/reset/',
      '/auth/password/reset/confirm/',
      '/auth/token/refresh/'
    ];

    // Add auth token except for excluded paths
    if (config.url && !skipAuthPaths.some(path => config.url?.includes(path))) {
      // Check if token is expired and needs refresh
      if (authService.isTokenExpired()) {
        try {
          // Try to refresh the token before proceeding
          const newToken = await authService.refreshToken();
          if (newToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error("Failed to refresh token:", error);
          // Token refresh failed, but we'll still try with the current token
        }
      } else {
        // Use existing token
        const token = authService.getAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response [${response.status}]:`, response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // If there's no config or it's already retried, reject immediately
    if (!originalRequest || (originalRequest as any)._retry) {
      return Promise.reject(error);
    }

    // For 500 server errors on auth/me, don't redirect to login (special case)
    if (error.response?.status === 500 && originalRequest.url?.includes('/auth/me/')) {
      console.warn('Server error on auth/me endpoint - not redirecting to login');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log("Received 401 Unauthorized - attempting token refresh");
      
      // Get refresh token
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      // If no refresh token, redirect to login
      if (!refreshToken) {
        console.log("No refresh token available - clearing auth and redirecting to login");
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If not already refreshing
      if (!isRefreshing) {
        isRefreshing = true;
        console.log("Starting token refresh process");
        
        try {
          // Try to get new access token
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (!response.data || !response.data.access) {
            throw new Error("Invalid response from refresh token endpoint");
          }
          
          const { access } = response.data;
          console.log("Successfully refreshed token");
          
          // Store new access token
          localStorage.setItem(ACCESS_TOKEN_KEY, access);
          
          // Update token expiry
          const expiryTime = new Date();
          expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000); // 1 hour
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
          
          // Process pending requests
          onRefreshed(access);
          
          // Retry original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          (originalRequest as any)._retry = true;
          
          console.log("Retrying original request with new token");
          return axios(originalRequest);
          
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          
          // Check if we have cached user data before redirecting
          const cachedUser = localStorage.getItem(USER_KEY);
          
          if (cachedUser && !originalRequest.url?.includes('/auth/me/')) {
            // Only redirect if not trying to fetch user data
            // Refresh failed, clear all auth data and redirect to login
            localStorage.clear();
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If already refreshing, queue this request
        console.log("Token refresh already in progress, queueing request");
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            // Replace the expired token and retry
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            (originalRequest as any)._retry = true;
            resolve(axios(originalRequest));
          });
        });
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// Add request interceptor to log requests
api.interceptors.request.use(request => {
  console.log('API Request:', {
    method: request.method,
    url: request.url,
    params: request.params,
    headers: request.headers,
    data: request.data
  });
  return request;
});

export default api;
