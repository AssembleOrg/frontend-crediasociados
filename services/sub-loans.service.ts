import api from './api';
import { requestDeduplicator } from '@/lib/request-deduplicator';
import type { SubLoanResponseDto } from '@/types/export';

interface SubLoanStatsResponseDto {
  totalDueToday: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  totalAmount: number;
}

interface ActivationResultDto {
  activatedCount: number;
  message: string;
}

/**
 * SubLoan with client information (from backend)
 * Used for reports and analytics
 */
export interface SubLoanWithClientDto {
  id: string
  loanId: string
  amount: number
  totalAmount: number
  paidAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  dueDate: string
  paymentNumber: number
  createdAt: string
  loan: {
    id: string
    loanTrack: string
    amount: number
    currency: string
    paymentFrequency: string
  }
  client: {
    id: string
    fullName: string
    dni?: string
    phone?: string
  }
}

export interface OverdueInstallment {
  id: string
  paymentNumber: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  dueDate: string
  status: string
}

export interface OverdueClientLoan {
  id: string
  loanTrack: string
  amount: number
  originalAmount: number
  currency: string
  paymentFrequency: string
  totalPayments: number
  overdueInstallments: OverdueInstallment[]
}

export interface OverdueClientEntry {
  client: {
    id: string
    fullName: string
    dni: string | null
    phone: string | null
  }
  manager: {
    id: string
    fullName: string
  }
  loans: OverdueClientLoan[]
  totalOverdueAmount: number
  totalOverdueInstallments: number
}

export interface CobrosClientSubLoan {
  id: string
  loanId: string
  paymentNumber: number
  amount: number
  totalAmount: number
  paidAmount: number
  status: string
  dueDate: string
  paidDate: string | null
  loanTrack: string
  loanTotalPayments?: number
  payments?: Array<{ id: string; amount: number; paymentDate: string; description?: string; createdAt: string }>
}

export interface CobrosClient {
  client: { id: string; fullName: string; dni: string | null; phone: string | null }
  subLoans: CobrosClientSubLoan[]
  stats: {
    overdue: number
    today: number
    soon: number
    paid: number
    total: number
    totalAmount: number
    paidAmount: number
  }
  urgencyLevel: 'overdue' | 'today' | 'soon' | 'future'
}

export interface CobrosGlobalStats {
  overdue: number
  today: number
  soon: number
  future: number
  paid: number
  total: number
}

export interface CobrosResponse {
  clients: CobrosClient[]
  globalStats: CobrosGlobalStats
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export interface OverdueClientsResponse {
  clients: OverdueClientEntry[]
  total: number
  totalOverdueAmount: number
  totalOverdueInstallments: number
}

/**
 * THE MESSENGER - SubLoans Service
 * Simple, testable functions that only communicate with the API.
 *
 * NOTA: SubLoans ahora soportan estado PARTIAL para pagos parciales
 * Estados: PENDING | PARTIAL | PAID | OVERDUE
 * El historial de pagos se guarda en formato JSON en el SubLoan
 */
class SubLoansService {
  private getNestedValue<T>(value: unknown, path: string[]): T | undefined {
    return path.reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, value) as T | undefined;
  }

  private extractArrayPayload<T>(value: unknown): T[] {
    const arrayCandidates: unknown[] = [
      this.getNestedValue<unknown>(value, ['data', 'data']), // deeply nested legacy
      this.getNestedValue<unknown>(value, ['data']), // standard wrapped payload
      value,
    ];

    for (const candidate of arrayCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }

    return [];
  }

  async getTodayDueSubLoans(): Promise<SubLoanResponseDto[]> {
    const response = await api.get('/sub-loans/today-due');
    return this.extractArrayPayload<SubLoanResponseDto>(response.data);
  }

  async getTodayDueSubLoansStats(): Promise<SubLoanStatsResponseDto> {
    const response = await api.get('/sub-loans/today-due/stats');
    return response.data.data || response.data;
  }

  async activateTodayDueSubLoans(): Promise<ActivationResultDto> {
    const response = await api.post('/sub-loans/activate-today-due');
    return response.data.data || response.data;
  }

  // Para cobros: obtener TODOS los subloans (no solo today-due)
  async getAllSubLoans(): Promise<SubLoanResponseDto[]> {
    const response = await requestDeduplicator.dedupe(
      'loans:get-all',
      () => api.get('/loans'),
      { ttl: 5000 }
    );

    // Extraer subloans de todos los préstamos
    const loans = this.extractArrayPayload<any>(response.data);
    const allSubLoans: SubLoanResponseDto[] = [];

    loans.forEach((loan: any) => {
      if (loan.subLoans && Array.isArray(loan.subLoans)) {
        // Preserve payments array if present
        loan.subLoans.forEach((subLoan: any) => {
          allSubLoans.push({
            ...subLoan,
            // Explicitly preserve payments array - it comes from API
            payments: Array.isArray(subLoan.payments) ? subLoan.payments : undefined
          } as SubLoanResponseDto & { payments?: any[] });
        });
      }
    });

    return allSubLoans;
  }

