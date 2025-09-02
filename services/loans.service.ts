import api from './api'
import type { 
  LoanResponseDto, 
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

  async getLoanById(id: string): Promise<LoanResponseDto> {
    const response = await api.get(`/loans/${id}`)
    return response.data.data
  }

  async createLoan(loanData: CreateLoanDto): Promise<CreateLoanResponseDto> {
    const response = await api.post('/loans', loanData)
    return response.data.data
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