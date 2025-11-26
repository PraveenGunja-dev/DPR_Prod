import axios from 'axios';

// Define types
export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  role: 'supervisor' | 'Site PM' | 'PMAG';
}

export interface Supervisor {
  user_id: number;
  name: string;
  email: string;
  role: 'supervisor';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token for API requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    console.log("Setting auth token for authService"); // Debug log
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    console.log("Clearing auth token for authService"); // Debug log
    delete api.defaults.headers.common['Authorization'];
  }
};

// Register a new user
export const registerUser = async (userData: Omit<User, 'user_id'>): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Registration failed'
        : 'Network error'
    );
  }
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Login failed'
        : 'Network error'
    );
  }
};

// Get user profile
export const getUserProfile = async (): Promise<Omit<User, 'password'>> => {
  try {
    console.log("Fetching user profile with headers:", api.defaults.headers); // Debug log
    const response = await api.get<{ user: Omit<User, 'password'> }>('/auth/profile');
    return response.data.user;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch profile'
        : 'Network error'
    );
  }
};

// Get all supervisors (PMAG only)
export const getAllSupervisors = async (): Promise<Supervisor[]> => {
  try {
    console.log("Fetching supervisors with headers:", api.defaults.headers); // Debug log
    const response = await api.get<Supervisor[]>('/auth/supervisors');
    console.log("Supervisors response:", response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error("Error fetching supervisors:", error); // Debug log
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch supervisors'
        : 'Network error'
    );
  }
};