import api from './api';
import { requestDeduplicator } from '@/lib/request-deduplicator';
import type {
  LoanResponseDto,
  LoanListResponseDto,
  CreateLoanDto,
  CreateLoanResponseDto,
  LoanTrackingResponseDto,
  PaginationParams,
  PaginatedResponse,
} from '@/types/auth';

/**
 * THE MESSENGER - Loans Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 *
 * NOTA: El backend ahora valida que el manager tenga saldo suficiente en su cartera
 * antes de permitir la creación de un préstamo. La cartera se debita automáticamente.
 */
class LoansService {
  private getNestedValue<T>(value: unknown, path: string[]): T | undefined {
    return path.reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, value) as T | undefined;
  }

  private extractPaginatedLoansPayload(value: unknown): PaginatedResponse<LoanResponseDto> {
    const payloadCandidates: unknown[] = [
      this.getNestedValue<unknown>(value, ['data']), // response.data
      this.getNestedValue<unknown>(value, ['data', 'data']), // response.data.data
      this.getNestedValue<unknown>(value, ['data', 'data', 'data']), // legacy nested shape
      value,
    ];

    for (const candidate of payloadCandidates) {
      if (!candidate || typeof candidate !== 'object') continue;
      const candidateObj = candidate as Record<string, unknown>;

      const data = Array.isArray(candidateObj.data)
        ? (candidateObj.data as LoanResponseDto[])
        : undefined;
      const meta =
        candidateObj.meta && typeof candidateObj.meta === 'object'
          ? (candidateObj.meta as PaginatedResponse<LoanResponseDto>['meta'])
          : undefined;

      if (data && meta) {
        return { data, meta };
      }
    }

    return {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  private extractLoanArrayPayload(value: unknown): LoanResponseDto[] {
    const arrayCandidates: unknown[] = [
      this.getNestedValue<unknown>(value, ['data', 'data']), // response.data.data
      this.getNestedValue<unknown>(value, ['data']), // response.data
      value,
    ];

    for (const candidate of arrayCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as LoanResponseDto[];
      }
    }

    return [];
  }

  async getLoansPaginated(
    params: PaginationParams & {
      clientName?: string
      loanStatus?: 'ACTIVE' | 'COMPLETED' | 'ALL'
      paymentFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
      clientId?: string
    } = {}
  ): Promise<PaginatedResponse<LoanResponseDto>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.clientName) searchParams.append('clientName', params.clientName);
    if (params.loanStatus) searchParams.append('loanStatus', params.loanStatus);
    if (params.paymentFrequency) searchParams.append('paymentFrequency', params.paymentFrequency);
    if (params.clientId) searchParams.append('clientId', params.clientId);

    const queryString = searchParams.toString();
    const url = queryString ? `/loans/pagination?${queryString}` : '/loans/pagination';

    const response = await requestDeduplicator.dedupe(
      `loans:paginated:${queryString}`,
      () => api.get(url),
      { ttl: 3000 }
    );
    return this.extractPaginatedLoansPayload(response.data);
  }

  async getAllLoans(): Promise<LoanResponseDto[]> {
    const response = await requestDeduplicator.dedupe(
      'loans:get-all',
      () => api.get('/loans'),
      { ttl: 5000 }
    );
    return this.extractLoanArrayPayload(response.data);
  }

  async getActiveLoansWithClientId(): Promise<LoanListResponseDto[]> {
    const response = await requestDeduplicator.dedupe(
      'loans:get-all',
      () => api.get('/loans'),
      { ttl: 5000 }
    );
    return response.data.data || response.data || [];
  }

  async getLoanById(id: string): Promise<LoanResponseDto> {
    const response = await api.get(`/loans/${id}`);
    return response.data.data;
  }

  async createLoan(loanData: CreateLoanDto): Promise<CreateLoanResponseDto> {
    try {
      const response = await api.post('/loans', loanData);

      const createdLoanData = response.data.data;
      
      // Backend returns the loan object directly (not nested in .loan)
      if (!createdLoanData || !createdLoanData.id) {
        throw new Error(
          'Respuesta inesperada del servidor al crear el préstamo.'
        );
      }

      return createdLoanData;
    } catch (error: any) {
      throw error;
    }
  }

  async updateLoan(
    id: string,
    loanData: Partial<CreateLoanDto>
  ): Promise<LoanResponseDto> {
    const response = await api.patch(`/loans/${id}`, loanData);
    return response.data.data;
  }

  async deleteLoan(id: string): Promise<void> {
    await api.delete(`/loans/${id}`);
  }

  async deleteLoanPermanently(id: string): Promise<{
    message: string
    loanTrack: string
    montoDevuelto: number
    totalPrestamo: number
    totalPagado: number
    newWalletBalance: number
  }> {
    const response = await api.delete(`/loans/${id}/permanent`);
    return response.data.data;
  }

  async getLoanByTracking(
    dni: string,
    tracking: string
  ): Promise<LoanTrackingResponseDto> {
    const response = await api.get(
      `/loans/tracking?dni=${dni}&tracking=${tracking}`
    );
    return response.data.data;
  }

  async getTodayLoans(): Promise<{
    date: string
    total: number
    totalAmount: number
    loans: Array<{
      montoTotalPrestado: number
      montoTotalADevolver: number
      nombrecliente: string
    }>
  }> {
    const response = await api.get('/loans/today');
    return response.data.data || response.data;
  }

  async updateLoanDescription(loanId: string, description: string): Promise<{ id: string; description: string }> {
    const response = await api.patch(`/loans/${loanId}/description`, { description });
    return response.data.data || response.data;
  }

  /**
   * ✅ MÉTODO DEPRECADO: Las wallets pueden ser negativas sin límite
   * Helper: Validate if loan can be created with available wallet balance
   * NOTE: Backend performs the actual validation and transaction
   * This is for frontend pre-validation only - REMOVED wallet balance restrictions
   *
   * @param loanAmount The amount to loan
   * @param availableBalance The available balance in manager's wallet
   * @returns Object with validation result and message
   * @deprecated Las wallets ya no tienen restricciones de balance mínimo
   */
  validateLoanAgainstBalance(
    loanAmount: number,
    availableBalance: number
  ): {
    isValid: boolean;
    message: string;
    insufficientBy?: number;
  } {
    // ✅ SIEMPRE RETORNA VÁLIDO - Las wallets pueden ser negativas
    return {
      isValid: true,
      message: 'Las wallets pueden tener balance negativo sin restricciones',
    };
    
    // Código anterior comentado:
    // if (loanAmount > availableBalance) {
    //   return {
    //     isValid: false,
    //     message: `Saldo insuficiente. Necesita $${loanAmount.toFixed(2)} pero solo tiene $${availableBalance.toFixed(2)}`,
    //     insufficientBy: loanAmount - availableBalance,
    //   };
    // }
    // return {
    //   isValid: true,
    //   message: 'Saldo disponible suficiente',
    // };
  }
}

export const loansService = new LoansService();
