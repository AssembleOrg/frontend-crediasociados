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
  async getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/users?${queryString}` : '/users'
    
    const response = await api.get(url)
    
    return {
      data: response.data.data.data,
      meta: response.data.data.meta
    }
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const response = await api.post('/users', userData)
    return response.data.data
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserResponseDto> {
    const response = await api.put(`/users/${id}`, userData)
    return response.data.data
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  }

  async getUserHierarchy(id: string): Promise<any> {
    const response = await api.get(`/users/${id}/hierarchy`)
    return response.data.data
  }

  async getCreatedUsers(id: string, params: PaginationParams = {}): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/users/${id}/created-users?${queryString}` : `/users/${id}/created-users`
    
    const response = await api.get(url)
    
    return {
      data: response.data.data.data,
      meta: response.data.data.meta
    }
  }
}

export const usersService = new UsersService()
export default usersService