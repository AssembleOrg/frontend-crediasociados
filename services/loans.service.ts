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
    console.log(
      '🔍 [DEBUG] loans.service - Datos enviados para crear préstamo:',
      loanData
    );

    try {
      const response = await api.post('/loans', loanData);

      console.log(
        '🔍 [DEBUG] loans.service - Respuesta completa del backend:',
        response.data
      );

      const createdLoanData = response.data.data;
      
      // Backend returns the loan object directly (not nested in .loan)
      if (!createdLoanData || !createdLoanData.id) {
        console.error(
          '🚨 [ERROR] loans.service - La respuesta de la API no tiene la estructura esperada para un préstamo nuevo.'
        );
        throw new Error(
          'Respuesta inesperada del servidor al crear el préstamo.'
        );
      }

      console.log(
        '✅ [SUCCESS] loans.service - Préstamo creado exitosamente:',
        {
          loanId: createdLoanData.id,
          loanTrack: createdLoanData.loanTrack,
          clientId: createdLoanData.clientId,
          subLoansCount: createdLoanData.subLoans?.length || 0,
        }
      );

      return createdLoanData;
    } catch (error: any) {
      console.error('🚨 [ERROR] loans.service - Error creando préstamo:', {
        message: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        sentData: loanData,
      });
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

  /**
   * Helper: Validate if loan can be created with available wallet balance
   * NOTE: Backend performs the actual validation and transaction
   * This is for frontend pre-validation only
   *
   * @param loanAmount The amount to loan
   * @param availableBalance The available balance in manager's wallet
   * @returns Object with validation result and message
   */
  validateLoanAgainstBalance(
    loanAmount: number,
    availableBalance: number
  ): {
    isValid: boolean;
    message: string;
    insufficientBy?: number;
  } {
    if (loanAmount > availableBalance) {
      return {
        isValid: false,
        message: `Saldo insuficiente. Necesita $${loanAmount.toFixed(2)} pero solo tiene $${availableBalance.toFixed(2)}`,
        insufficientBy: loanAmount - availableBalance,
      };
    }

    return {
      isValid: true,
      message: 'Saldo disponible suficiente',
    };
  }
}

export const loansService = new LoansService();