  async getSubLoanById(id: string): Promise<SubLoanResponseDto> {
    const response = await api.get(`/subloans/${id}`);
    return response.data.data;
  }

  async getSubLoansByLoanId(loanId: string): Promise<SubLoanResponseDto[]> {
    const response = await api.get(`/subloans/loan/${loanId}`);
    return this.extractArrayPayload<SubLoanResponseDto>(response.data);
  }

  /**
   * ✅ NEW: Get subloans with client information for reports
   * Uses backend endpoint: GET /subloans/with-client-info
   */
  async getSubLoansWithClientInfo(filters?: {
    status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
    dueDateFrom?: string  // ISO 8601
    dueDateTo?: string    // ISO 8601
  }): Promise<SubLoanWithClientDto[]> {
    const response = await api.get('/subloans/with-client-info', { params: filters });
    return response.data.data || response.data || [];
  }

  /**
   * Get clients with overdue installments, grouped by client
   * Uses backend endpoint: GET /sub-loans/overdue-clients
   */
  async getOverdueClients(): Promise<OverdueClientsResponse> {
    const response = await api.get('/sub-loans/overdue-clients');
    // ResponseInterceptor wraps in {data: {clients, total, ...}, success, message}
    const payload = response.data?.data || response.data;
    return payload as OverdueClientsResponse;
  }

  /**
   * Update the due date of a subloan
   */
  async updateDueDate(subLoanId: string, dueDate: string): Promise<any> {
    const response = await api.patch(`/sub-loans/${subLoanId}/due-date`, { dueDate });
    return response.data?.data || response.data;
  }

  /**
   * Get cobros data: server-side filtered, grouped by client, paginated, with global stats
   */
  async getCobros(filters?: {
    urgency?: 'overdue' | 'today' | 'soon' | 'future' | 'all'
    paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
    clientId?: string
    page?: number
    limit?: number
  }): Promise<CobrosResponse> {
    const params: Record<string, string> = {}
    if (filters?.urgency && filters.urgency !== 'all') params.urgency = filters.urgency
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus
    if (filters?.clientId) params.clientId = filters.clientId
    if (filters?.page) params.page = String(filters.page)
    if (filters?.limit) params.limit = String(filters.limit)

    const response = await api.get('/sub-loans/cobros', { params })
    return response.data?.data || response.data
  }

  /**
   * Helper: Calculate remaining amount for a SubLoan
   * Used in payment UI to show how much is left to pay
   */
  calculateRemainingAmount(subloan: SubLoanResponseDto): number {
    return Math.max(0, (subloan.totalAmount ?? subloan.amount ?? 0) - (subloan.paidAmount ?? 0));
  }

  /**
   * Helper: Determine payment status badge color and text
   * Used in UI for visual feedback
   */
  getStatusDisplay(status: string): {
    text: string;
    color: string;
    bgColor: string;
  } {
    const statusMap: Record<
      string,
      { text: string; color: string; bgColor: string }
    > = {
      PENDING: { text: 'Pendiente', color: '#FFA500', bgColor: '#FFF8E1' },
      PARTIAL: { text: 'Parcial', color: '#2196F3', bgColor: '#E3F2FD' },
      PAID: { text: 'Pagado', color: '#4CAF50', bgColor: '#E8F5E9' },
      OVERDUE: { text: 'Vencido', color: '#F44336', bgColor: '#FFEBEE' },
    };

    return (
      statusMap[status] || { text: status, color: '#999', bgColor: '#F5F5F5' }
    );
  }

  /**
   * Helper: Filter SubLoans by payment status
   * Useful for grouping subloans in UI
   */
  filterByStatus(
    subloans: SubLoanResponseDto[],
    status: string
  ): SubLoanResponseDto[] {
    return subloans.filter((subloan) => subloan.status === status);
  }

  /**
   * Helper: Calculate total amounts from list of subloans
   */
  calculateTotals(subloans: SubLoanResponseDto[]): {
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    totalOverdue: number;
  } {
    return subloans.reduce(
      (acc, subloan) => ({
        totalAmount: acc.totalAmount + (subloan.totalAmount ?? subloan.amount ?? 0),
        totalPaid: acc.totalPaid + (subloan.paidAmount ?? 0),
        totalRemaining:
          acc.totalRemaining +
          Math.max(0, (subloan.totalAmount ?? subloan.amount ?? 0) - (subloan.paidAmount ?? 0)),
        totalOverdue:
          acc.totalOverdue +
          (subloan.status === 'OVERDUE' ? (subloan.totalAmount ?? subloan.amount ?? 0) : 0),
      }),
      { totalAmount: 0, totalPaid: 0, totalRemaining: 0, totalOverdue: 0 }
    );
  }
}

export const subLoansService = new SubLoansService();
