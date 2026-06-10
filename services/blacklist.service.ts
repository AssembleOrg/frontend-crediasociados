import api from './api';

export interface BlacklistedClient {
  id: string;
  dni: string;
  fullName: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

class BlacklistService {
  async getAll(): Promise<BlacklistedClient[]> {
    const response = await api.get('/blacklist');
    return response.data?.data || response.data || [];
  }

  async add(data: {
    dni: string;
    fullName: string;
    reason: string;
  }): Promise<BlacklistedClient> {
    const response = await api.post('/blacklist', data);
    return response.data?.data || response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/blacklist/${id}`);
  }

  async checkDni(
    dni: string
  ): Promise<{ isBlacklisted: boolean; entry: BlacklistedClient | null }> {
    const response = await api.get('/blacklist/check', { params: { dni } });
    return response.data?.data || response.data;
  }
}

export const blacklistService = new BlacklistService();
export default blacklistService;
