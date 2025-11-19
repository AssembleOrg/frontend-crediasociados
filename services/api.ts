import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '@/types/auth';
import { useAuthStore } from '@/stores/auth';

// Use Next.js proxy in browser, direct URL in server-side
const API_BASE_URL = typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_API_URL  // Server-side: use full URL
  : '/api';  // Client-side: use Next.js proxy

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies for auth
});

let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.request.use(
  (config) => {
    if (currentToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    // Debug logging para wallets
    if (config.url?.includes('wallets')) {
      console.log('[API DEBUG] Wallet request:', {
        url: config.url,
        hasToken: !!currentToken,
        authHeader: config.headers['Authorization'] ? 'SET' : 'NOT SET',
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const apiError: ApiError = {
      message: 'Ocurrió un error inesperado',
      statusCode: 500,
    };

    if (error.response) {
      apiError.statusCode = error.response.status;
      apiError.message =
        error.response.data?.message || error.response.statusText;
      apiError.error = error.response.data?.error;

      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        // Only redirect in client-side (browser)
        if (typeof window !== 'undefined') {
          // Avoid redirect loop if already on login page
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            console.warn('🔒 401 Unauthorized - Clearing auth and redirecting to login');
            
            // Clear auth token
            setAuthToken(null);
            
            // Clear auth store
            const authStore = useAuthStore.getState();
            authStore.clearAuth();
            
            // Redirect to login
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      apiError.message = 'Error de conexión - por favor verifique su conexión a internet';
      apiError.statusCode = 0;
    } else {
      // Something else happened
      apiError.message = error.message || 'Error en la solicitud';
    }

    return Promise.reject(apiError);
  }
);

export default api;
export type { AxiosRequestConfig, AxiosResponse };
