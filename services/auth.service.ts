import api from './api'
import type { components } from '@/types/api-generated'
import type { LoginResponse, RefreshResponse, ChangePasswordDto } from '@/types/auth'

type LoginRequest = components['schemas']['LoginDto']

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
      user: backendData.user
    }
    
    return loginResponse
  }

  async refresh(): Promise<RefreshResponse> {
    await api.post('/auth/refresh')
    return { ok: true }
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  }

  clearAuth(): void {}

  async changePassword(changePasswordData: ChangePasswordDto): Promise<void> {
    await api.post('/auth/change-password', changePasswordData)
  }
}

export const authService = new AuthService()
export default authService
