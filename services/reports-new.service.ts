import api from './api'
import type { components } from '@/types/api-generated'

// ============================================================================
// TYPES FROM BACKEND
// ============================================================================

export type UserResponseDto = components['schemas']['UserResponseDto']
export type ClientChartDataDto = components['schemas']['ClientChartDataDto']
export type LoanChartDataDto = components['schemas']['LoanChartDataDto']

/**
 * SubLoan with client information (from backend)
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
 * Query filters for subloans with client info
 */
export interface SubLoansWithClientFilters {
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  dueDateFrom?: string  // ISO 8601
  dueDateTo?: string    // ISO 8601
}

/**
 * Query filters for clients chart
 */
export interface ClientsChartFilters {
  fullName?: string
  dni?: string
  cuit?: string
  email?: string
  phone?: string
  createdFrom?: string  // ISO 8601
  createdTo?: string    // ISO 8601
}

/**
 * Query filters for loans chart
 */
export interface LoansChartFilters {
  clientId?: string
  loanTrack?: string
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
  currency?: 'ARS' | 'USD'
  paymentFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  minAmount?: number
  maxAmount?: number
  createdFrom?: string  // ISO 8601
  createdTo?: string    // ISO 8601
  dueDateFrom?: string  // ISO 8601
  dueDateTo?: string    // ISO 8601
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * New Reports Service - Uses correct backend endpoints
 * Based on backend_reports.md specification
 */
class ReportsNewService {
  
  // ==========================================================================
  // ENDPOINTS FOR ALL ROLES
  // ==========================================================================
  
  /**
   * ✅ GET /users/created
   * 
   * Get users created by the authenticated user
   * - ADMIN: Gets SUBADMIN users
   * - SUBADMIN: Gets MANAGER users
   */
  async getCreatedUsers(filters?: { role?: 'SUBADMIN' | 'MANAGER' }): Promise<UserResponseDto[]> {
    const response = await api.get('/users/created', { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * ✅ GET /users/:id/created-users
   * 
   * Get users created by a specific user (for cross-hierarchy access)
   * - ADMIN can get managers of a specific SUBADMIN
   */
  async getCreatedUsersByUserId(userId: string): Promise<UserResponseDto[]> {
    const response = await api.get(`/users/${userId}/created-users`)
    return response.data.data || response.data || []
  }

  /**
   * ✅ GET /users/:managerId/clients/chart
   * 
   * Get clients of a specific manager with pre-calculated metrics
   */
  async getManagerClientsChart(
    managerId: string, 
    filters?: ClientsChartFilters
  ): Promise<ClientChartDataDto[]> {
    const response = await api.get(`/users/${managerId}/clients/chart`, { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * ✅ GET /users/:managerId/loans/chart
   * 
   * Get loans of a specific manager with pre-calculated metrics
   */
  async getManagerLoansChart(
    managerId: string,
    filters?: LoansChartFilters
  ): Promise<LoanChartDataDto[]> {
    const response = await api.get(`/users/${managerId}/loans/chart`, { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * ✅ GET /loans/chart
   * 
   * Get loans of the authenticated user with pre-calculated metrics
   * Used by MANAGER for their own reports
   */
  async getMyLoansChart(filters?: LoansChartFilters): Promise<LoanChartDataDto[]> {
    const response = await api.get('/loans/chart', { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * ✅ GET /clients
   * 
   * Get clients of the authenticated user
   * Used by MANAGER for their own reports
   */
  async getMyClients(params?: {
    page?: number
    limit?: number
    fullName?: string
    dni?: string
    cuit?: string
    email?: string
    phone?: string
  }): Promise<{
    data: any[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }> {
    const response = await api.get('/clients', { params })
    return response.data
  }

  /**
   * ✅ GET /subloans/with-client-info
   * 
   * Get subloans with client information for reports
   * - MANAGER: Gets their own subloans
   * - SUBADMIN: Gets subloans of all their managers
   * - ADMIN: Gets all subloans
   */
  async getSubLoansWithClientInfo(
    filters?: SubLoansWithClientFilters
  ): Promise<SubLoanWithClientDto[]> {
    const response = await api.get('/subloans/with-client-info', { params: filters })
    return response.data.data || response.data || []
  }

  // ==========================================================================
  // HELPER METHODS FOR AGGREGATIONS
  // ==========================================================================

  /**
   * Calculate metrics from clients chart data
   */
  calculateClientsMetrics(clients: ClientChartDataDto[]) {
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.activeLoans > 0).length,
      totalAmount: clients.reduce((sum, c) => sum + c.totalAmount, 0),
      activeAmount: clients.reduce((sum, c) => sum + c.activeAmount, 0),
    }
  }

  /**
   * Calculate metrics from loans chart data
   */
  calculateLoansMetrics(loans: LoanChartDataDto[]) {
    const activeLoans = loans.filter(l => l.status === 'ACTIVE')
    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalAmount: activeLoans.reduce((sum, l) => sum + l.originalAmount, 0),
      paidAmount: activeLoans.reduce((sum, l) => sum + l.paidAmount, 0),
      remainingAmount: activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0),
      completedPayments: activeLoans.reduce((sum, l) => sum + l.completedPayments, 0),
      pendingPayments: activeLoans.reduce((sum, l) => sum + l.pendingPayments, 0),
    }
  }

  /**
   * Calculate payment metrics from subloans
   */
  calculatePaymentMetrics(subloans: SubLoanWithClientDto[]) {
    const total = subloans.length
    const paid = subloans.filter(s => s.status === 'PAID').length
    const partial = subloans.filter(s => s.status === 'PARTIAL').length
    const overdue = subloans.filter(s => s.status === 'OVERDUE').length
    const pending = subloans.filter(s => s.status === 'PENDING').length

    const totalCollected = subloans
      .filter(s => s.status === 'PAID' || s.status === 'PARTIAL')
      .reduce((sum, s) => sum + s.paidAmount, 0)

    return {
      total,
      paid,
      partial,
      overdue,
      pending,
      paidRate: total > 0 ? (paid / total) * 100 : 0,
      partialRate: total > 0 ? (partial / total) * 100 : 0,
      overdueRate: total > 0 ? (overdue / total) * 100 : 0,
      pendingRate: total > 0 ? (pending / total) * 100 : 0,
      totalCollected,
      collectionEfficiency: total > 0 ? ((paid + partial) / total) * 100 : 0,
    }
  }
}

// Export singleton instance
export const reportsNewService = new ReportsNewService()
export default reportsNewService

