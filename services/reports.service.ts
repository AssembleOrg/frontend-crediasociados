import api from './api'
import type { components } from '@/types/api-generated'
import type { PaginationParams } from '@/types/auth'
import { managerService } from './manager.service'
import type { ClientChartDataDto, LoanChartDataDto } from './manager.service'

type UserResponseDto = components['schemas']['UserResponseDto']
type ClientResponseDto = components['schemas']['ClientResponseDto']

export interface BaseReportMetrics {
  totalUsers: number
  totalClients: number
  totalLoans: number
  totalAmountLent: number
  totalAmountPending: number
  averageCollectionRate: number
}

export interface UserReportData {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  totalManagers?: number // For admin view: number of managers under this subadmin
  totalClients: number
  totalLoans: number
  totalAmountLent: number
  totalAmountPending: number
  collectionRate: number
  createdAt: string
}

export interface AdminReportData extends BaseReportMetrics {
  subadmins: UserReportData[]
}

export interface SubadminReportData extends BaseReportMetrics {
  managers: UserReportData[]
}

/**
 * Base Reports Service
 * Shared functionality for admin and subadmin reports
 */
class ReportsService {
  /**
   * Get users created by a specific user (admin -> subadmins, subadmin -> managers)
   * ✅ Uses correct backend endpoint: /users/:id/created-users
   */
  async getCreatedUsers(userId: string): Promise<UserResponseDto[]> {
    const response = await api.get(`/users/${userId}/created-users`, {
      params: { limit: 100 } // Increased from 20 to support more managers/subadmins
    })

    return response.data.data?.data || response.data.data || []
  }

