import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, loginUser, getUserProfile, refreshAccessToken, logoutUser } from '../services/authService';
import { setAuthToken as setProjectAuthToken } from '../services/projectService';
import { setAuthToken as setAuthAuthToken } from '../services/authService';
import { setCustomSheetsAuthToken } from '../services/customSheetsService';
import { setMmsRfiAuthToken } from '../services/mmsRfiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedRefreshToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      // Set the auth token for API calls
      setProjectAuthToken(storedToken);
      setAuthAuthToken(storedToken);
      setCustomSheetsAuthToken(storedToken);
      setMmsRfiAuthToken(storedToken);
    }
  }, []);

  // Token refresh effect
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (token && refreshToken) {
      // Set up token refresh (refresh 5 minutes before expiration)
      refreshInterval = setInterval(async () => {
        try {
          const response = await refreshAccessToken(refreshToken);
          setToken(response.accessToken);
          setRefreshToken(response.refreshToken);
          
          // Update localStorage
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          // Update API clients
          setProjectAuthToken(response.accessToken);
          setAuthAuthToken(response.accessToken);
          setCustomSheetsAuthToken(response.accessToken);
          setMmsRfiAuthToken(response.accessToken);
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
        }
      }, 10 * 60 * 1000); // Refresh every 10 minutes (access token expires in 15 minutes)
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [token, refreshToken]);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await loginUser({ email, password });
      
      setToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set the auth token for API calls
      setProjectAuthToken(response.accessToken);
      setAuthAuthToken(response.accessToken);
      setCustomSheetsAuthToken(response.accessToken);
      setMmsRfiAuthToken(response.accessToken);
    } catch (error) {
      throw error;
    }
  };

  // Function to refresh user profile from API
  const refreshUserProfile = async () => {
    if (token) {
      try {
        const profile = await getUserProfile();
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      
      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear the auth token for API calls
      setProjectAuthToken(null);
      setAuthAuthToken(null);
      setCustomSheetsAuthToken(null);
      setMmsRfiAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, isAuthenticated, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};