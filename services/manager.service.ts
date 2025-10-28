import api from './api'
import type { components } from '@/types/api-generated'

export interface ManagerDashboardData {
  capitalDisponible: number
  capitalAsignado: number
  recaudadoEsteMes: number
  valorCartera: number
}

export type ClientChartDataDto = components['schemas']['ClientChartDataDto']
export type LoanChartDataDto = components['schemas']['LoanChartDataDto']

interface ClientsChartFilters {
  fullName?: string
  dni?: string
  cuit?: string
  email?: string
  phone?: string
  createdFrom?: string
  createdTo?: string
}

interface LoansChartFilters {
  clientId?: string
  loanTrack?: string
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
  currency?: 'ARS' | 'USD'
  paymentFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  minAmount?: number
  maxAmount?: number
  createdFrom?: string
  createdTo?: string
  dueDateFrom?: string
  dueDateTo?: string
}

class ManagerService {
  async getDashboardData(): Promise<ManagerDashboardData> {
    const response = await api.get('/users/manager/dashboard')
    return response.data.data
  }

  /**
   * Get clients of a specific manager with pre-calculated metrics
   * Used for reports and analytics
   */
  async getManagerClientsChart(
    managerId: string,
    filters?: ClientsChartFilters
  ): Promise<ClientChartDataDto[]> {
    const response = await api.get(`/users/${managerId}/clients/chart`, { params: filters })
    return response.data.data || response.data || []
  }

  /**
   * Get loans of a specific manager with pre-calculated metrics
   * Used for reports and analytics
   */
  async getManagerLoansChart(
    managerId: string,
    filters?: LoansChartFilters
  ): Promise<LoanChartDataDto[]> {
    const response = await api.get(`/users/${managerId}/loans/chart`, { params: filters })
    return response.data.data || response.data || []
  }
}

export const managerService = new ManagerService()
export default managerService