  /**
   * Get users created by the authenticated user
   * ✅ Uses new backend endpoint: /users/created
   */
  async getMyCreatedUsers(filters?: { role?: 'SUBADMIN' | 'MANAGER' }): Promise<UserResponseDto[]> {
    const response = await api.get('/users/created', { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * Get manager metrics using new chart endpoints (preferred method)
   * Uses pre-calculated backend metrics instead of manual calculations
   */
  async getManagerMetricsFromChartData(
    user: UserResponseDto
  ): Promise<UserReportData> {
    try {
      // Use new chart endpoints for pre-calculated metrics
      const [clientsChart, loansChart] = await Promise.all([
        managerService.getManagerClientsChart(user.id, {}),
        managerService.getManagerLoansChart(user.id, {})
      ])

      // Calculate metrics from chart data (pre-calculated by backend)
      const totalClients = clientsChart.filter(client => client.activeLoans > 0).length
      const activeLoans = loansChart.filter(loan => loan.status === 'ACTIVE')
      const totalLoans = activeLoans.length
      const totalAmountLent = activeLoans.reduce((sum, loan) => sum + loan.originalAmount, 0)
      const totalAmountPending = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0)

      // Collection rate from pre-calculated payment data
      const totalPaid = activeLoans.reduce((sum, loan) => sum + loan.paidAmount, 0)
      const collectionRate = totalAmountLent > 0 ? (totalPaid / totalAmountLent) * 100 : 0

      return {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role,
        totalClients,
        totalLoans,
        totalAmountLent,
        totalAmountPending,
        collectionRate,
        createdAt: user.createdAt
      }
    } catch (error) {
      
      // Fallback to zero values if chart endpoints fail
      return {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role,
        totalClients: 0,
        totalLoans: 0,
        totalAmountLent: 0,
        totalAmountPending: 0,
        collectionRate: 0,
        createdAt: user.createdAt
      }
    }
  }

  /**
   * Calculate metrics for a user based on their loans (legacy method)
   * @deprecated Use getManagerMetricsFromChartData for better performance
   */
  calculateUserMetrics(
    user: UserResponseDto,
    loans: LoanChartDataDto[]
  ): UserReportData {
    // Filter only active loans (ACTIVE or APPROVED status)
    const activeLoans = loans.filter(loan =>
      loan.status === 'ACTIVE' || loan.status === 'APPROVED'
    )

    // Get unique clients from active loans
    const uniqueClientIds = new Set(activeLoans.map(loan => loan.client?.id || ''))
    const totalClients = uniqueClientIds.size

    // Calculate total amounts from active loans only
    const totalAmountLent = activeLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0)

    // Calculate pending amounts and collection rate from active loans subloans
    let totalAmountPending = 0
    let totalSubLoans = 0
    let paidSubLoans = 0

    activeLoans.forEach(loan => {
      const subLoans = (loan as any).subLoans
      if (subLoans && Array.isArray(subLoans)) {
        subLoans.forEach((subLoan: any) => {
          totalSubLoans++
          if (subLoan.status === 'PAID') {
            paidSubLoans++
          } else if (subLoan.status === 'PENDING' || subLoan.status === 'OVERDUE') {
            totalAmountPending += (subLoan.totalAmount || 0) - (subLoan.paidAmount || 0)
          }
        })
      }
    })

    const collectionRate = totalSubLoans > 0 ? (paidSubLoans / totalSubLoans) * 100 : 0

    return {
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role,
      totalClients,
      totalLoans: activeLoans.length,
      totalAmountLent,
      totalAmountPending,
      collectionRate,
      createdAt: user.createdAt
    }
  }

  /**
   * Get aggregated metrics for a subadmin by summing all their managers' data
   * Uses the correct hierarchical flow: subadmin → managers → chart endpoints
   */
  async getSubadminAggregatedMetrics(subadmin: UserResponseDto): Promise<UserReportData> {
    try {
      

      // Step 1: Get managers created by this subadmin
      const managers = await this.getCreatedUsers(subadmin.id)
      

      if (managers.length === 0) {
        // Subadmin has no managers yet
        return {
          userId: subadmin.id,
          userName: subadmin.fullName,
          userEmail: subadmin.email,
          userRole: subadmin.role,
          totalManagers: 0,
          totalClients: 0,
          totalLoans: 0,
          totalAmountLent: 0,
          totalAmountPending: 0,
          collectionRate: 0,
          createdAt: subadmin.createdAt
        }
      }

      // Step 2: For each manager, get their chart data using the working endpoints
      const managersMetrics: UserReportData[] = []

      for (const manager of managers) {
        try {
          
          const managerMetrics = await this.getManagerMetricsFromChartData(manager)
          managersMetrics.push(managerMetrics)
        } catch (error) {
          
          // Include manager with zero values if there's an error
          managersMetrics.push({
            userId: manager.id,
            userName: manager.fullName,
            userEmail: manager.email,
            userRole: manager.role,
            totalClients: 0,
            totalLoans: 0,
            totalAmountLent: 0,
            totalAmountPending: 0,
            collectionRate: 0,
            createdAt: manager.createdAt
          })
        }
      }

      // Step 3: Aggregate all managers' metrics for this subadmin
      const aggregatedMetrics = this.aggregateManagersMetrics(subadmin, managersMetrics)

      // Add managers count for admin reports
      aggregatedMetrics.totalManagers = managersMetrics.length

      return aggregatedMetrics

    } catch (error) {
      // Return zero values on error but don't break the flow
      return {
        userId: subadmin.id,
        userName: subadmin.fullName,
        userEmail: subadmin.email,
        userRole: subadmin.role,
        totalManagers: 0,
        totalClients: 0,
        totalLoans: 0,
        totalAmountLent: 0,
        totalAmountPending: 0,
        collectionRate: 0,
        createdAt: subadmin.createdAt
      }
    }
  }

  /**
   * Aggregate metrics from multiple managers into a single subadmin report
   */
  private aggregateManagersMetrics(subadmin: UserResponseDto, managersMetrics: UserReportData[]): UserReportData {
    const totalClients = managersMetrics.reduce((sum, manager) => sum + manager.totalClients, 0)
    const totalLoans = managersMetrics.reduce((sum, manager) => sum + manager.totalLoans, 0)
    const totalAmountLent = managersMetrics.reduce((sum, manager) => sum + manager.totalAmountLent, 0)
    const totalAmountPending = managersMetrics.reduce((sum, manager) => sum + manager.totalAmountPending, 0)

    // Calculate weighted average collection rate
    const totalAmount = managersMetrics.reduce((sum, manager) => sum + manager.totalAmountLent, 0)
    const weightedCollectionSum = managersMetrics.reduce((sum, manager) =>
      sum + (manager.collectionRate * manager.totalAmountLent), 0
    )
    const averageCollectionRate = totalAmount > 0 ? weightedCollectionSum / totalAmount : 0

    return {
      userId: subadmin.id,
      userName: subadmin.fullName,
      userEmail: subadmin.email,
      userRole: subadmin.role,
      totalClients,
      totalLoans,
      totalAmountLent,
      totalAmountPending,
      collectionRate: averageCollectionRate,
      createdAt: subadmin.createdAt
    }
  }

  /**
   * Calculate totals from multiple user metrics
   */
  calculateTotalMetrics(usersData: UserReportData[]): BaseReportMetrics {
    return {
      totalUsers: usersData.length,
      totalClients: usersData.reduce((sum, user) => sum + user.totalClients, 0),
      totalLoans: usersData.reduce((sum, user) => sum + user.totalLoans, 0),
      totalAmountLent: usersData.reduce((sum, user) => sum + user.totalAmountLent, 0),
      totalAmountPending: usersData.reduce((sum, user) => sum + user.totalAmountPending, 0),
      averageCollectionRate: usersData.length > 0
        ? usersData.reduce((sum, user) => sum + user.collectionRate, 0) / usersData.length
        : 0
    }
  }
}

export const reportsService = new ReportsService()
export default reportsService