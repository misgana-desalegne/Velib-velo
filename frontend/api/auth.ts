import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (data: { username: string; email: string; password: string; password2: string; first_name: string; last_name: string }) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  
  login: async (credentials: { username?: string; email?: string; password: string }) => {
    // Convert email to username if only email is provided
    const loginData = credentials.email 
      ? { email: credentials.email, password: credentials.password }
      : { username: credentials.username, password: credentials.password };
    const response = await api.post('/auth/login/', loginData);
    return response.data;
  },

  googleLogin: async (credential: string) => {
    const response = await api.post('/auth/google/', { credential });
    return response.data;
  },

  facebookLogin: async (accessToken: string) => {
    const response = await api.post('/auth/facebook/', { access_token: accessToken });
    return response.data;
  },
  
  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout/', { refresh_token: refreshToken });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/user/');
    return response.data;
  },
};

export default api;
