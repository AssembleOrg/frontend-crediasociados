import api from './api'

export interface DailySummaryResponse {
  date: {
    requested: string
    start: string
    end: string
  }
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
  collected: {
    total: number
    grossTotal: number  // Total bruto antes de resets
    count: number
    transactions: Array<{
      id: string
      amount: number
      description: string
      subLoanId: string
      createdAt: string
    }>
  }
  resets: {
    total: number
    count: number
    transactions: Array<{
      id: string
      amount: number
      description: string
      subLoanId: string
      createdAt: string
    }>
  }
  loaned: {
    total: number
    count: number
    loans: Array<{
      id: string
      loanTrack: string
      amount: number
      currency: string
      clientName: string
      createdAt: string
    }>
  }
  expenses: {
    total: number
    count: number
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
      source: string
      createdAt: string
    }>
  }
  summary: {
    totalCollected: number
    grossCollected?: number  // Total bruto
    totalResets?: number  // Total de resets
    totalLoaned: number
    totalExpenses: number
    netBalance: number
  }
  // Nueva estructura del reporte
  cobrado: number
  gastado: number
  prestado: number  // Desde transacciones LOAN_DISBURSEMENT
  retirado: number
  ajusteCaja: number  // Nueva card - suma positiva
  neto: number  // cobrado - gastado - prestado - retirado + ajusteCaja
}

class DailySummaryService {
  /**
   * Get daily summary for the authenticated manager (current day only)
   */
  async getOwnDailySummary(): Promise<DailySummaryResponse> {
    const response = await api.get('/collector-wallet/daily-summary')
    return response.data.data
  }

  /**
   * Get daily summary with query parameters (for subadmin/admin)
   * @param date - Date in YYYY-MM-DD format (optional, defaults to today)
   * @param managerId - Manager ID to query (optional, defaults to authenticated user)
   */
  async getDailySummaryQuery(
    date?: string,
    managerId?: string
  ): Promise<DailySummaryResponse> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (managerId) params.append('managerId', managerId)

    const queryString = params.toString()
    const url = `/collector-wallet/daily-summary/query${queryString ? `?${queryString}` : ''}`

    const response = await api.get(url)
    return response.data.data
  }

  /**
   * Format date to YYYY-MM-DD for API
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayFormatted(): string {
    return this.formatDateForAPI(new Date())
  }
}

export const dailySummaryService = new DailySummaryService()

