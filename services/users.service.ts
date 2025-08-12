import api from './api'
import type { 
  UserResponseDto, 
  CreateUserDto, 
  UpdateUserDto,
  PaginationParams,
  PaginatedResponse
} from '@/types/auth'

/**
 * THE MESSENGER - Users Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 */
class UsersService {
  /**
   * Get paginated list of users
   */
  async getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.search) searchParams.append('search', params.search)
    if (params.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const queryString = searchParams.toString()
    const url = queryString ? `/users?${queryString}` : '/users'
    
    const response = await api.get<PaginatedResponse<UserResponseDto>>(url)
    return response.data
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponseDto> {
    const response = await api.get<UserResponseDto>(`/users/${id}`)
    return response.data
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const response = await api.post<UserResponseDto>('/users', userData)
    return response.data
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: UpdateUserDto): Promise<UserResponseDto> {
    const response = await api.patch<UserResponseDto>(`/users/${id}`, userData)
    return response.data
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  }
}

// Export singleton instance
export const usersService = new UsersService()
export default usersService