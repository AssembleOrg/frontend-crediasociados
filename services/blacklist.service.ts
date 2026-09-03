import api from './api';

export interface BlacklistedClient {
  id: string;
  dni: string | null;
  cuit: string | null;
  fullName: string;
  reason: string;
  createdBy: string;
  clientId: string | null;
  clientLossId: string | null;
  createdAt: string;
}

class BlacklistService {
  async getAll(): Promise<BlacklistedClient[]> {
    const response = await api.get('/blacklist');
    return response.data?.data || response.data || [];
  }

  async add(data: {
    dni?: string;
    cuit?: string;
    fullName: string;
    reason: string;
    clientId?: string;
  }): Promise<BlacklistedClient> {
    const response = await api.post('/blacklist', data);
    return response.data?.data || response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/blacklist/${id}`);
  }

  /** Chequea por DNI y/o CUIT contra la lista negra activa (compartida). */
  async check(params: {
    dni?: string;
    cuit?: string;
  }): Promise<{ isBlacklisted: boolean; entry: BlacklistedClient | null }> {
    const response = await api.get('/blacklist/check', { params });
    return response.data?.data || response.data;
  }
}

export const blacklistService = new BlacklistService();
export default blacklistService;
