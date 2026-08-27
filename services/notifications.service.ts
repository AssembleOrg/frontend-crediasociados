import api from './api';

export type NotificationType =
  | 'CLIENT_CREATED'
  | 'CLIENT_LOSS'
  | 'CLIENT_LOSS_REVERTED'
  | 'LOAN_FINISHED_EARLY';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

class NotificationsService {
  async getMine(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsPage> {
    const response = await api.get('/notifications', { params });
    return response.data?.data || response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    const payload = response.data?.data || response.data;
    return payload?.count ?? 0;
  }

  async markRead(id: string): Promise<AppNotification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data?.data || response.data;
  }

  async markAllRead(): Promise<{ updated: number }> {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data || response.data;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
