import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api from '../services/api';
import authService from '../services/authService';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, TOKEN_EXPIRY_KEY } from '../utils/constants';

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface RegistrationData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  register: (data: RegistrationData) => Promise<any>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => false,
  logout: () => {},
  refreshUserData: async () => {},
  register: async () => ({}),
  changePassword: async () => ({}),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Check if token is expired and attempt to refresh it first
      if (authService.isTokenExpired()) {
        console.log("Token expired, attempting to refresh...");
        const newToken = await authService.refreshToken();
        if (!newToken) {
          console.warn("Failed to refresh token");
          // Don't immediately logout - try the API call anyway
        }
      }

      // Use the auth service to get current user data
      const userData = await authService.getCurrentUser();
      console.log("Current user data:", userData);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        // Save user data to local storage as backup
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } else {
        // Only clear auth if we're certain the user isn't authenticated
        // If there was a server error, try to recover with cached data
        const cachedUser = localStorage.getItem(USER_KEY);
        const hasValidToken = !!localStorage.getItem(ACCESS_TOKEN_KEY);
        
        if (cachedUser && hasValidToken) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log("Recovered authentication from cached user data");
          } catch (parseError) {
            console.error("Error parsing cached user:", parseError);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      // Try to recover from localStorage if possible
      const cachedUser = localStorage.getItem(USER_KEY);
      const hasValidToken = !!localStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (cachedUser && hasValidToken) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("Recovered from error using cached user data");
        } catch (parseError) {
          console.error("Error parsing cached user during recovery:", parseError);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  });

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await refreshUserData();
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to authenticate. Please log in again.');
        // Don't clear auth here - let the token refresh mechanism handle it
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login/', { email, password });
      
      if (response.data && response.data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
        
        if (response.data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh);
        }
        
        // Set token expiry (1 hour from now)
        const expiryTime = new Date();
        expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        setIsAuthenticated(true);
        
        // Set user data from response
        if (response.data.user) {
          setUser(response.data.user);
          // Store user data for recovery
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        } else {
          // Fetch user data if not included in login response
          await refreshUserData();
        }
        
        return true;
      } else {
        setError('Invalid login response. Please try again.');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('token_expiry');
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (data: RegistrationData): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register/', data);
      
      // If registration returns tokens, handle them like login
      if (response.data && response.data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
        
        if (response.data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh);
        }
        
        // Set token expiry (1 hour from now)
        const expiryTime = new Date();
        expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        setIsAuthenticated(true);
        
        // Set user data if included in response
        if (response.data.user) {
          setUser(response.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        } else {
          // Fetch user data if not included in registration response
          await refreshUserData();
        }
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.response?.data) {
        const errorMessage = typeof err.response.data === 'string' 
          ? err.response.data
          : JSON.stringify(err.response.data);
        setError(errorMessage);
      } else {
        setError('Registration failed. Please try again.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string, 
    newPassword: string, 
    confirmPassword: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/password/change/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      return response.data;
    } catch (err: any) {
      console.error('Password change error:', err);
      
      if (err.response?.data) {
        const errorMessage = typeof err.response.data === 'string' 
          ? err.response.data
          : JSON.stringify(err.response.data);
        setError(errorMessage);
      } else {
        setError('Failed to change password. Please try again.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        refreshUserData,
        register,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
