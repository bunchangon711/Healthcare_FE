import api from './api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY, USER_KEY } from '../utils/constants';
import { AxiosError } from 'axios';


interface LoginResponse {
  access: string;
  refresh: string;
  user?: any;
}

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface PasswordResetData {
  token: string;
  new_password: string;
  confirm_password: string;
}

const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      
      // Store tokens in localStorage
      if (response.data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
        
        // Set token expiry (1 hour from now)
        const expiryTime = new Date();
        expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      if (response.data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },
  
  refreshToken: async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
      
      if (response.data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
        
        // Set new token expiry
        const expiryTime = new Date();
        expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // If response contains user data, update it
        if (response.data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }
        
        return response.data.access;
      } else {
        throw new Error('Invalid response from refresh token endpoint');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear all auth data on refresh failure
      authService.logout();
      
      return null;
    }
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (!token) {
        return null;
      }
      
      // Try to refresh token if expired before fetching user
      if (authService.isTokenExpired()) {
        console.log('Token expired, attempting to refresh before getting user data');
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          console.warn('Token refresh failed, user may need to login again');
        }
      }
      
      // First try to get cached user data if available
      const cachedUser = localStorage.getItem(USER_KEY);
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          // If the cached user data has a valid ID, use it
          if (userData && userData.id) {
            console.log('Using cached user data with ID:', userData.id);
            return userData;
          }
        } catch (e) {
          console.error('Error parsing cached user data:', e);
        }
      }
      
      // Try to get user from /auth/me/ endpoint
      try {
        const response = await api.get('/auth/me/');
        
        if (response.data && response.data.id) {
          // Ensure id is a string (MongoDB ObjectId handling)
          if (response.data.id && typeof response.data.id !== 'string') {
            response.data.id = String(response.data.id);
          }
          
          // Store user data in localStorage as a backup
          localStorage.setItem(USER_KEY, JSON.stringify(response.data));
          
          return response.data;
        }
      } catch (error) {
        const apiError = error as AxiosError;
        console.error('Error from /auth/me/ endpoint:', apiError);
        
        // For other errors, attempt token refresh before giving up
        if (apiError.response?.status === 401) {
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            // Try one more time with the new token
            try {
              const retryResponse = await api.get('/auth/me/');
              if (retryResponse.data && retryResponse.data.id) {
                // Store valid user data
                localStorage.setItem(USER_KEY, JSON.stringify(retryResponse.data));
                return retryResponse.data;
              }
            } catch (retryError) {
              console.error('Retry error after token refresh:', retryError);
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  isTokenExpired: (): boolean => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!expiry) {
      return true;
    }
    
    try {
      const expiryDate = new Date(expiry);
      const now = new Date();
      
      // Token is expired if expiry date is in the past
      return expiryDate <= now;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  },
  
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  requestPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await api.post('/auth/password/reset/', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },
  
  resetPassword: async (data: PasswordResetData): Promise<any> => {
    try {
      const response = await api.post('/auth/password/reset/confirm/', data);
      return response.data;
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  },
  
  clearTokens: () => {
    // This is essentially the same as logout
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export default authService;
