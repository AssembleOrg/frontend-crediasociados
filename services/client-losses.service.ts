import api from './api';

export interface LoanSnapshotItem {
  loanId: string;
  loanTrack: string;
  prevStatus: string;
  pendingAmount: number;
}

export interface ClientLoss {
  id: string;
  clientId: string;
  managerId: string;
  reason: string;
  notes?: string | null;
  lostAmount: string | number;
  loansSnapshot: LoanSnapshotItem[];
  lossAt: string;
  blacklistId?: string | null;
  revertedAt: string | null;
  revertedById: string | null;
  createdAt: string;
  client?: { id: string; fullName: string; dni?: string | null };
  manager?: { id: string; fullName: string; email?: string };
  revertedBy?: { id: string; fullName: string } | null;
  canRevert?: boolean;
  revertibleUntil?: string;
}

export interface ClientLossesPage {
  items: ClientLoss[];
  total: number;
  page: number;
  totalPages: number;
}

class ClientLossesService {
  /** Baja de cliente por pérdida (solo cobrador). */
  async markAsLoss(clientId: string, notes?: string): Promise<ClientLoss> {
    const response = await api.post(`/client-losses/client/${clientId}`, {
      notes: notes || undefined,
    });
    return response.data?.data || response.data;
  }

  async getAll(params?: {
    page?: number;
    limit?: number;
  }): Promise<ClientLossesPage> {
    const response = await api.get('/client-losses', { params });
    return response.data?.data || response.data;
  }

  /** Reversión por subadmin dentro de la ventana de 96hs. */
  async revert(lossId: string): Promise<ClientLoss> {
    const response = await api.post(`/client-losses/${lossId}/revert`);
    return response.data?.data || response.data;
  }
}

export const clientLossesService = new ClientLossesService();
export default clientLossesService;
