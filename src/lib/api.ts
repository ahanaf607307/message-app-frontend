import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration or errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        // Return a pending promise to halt the promise chain during redirect
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default api;
