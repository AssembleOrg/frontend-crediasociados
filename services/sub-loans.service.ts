import api from './api'
import type { components } from '@/types/api-generated'
import type { PaginationParams, PaginatedResponse } from '@/types/auth'

type SubLoanResponseDto = components['schemas']['SubLoanResponseDto']

interface SubLoanStatsResponseDto {
  totalDueToday: number
  pendingCount: number
  overdueCount: number
  paidCount: number
  totalAmount: number
}

interface ActivationResultDto {
  activatedCount: number
  message: string
}

/**
 * THE MESSENGER - SubLoans Service
 * Simple, testable functions that only communicate with the API.
 */
class SubLoansService {
  async getTodayDueSubLoans(params: PaginationParams = {}): Promise<PaginatedResponse<SubLoanResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const url = queryString ? `/sub-loans/today-due?${queryString}` : '/sub-loans/today-due'
    
    const response = await api.get(url)
    
    return {
      data: response.data.data.data || response.data.data,
      meta: response.data.data.meta || response.data.meta
    }
  }

  async getTodayDueSubLoansStats(): Promise<SubLoanStatsResponseDto> {
    const response = await api.get('/sub-loans/today-due/stats')
    return response.data.data || response.data
  }

  async activateTodayDueSubLoans(): Promise<ActivationResultDto> {
    const response = await api.post('/sub-loans/activate-today-due')
    return response.data.data || response.data
  }

  // Para cobros: obtener TODOS los subloans (no solo today-due)  
  async getAllSubLoans(params: PaginationParams = {}): Promise<PaginatedResponse<SubLoanResponseDto>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    // TODO: Verificar si existe endpoint para todos los subloans, por ahora usar loans
    const url = queryString ? `/loans/pagination?${queryString}` : '/loans/pagination'
    
    const response = await api.get(url)
    
    // Extraer subloans de todos los préstamos
    const loans = response.data.data.data || []
    const allSubLoans: SubLoanResponseDto[] = []
    
    loans.forEach((loan: any) => {
      if (loan.subLoans && Array.isArray(loan.subLoans)) {
        allSubLoans.push(...loan.subLoans)
      }
    })
    
    return {
      data: allSubLoans,
      meta: response.data.data.meta || response.data.meta
    }
  }
}

export const subLoansService = new SubLoansService()