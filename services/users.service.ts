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
  private getNestedValue<T>(value: unknown, path: string[]): T | undefined {
    return path.reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, value) as T | undefined;
  }

  private extractPaginatedUsersPayload(
    value: unknown
  ): PaginatedResponse<UserResponseDto> {
    const payloadCandidates: unknown[] = [
      this.getNestedValue<unknown>(value, ['data']), // response.data
      this.getNestedValue<unknown>(value, ['data', 'data']), // legacy nested
      this.getNestedValue<unknown>(value, ['data', 'data', 'data']), // deeply nested legacy
      value,
    ];

    for (const candidate of payloadCandidates) {
      if (!candidate || typeof candidate !== 'object') continue;
      const candidateObj = candidate as Record<string, unknown>;

      const data = Array.isArray(candidateObj.data)
        ? (candidateObj.data as UserResponseDto[])
        : undefined;
      const meta =
        candidateObj.meta && typeof candidateObj.meta === 'object'
          ? (candidateObj.meta as PaginatedResponse<UserResponseDto>['meta'])
          : undefined;

      if (data) {
        return {
          data,
          meta: meta ?? {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
          },
        };
      }
    }

    return {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async getUsers(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    const response = await api.get(url);

    return this.extractPaginatedUsersPayload(response.data);
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
    const response = await api.patch(`/users/${id}`, userData);
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  async recalculateUserQuota(id: string): Promise<{
    message: string;
    previousUsedQuota: number;
    newUsedQuota: number;
  }> {
    const response = await api.post(`/users/${id}/recalculate-quota`);
    return response.data;
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

    
    const response = await api.get(url);

    return this.extractPaginatedUsersPayload(response.data);
  }
}

export const usersService = new UsersService();
export default usersService;
