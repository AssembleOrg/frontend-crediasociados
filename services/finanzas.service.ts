/**
 * THE MESSENGER - Finanzas Service
 *
 * Real API implementation for financial management
 * Calculates financial metrics from real backend data
 *
 * Following architecture: Only HTTP calls and data transformation, no state management
 */

import api from './api'
import { loansService } from './loans.service'
import operativaService from './operativa.service'
import type { LoanResponseDto, UserResponseDto } from '@/types/auth'
import type { Transaccion } from '@/types/operativa'
import type {
  FinancialSummary,
  ManagerFinancialData,
  ActiveLoanFinancial,
  PortfolioEvolution,
  IncomeVsExpenses,
  CapitalDistribution
} from '@/types/finanzas'
import {
  calculateManagerFinancialSummary,
  calculateSubadminFinancialSummary,
  calculateManagerFinancialData,
  getActiveLoansFinancial,
  calculatePortfolioEvolution,
  calculateIncomeVsExpenses,
  calculateCapitalDistribution
} from '@/lib/financial-calculations'

// ============================================================================
// SERVICE CLASS
// ============================================================================

class FinanzasService {
  /**
   * Get financial summary for current user
   * Calculates from real loans and transactions data
   */
  async getFinancialSummary(userId: string, role: 'subadmin' | 'manager'): Promise<FinancialSummary> {
    try {
      if (role === 'manager') {
        // Get manager's loans with subloans populated (using chart endpoint)
        const [loans, transacciones] = await Promise.all([
          api.get(`/users/${userId}/loans/chart`).then(res => res.data.data || []),
          operativaService.getTransacciones(userId)
        ])

        return calculateManagerFinancialSummary(userId, loans, transacciones)
      } else {
        // Subadmin: aggregate from all managers
        const managersData = await this.getManagersFinancial(userId)
        return calculateSubadminFinancialSummary(userId, managersData)
      }
    } catch (error) {
      // Error getting financial summary
      // Return empty summary on error (MVP approach)
      return {
        userId,
        userRole: role,
        capitalAsignado: 0,
        capitalDisponible: 0,
        montoEnPrestamosActivos: 0,
        recaudadoEsteMes: 0,
        gastosEsteMes: 0,
        valorCartera: 0
      }
    }
  }

  /**
   * Get financial data for all managers (Subadmin view)
   * Calculates from real data for each manager
   */
  async getManagersFinancial(subadminId: string): Promise<ManagerFinancialData[]> {
    try {
      // Get all managers created by this subadmin using correct endpoint
      const response = await api.get(`/users/${subadminId}/created-users`, {
        params: { limit: 100 } // Get all managers
      })
      
      const managers: UserResponseDto[] = response.data.data?.data || response.data.data || []

      // If no managers, return empty array (graceful degradation)
      if (managers.length === 0) {
        return []
      }

      // Calculate financial data for each manager
      const managersFinancial = await Promise.all(
        managers.map(async (manager) => {
          try {
            // Get manager's loans and transactions
            const [loans, transacciones] = await Promise.all([
              api.get(`/users/${manager.id}/loans/chart`)
                .then(res => res.data.data || [])
                .catch(() => {
                  return []
                }),
              operativaService.getTransacciones(manager.id)
                .catch(() => {
                  return []
                })
            ])

            return calculateManagerFinancialData(
              manager.id,
              manager.fullName,
              manager.email,
              loans,
              transacciones,
              manager.createdAt
            )
          } catch (error) {
            // Error calculating data for manager
            // Return zero data for this manager on error (graceful degradation)
            return {
              managerId: manager.id,
              managerName: manager.fullName,
              managerEmail: manager.email,
              capitalAsignado: 0,
              capitalDisponible: 0,
              prestadoActivo: 0,
              gastos: 0,
              valorCartera: 0,
              createdAt: manager.createdAt
            }
          }
        })
      )

      return managersFinancial
      
    } catch (error) {
      // Critical error getting managers financial data
      // Return empty array instead of throwing (graceful degradation)
      return []
    }
  }

  /**
   * Get active loans financial data
   * For managers: returns their loans
   * For subadmins: aggregates loans from all their managers
   */
  async getActiveLoansFinancial(userId: string, role?: 'subadmin' | 'manager'): Promise<ActiveLoanFinancial[]> {
    try {
      // If subadmin, aggregate from all managers
      if (role === 'subadmin') {
        const managersData = await this.getManagersFinancial(userId)
        
        // Get loans from each manager
        const allLoansPromises = managersData.map(async (manager) => {
          try {
            const loans = await api.get(`/users/${manager.managerId}/loans/chart`)
              .then(res => res.data.data || [])
            return getActiveLoansFinancial(loans)
          } catch (err) {
            return []
          }
        })
        
        const allLoansArrays = await Promise.all(allLoansPromises)
        return allLoansArrays.flat()
      }
      
      // For managers: get their direct loans
      const loans = await api.get(`/users/${userId}/loans/chart`).then(res => res.data.data || [])
      return getActiveLoansFinancial(loans)
    } catch (error) {
      // Error getting active loans financial
      return []
    }
  }

  /**
   * Get portfolio evolution over time
   * MVP: Generates trend from current data
   * TODO: In production, query historical transaction data
   */
  async getPortfolioEvolution(userId: string, days: number = 30): Promise<PortfolioEvolution[]> {
    try {
      // Get current financial summary
      const summary = await this.getFinancialSummary(userId, 'manager')
      
      // Generate evolution based on current values (MVP approach)
      return calculatePortfolioEvolution(summary, days)
    } catch (error) {
      // Error getting portfolio evolution
      return []
    }
  }

  /**
   * Get income vs expenses comparison
   * Calculates from real transaction data
   */
  async getIncomeVsExpenses(userId: string, months: number = 6): Promise<IncomeVsExpenses[]> {
    try {
      const transacciones = await operativaService.getTransacciones(userId)
      return calculateIncomeVsExpenses(transacciones, months)
    } catch (error) {
      // Error getting income vs expenses
      // Return empty months on error
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const now = new Date()
      return Array.from({ length: months }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
        return {
          period: monthNames[monthDate.getMonth()],
          ingresos: 0,
          egresos: 0
        }
      })
    }
  }

  /**
   * Get capital distribution among managers
   * Calculates from managers financial data
   */
  async getCapitalDistribution(subadminId: string): Promise<CapitalDistribution[]> {
    try {
      const managersData = await this.getManagersFinancial(subadminId)
      return calculateCapitalDistribution(managersData)
    } catch (error) {
      // Error getting capital distribution
      return []
    }
  }
}

// Export singleton instance
export const finanzasService = new FinanzasService()
export default finanzasService
