import api from './api';
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
  async getLoansPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<LoanResponseDto>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/pagination?${queryString}` : '/pagination';

    const response = await api.get(url);

    return {
      data: response.data.data.data,
      meta: response.data.data.meta,
    };
  }

  async getAllLoans(): Promise<LoanResponseDto[]> {
    const response = await api.get('/loans');
    return response.data.data;
  }

  async getActiveLoansWithClientId(): Promise<LoanListResponseDto[]> {
    const response = await api.get('/loans');
    return response.data.data || response.data || []; // Handle different response structures
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
