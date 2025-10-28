import api from './api';
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

/**
 * THE MESSENGER - SubLoans Service
 * Simple, testable functions that only communicate with the API.
 *
 * NOTA: SubLoans ahora soportan estado PARTIAL para pagos parciales
 * Estados: PENDING | PARTIAL | PAID | OVERDUE
 * El historial de pagos se guarda en formato JSON en el SubLoan
 */
class SubLoansService {
  async getTodayDueSubLoans(): Promise<SubLoanResponseDto[]> {
    const response = await api.get('/sub-loans/today-due');
    return response.data.data.data || response.data.data || [];
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
    // Usar loans sin paginación para extraer todos los subloans
    const response = await api.get('/loans');

    // Extraer subloans de todos los préstamos
    const loans = response.data.data || [];
    const allSubLoans: SubLoanResponseDto[] = [];

    loans.forEach((loan: any) => {
      if (loan.subLoans && Array.isArray(loan.subLoans)) {
        allSubLoans.push(...loan.subLoans);
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
    return response.data.data;
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
