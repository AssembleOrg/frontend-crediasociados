import api from './api'

export interface CollectorPeriodReport {
  period: {
    startDate: string
    endDate: string
  }
  collector: {
    userId: string
    fullName: string
    role: string
    commissionPercentage: number
  }
  collectorWallet: {
    transactions: Array<{
      id: string
      type: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT'
      amount: number
      description: string
      balanceBefore: number
      balanceAfter: number
      subLoanId: string | null
      createdAt: string
    }>
    totalCollections: number
    totalWithdrawals: number
    netAmount: number
  }
  collections: {
    totalDue: number
    collected: {
      full: number
      partial: number
      total: number
    }
    failed: number
    percentages: {
      full: number
      partial: number
      failed: number
    }
    amounts: {
      totalDue: number
      totalCollected: number
    }
  }
  expenses: {
    total: number
    byCategory: {
      COMBUSTIBLE?: number
      CONSUMO?: number
      REPARACIONES?: number
      OTROS?: number
    }
    detail: Array<{
      category: string
      amount: number
      description: string
      date: string
    }>
  }
  commission: {
    percentage: number
    baseAmount: number
    commissionAmount: number
  }
  summary: {
    totalCollections: number
    totalWithdrawals: number
    totalExpenses: number
    netBeforeCommission: number
    commission: number
    netAfterCommission: number
    cobrado?: number
    gastado?: number
    prestado?: number
    retirado?: number
    neto?: number
  }
  loans?: {
    total: number
    totalAmount: number
    loans: Array<{
      id: string
      loanTrack: string
      amount: number
      createdAt: string
    }>
  }
  prestado?: number // Direct field for total lent amount
  cobrado?: number // Direct field for total collected
  gastado?: number // Direct field for total expenses
  retirado?: number // Direct field for total withdrawals
  neto?: number // Direct field for net amount
}

class CollectorReportService {
  /**
   * Get period report for collector
   * If no dates provided, returns current week (Monday to Sunday)
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param managerId - Optional manager ID (for subadmin viewing manager reports)
   */
  async getPeriodReport(
    startDate?: string,
    endDate?: string,
    managerId?: string
  ): Promise<CollectorPeriodReport> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (managerId) params.append('managerId', managerId)

    const queryString = params.toString()
    const url = `/collector-wallet/period-report${queryString ? `?${queryString}` : ''}`

    const response = await api.get(url)
    return response.data.data
  }

  /**
   * Get week range for a given date
   * Returns Monday to Sunday of that week
   */
  getWeekRange(date: Date): { start: Date; end: Date } {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    
    return { start: monday, end: sunday }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Get current week report
   */
  async getCurrentWeekReport(): Promise<CollectorPeriodReport> {
    return this.getPeriodReport() // No params = current week
  }

  /**
   * Get report for a specific week
   */
  async getWeekReport(date: Date): Promise<CollectorPeriodReport> {
    const { start, end } = this.getWeekRange(date)
    return this.getPeriodReport(
      this.formatDateForAPI(start),
      this.formatDateForAPI(end)
    )
  }
}

export const collectorReportService = new CollectorReportService()

