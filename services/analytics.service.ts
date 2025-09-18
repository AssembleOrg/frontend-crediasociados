import api from './api'
import type { components } from '@/types/api-generated'
import type { PaginationParams } from '@/types/auth'

type UserResponseDto = components['schemas']['UserResponseDto']
type LoanListResponseDto = components['schemas']['LoanListResponseDto']
type SubLoanResponseDto = components['schemas']['SubLoanResponseDto']

export interface ManagerAnalytics {
  managerId: string
  managerName: string
  managerEmail: string
  totalClients: number
  totalLoans: number
  totalAmountLent: number
  totalAmountPending: number
  collectionRate: number // Percentage of payments on time
  createdAt: string
}

export interface SubadminAnalytics {
  totalManagers: number
  totalClients: number
  totalLoans: number
  totalAmountLent: number
  totalAmountPending: number
  averageCollectionRate: number
  managers: ManagerAnalytics[]
}

/**
 * Analytics Service for Subadmin
 * Fetches and calculates analytics data for subadmin's managers
 */
class AnalyticsService {
  /**
   * Get all managers created by a specific subadmin
   */
  async getCreatedManagers(subadminId: string): Promise<UserResponseDto[]> {
    const response = await api.get(`/users/${subadminId}/created-users`, {
      params: { limit: 20 } // Maximum limit allowed by backend
    })

    return response.data.data?.data || response.data.data || []
  }

  /**
   * Get all loans for a specific manager
   */
  async getManagerLoans(managerId: string): Promise<LoanListResponseDto[]> {
    // Note: This gets loans for the authenticated user (manager)
    // We'll need to handle this in the hook by making requests as the manager
    const response = await api.get('/loans')
    return response.data || []
  }

  /**
   * Calculate analytics for a specific manager
   */
  calculateManagerAnalytics(
    manager: UserResponseDto,
    loans: LoanListResponseDto[]
  ): ManagerAnalytics {
    // Get unique clients from loans
    const uniqueClientIds = new Set(loans.map(loan => loan.clientId))
    const totalClients = uniqueClientIds.size

    // Calculate total amounts
    const totalAmountLent = loans.reduce((sum, loan) => sum + loan.amount, 0)

    // Calculate pending amounts from subloans
    let totalAmountPending = 0
    let totalSubLoans = 0
    let paidSubLoans = 0

    loans.forEach(loan => {
      if (loan.subLoans && Array.isArray(loan.subLoans)) {
        loan.subLoans.forEach((subLoan: SubLoanResponseDto) => {
          totalSubLoans++
          if (subLoan.status === 'PAID') {
            paidSubLoans++
          } else if (subLoan.status === 'PENDING' || subLoan.status === 'OVERDUE') {
            totalAmountPending += subLoan.totalAmount - subLoan.paidAmount
          }
        })
      }
    })

    // Calculate collection rate
    const collectionRate = totalSubLoans > 0 ? (paidSubLoans / totalSubLoans) * 100 : 0

    return {
      managerId: manager.id,
      managerName: manager.fullName,
      managerEmail: manager.email,
      totalClients,
      totalLoans: loans.length,
      totalAmountLent,
      totalAmountPending,
      collectionRate,
      createdAt: manager.createdAt
    }
  }

  /**
   * Get complete analytics for a subadmin
   * This will be called from the hook with proper authentication handling
   */
  async getSubadminAnalytics(subadminId: string): Promise<Partial<SubadminAnalytics>> {
    try {
      // Get all managers created by this subadmin
      const managers = await this.getCreatedManagers(subadminId)

      // For now, return basic structure
      // The hook will handle getting loan data for each manager
      return {
        totalManagers: managers.length,
        managers: managers.map(manager => ({
          managerId: manager.id,
          managerName: manager.fullName,
          managerEmail: manager.email,
          totalClients: 0, // Will be calculated in hook
          totalLoans: 0,
          totalAmountLent: 0,
          totalAmountPending: 0,
          collectionRate: 0,
          createdAt: manager.createdAt
        }))
      }
    } catch (error) {
      console.error('Error al obtener analytics del subadmin:', error)
      throw new Error('No se pudieron cargar los datos de analytics. Por favor, intente nuevamente.')
    }
  }

  /**
   * Calculate totals from manager analytics
   */
  calculateSubadminTotals(managers: ManagerAnalytics[]): Omit<SubadminAnalytics, 'managers'> {
    const totalManagers = managers.length
    const totalClients = managers.reduce((sum, m) => sum + m.totalClients, 0)
    const totalLoans = managers.reduce((sum, m) => sum + m.totalLoans, 0)
    const totalAmountLent = managers.reduce((sum, m) => sum + m.totalAmountLent, 0)
    const totalAmountPending = managers.reduce((sum, m) => sum + m.totalAmountPending, 0)

    // Calculate average collection rate (weighted by number of loans)
    const totalWeightedRate = managers.reduce((sum, m) => sum + (m.collectionRate * m.totalLoans), 0)
    const averageCollectionRate = totalLoans > 0 ? totalWeightedRate / totalLoans : 0

    return {
      totalManagers,
      totalClients,
      totalLoans,
      totalAmountLent,
      totalAmountPending,
      averageCollectionRate
    }
  }
}

export const analyticsService = new AnalyticsService()