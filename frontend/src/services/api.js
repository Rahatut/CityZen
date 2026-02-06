import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL: prefer EXPO env, fallback to dev/prod defaults
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : (__DEV__ ? 'http://localhost:3000/api' : 'https://your-production-url.com/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only clear auth data if it's an actual auth endpoint or token verification failure
      // Don't clear for other endpoints that might return 401 for different reasons
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const isTokenExpired = error.response?.data?.message?.toLowerCase().includes('token');
      
      if (isAuthEndpoint || isTokenExpired) {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        // Save token and user data
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      // Still clear local storage even if API call fails
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
  }
};

// Complaint API calls
export const complaintAPI = {
  checkDuplicate: async (latitude, longitude, categoryId) => {
    try {
      const response = await api.post('/complaints/check-duplicate', {
        latitude,
        longitude,
        categoryId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  }
};

export default api;