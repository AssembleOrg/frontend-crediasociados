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
  async getTodayDueSubLoans(): Promise<SubLoanResponseDto[]> {
    const response = await api.get('/sub-loans/today-due')
    return response.data.data.data || response.data.data || []
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
  async getAllSubLoans(): Promise<SubLoanResponseDto[]> {
    // Usar loans sin paginación para extraer todos los subloans
    const response = await api.get('/loans')

    // Extraer subloans de todos los préstamos
    const loans = response.data.data || []
    const allSubLoans: SubLoanResponseDto[] = []

    loans.forEach((loan: any) => {
      if (loan.subLoans && Array.isArray(loan.subLoans)) {
        allSubLoans.push(...loan.subLoans)
      }
    })

    return allSubLoans
  }
}

export const subLoansService = new SubLoansService()