import api from './api'
import type { 
  LoanResponseDto, 
  LoanListResponseDto,
  CreateLoanDto,
  CreateLoanResponseDto,
  LoanTrackingResponseDto,
  PaginationParams,
  PaginatedResponse
} from '@/types/auth'

/**
 * THE MESSENGER - Loans Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 */
class LoansService {
  async getLoansPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<LoanResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/pagination?${queryString}` : '/pagination'
    
    const response = await api.get(url)
    
    return {
      data: response.data.data.data,
      meta: response.data.data.meta
    }
  }

  async getAllLoans(): Promise<LoanResponseDto[]> {
    const response = await api.get('/loans')
    return response.data.data
  }

  async getActiveLoansWithClientId(): Promise<LoanListResponseDto[]> {
    const response = await api.get('/loans')
    return response.data.data || response.data || [] // Handle different response structures
  }

  async getLoanById(id: string): Promise<LoanResponseDto> {
    const response = await api.get(`/loans/${id}`)
    return response.data.data
  }

  async createLoan(loanData: CreateLoanDto): Promise<CreateLoanResponseDto> {
    // DEBUG: Log COMPLETO de datos para diagnosticar error 500
    console.log('🔍 [DEBUG] loans.service - Datos COMPLETOS enviados al backend:', {
      completePayload: loanData,
      fieldsBreakdown: {
        clientId: loanData.clientId,
        amount: { value: loanData.amount, type: typeof loanData.amount },
        baseInterestRate: { value: loanData.baseInterestRate, type: typeof loanData.baseInterestRate },
        penaltyInterestRate: { value: loanData.penaltyInterestRate, type: typeof loanData.penaltyInterestRate },
        currency: loanData.currency,
        paymentFrequency: loanData.paymentFrequency,
        paymentDay: loanData.paymentDay,
        totalPayments: { value: loanData.totalPayments, type: typeof loanData.totalPayments },
        firstDueDate: loanData.firstDueDate,
        description: loanData.description
      },
      timestamp: new Date().toISOString()
    })

    try {
      const response = await api.post('/loans', loanData)

      // DEBUG: Log respuesta exitosa
      console.log('🔍 [DEBUG] loans.service - Préstamo creado exitosamente:', {
        loanId: response.data.data.id,
        clientId: response.data.data.clientId,
        status: response.status,
        fullResponse: response.data.data
      })

      return response.data.data
    } catch (error: any) {
      // DEBUG: Log error completo
      console.error('🚨 [DEBUG] loans.service - ERROR 500 creando préstamo:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        sentData: loanData
      })
      throw error
    }
  }

  async updateLoan(id: string, loanData: Partial<CreateLoanDto>): Promise<LoanResponseDto> {
    const response = await api.patch(`/loans/${id}`, loanData)
    return response.data.data
  }

  async deleteLoan(id: string): Promise<void> {
    await api.delete(`/loans/${id}`)
  }

  async getLoanByTracking(dni: string, tracking: string): Promise<LoanTrackingResponseDto> {
    const response = await api.get(`/loans/tracking?dni=${dni}&tracking=${tracking}`)
    return response.data.data
  }
}

export const loansService = new LoansService()