import api, { setAuthToken } from './api'
import type { components } from '@/types/api-generated'
import type { LoginResponse, RefreshResponse } from '@/types/auth'

type LoginRequest = components['schemas']['LoginDto']
type RefreshRequest = components['schemas']['RefreshTokenDto']

/**
 * THE MESSENGER - Auth Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 */
class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials)
    
    const backendData = response.data.data
    
    const loginResponse: LoginResponse = {
      user: backendData.user,
      token: backendData.accessToken,
      refreshToken: backendData.refreshToken
    }
    setAuthToken(loginResponse.token)
    
    return loginResponse
  }

  async refresh(refreshData: RefreshRequest): Promise<RefreshResponse> {
    const response = await api.post('/auth/refresh', refreshData)
    const backendData = response.data.data
    
    const refreshResponse: RefreshResponse = {
      token: backendData.accessToken,
      refreshToken: backendData.refreshToken
    }
    setAuthToken(refreshResponse.token)
    
    return refreshResponse
  }

  async logout(refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } finally {
      setAuthToken(null)
    }
  }

  clearAuth(): void {
    setAuthToken(null)
  }
}

export const authService = new AuthService()
export default authService