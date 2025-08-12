import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiError } from '@/types/auth'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token management
let currentToken: string | null = null

export const setAuthToken = (token: string | null) => {
  currentToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Add token if available and not already set
    if (currentToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${currentToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors consistently
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500
    }

    if (error.response) {
      // Server responded with error status
      apiError.statusCode = error.response.status
      apiError.message = error.response.data?.message || error.response.statusText
      apiError.error = error.response.data?.error
    } else if (error.request) {
      // Network error
      apiError.message = 'Network error - please check your connection'
      apiError.statusCode = 0
    } else {
      // Something else happened
      apiError.message = error.message || 'Request failed'
    }

    return Promise.reject(apiError)
  }
)

export default api
export type { AxiosRequestConfig, AxiosResponse }