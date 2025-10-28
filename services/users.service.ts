import api from './api';
import type {
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  PaginatedResponse,
} from '@/types/auth';

/**
 * THE MESSENGER - Users Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 */
class UsersService {
  async getUsers(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    const response = await api.get(url);

    return {
      data: response.data.data.data,
      meta: response.data.data.meta,
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const response = await api.post('/users', userData);
    return response.data.data;
  }

  async updateUser(
    id: string,
    userData: UpdateUserDto
  ): Promise<UserResponseDto> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  async getUserHierarchy(id: string): Promise<any> {
    const response = await api.get(`/users/${id}/hierarchy`);
    return response.data.data;
  }

  async getCreatedUsers(
    id: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${id}/created-users?${queryString}`
      : `/users/${id}/created-users`;

    console.log('🔍 [DEBUG] getCreatedUsers URL:', url);

    const response = await api.get(url);

    console.log('🔍 [DEBUG] getCreatedUsers response structure:', {
      status: response.status,
      data: response.data,
      dataKeys: Object.keys(response.data || {}),
      nestedData: response.data?.data,
      nestedDataKeys: response.data?.data
        ? Object.keys(response.data.data)
        : 'no nested data',
    });

    // Try different response structures
    let data, meta;

    if (response.data?.data?.data) {
      // Structure: response.data.data.data
      data = response.data.data.data;
      meta = response.data.data.meta;
      console.log(
        '🔍 [DEBUG] Using nested structure (response.data.data.data)'
      );
    } else if (response.data?.data) {
      // Structure: response.data.data (direct array)
      data = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.data;
      meta = response.data.meta;
      console.log('🔍 [DEBUG] Using simple structure (response.data.data)');
    } else if (Array.isArray(response.data)) {
      // Structure: response.data (direct array)
      data = response.data;
      meta = {
        total: response.data.length,
        page: 1,
        limit: response.data.length,
      };
      console.log('🔍 [DEBUG] Using direct array structure (response.data)');
    } else {
      console.error('🚨 [ERROR] Unknown response structure:', response.data);
      throw new Error('Estructura de respuesta inesperada del servidor');
    }

    console.log('🔍 [DEBUG] Final data:', { dataLength: data?.length, meta });

    return { data, meta };
  }
}

export const usersService = new UsersService();
export default usersService;
