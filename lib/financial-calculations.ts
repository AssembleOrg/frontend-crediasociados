/**
 * Financial Calculations Library
 * 
 * Pure functions for calculating financial metrics from real data.
 * No side effects, no API calls - just calculations.
 * 
 * Following KISS principle: Simple, testable calculations.
 */

import type { components } from '@/types/api-generated'
import type { Transaccion } from '@/types/operativa'
import type { 
  FinancialSummary, 
  ManagerFinancialData,
  ActiveLoanFinancial,
  PortfolioEvolution,
  IncomeVsExpenses,
  CapitalDistribution
} from '@/types/finanzas'

// Use the chart data type which has subLoans populated
type LoanWithSubLoans = components['schemas']['LoanChartDataDto']
type SubLoanResponseDto = components['schemas']['SubLoanResponseDto']

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get start and end of current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date | string, start: Date, end: Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  return checkDate >= start && checkDate <= end
}

/**
 * Calculate total from subloans by status
 */
export function calculateSubLoanTotal(
  subLoans: SubLoanResponseDto[], 
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
): number {
  return subLoans
    .filter(sl => !status || sl.status === status)
    .reduce((sum, sl) => sum + Number(sl.amount || 0), 0)
}

// ============================================================================
// FINANCIAL SUMMARY CALCULATIONS
// ============================================================================

/**
 * Calculate financial summary for a manager/prestamista
 */
export function calculateManagerFinancialSummary(
  userId: string,
  loans: LoanWithSubLoans[],
  transacciones: Transaccion[] = []
): FinancialSummary {
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange()

  // Calculate active loans amount (ACTIVE status)
  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE')
  const montoEnPrestamosActivos = activeLoans.reduce((sum, loan) => {
    return sum + Number(loan.amount || 0)
  }, 0)

  // Calculate paid amount from subloans (to determine available capital)
  let montoPagado = 0
  activeLoans.forEach(loan => {
    if (loan.subLoans && Array.isArray(loan.subLoans)) {
      montoPagado += loan.subLoans
        .filter(sl => sl.status === 'PAID')
        .reduce((sum, sl) => sum + Number(sl.paidAmount || 0), 0)
    }
  })

  // Calculate collected this month from transactions
  const recaudadoEsteMes = transacciones
    .filter(t => 
      t.tipo === 'ingreso' && 
      t.subTipo === 'pago_cuota' &&
      isDateInRange(t.fecha, monthStart, monthEnd)
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // Calculate expenses this month
  const gastosEsteMes = transacciones
    .filter(t => 
      t.tipo === 'egreso' &&
      isDateInRange(t.fecha, monthStart, monthEnd)
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // For MVP: Assume initial capital based on total lent + collected
  // In production, this should come from capital assignment records
  const totalLent = loans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0)
  const capitalAsignado = totalLent + montoPagado // Simple approximation

  // Available capital = collected - currently lent
  const capitalDisponible = montoPagado - montoEnPrestamosActivos

  // Portfolio value = available + active loans - expenses
  const valorCartera = capitalDisponible + montoEnPrestamosActivos - gastosEsteMes

  return {
    userId,
    userRole: 'manager',
    capitalAsignado,
    capitalDisponible: Math.max(0, capitalDisponible),
    montoEnPrestamosActivos,
    recaudadoEsteMes,
    gastosEsteMes,
    valorCartera
  }
}

/**
 * Calculate financial summary for subadmin (aggregated from managers)
 */
export function calculateSubadminFinancialSummary(
  userId: string,
  managersData: ManagerFinancialData[]
): FinancialSummary {
  const aggregated = managersData.reduce(
    (acc, manager) => ({
      capitalAsignado: acc.capitalAsignado + manager.capitalAsignado,
      capitalDisponible: acc.capitalDisponible + manager.capitalDisponible,
      prestadoActivo: acc.prestadoActivo + manager.prestadoActivo,
      recaudado: acc.recaudado + 0, // Would need transaction data per manager
      gastos: acc.gastos + manager.gastos,
      valorCartera: acc.valorCartera + manager.valorCartera
    }),
    { 
      capitalAsignado: 0, 
      capitalDisponible: 0, 
      prestadoActivo: 0,
      recaudado: 0,
      gastos: 0,
      valorCartera: 0
    }
  )

  return {
    userId,
    userRole: 'subadmin',
    capitalAsignado: aggregated.capitalAsignado,
    capitalDisponible: aggregated.capitalDisponible,
    montoEnPrestamosActivos: aggregated.prestadoActivo,
    recaudadoEsteMes: aggregated.recaudado,
    gastosEsteMes: aggregated.gastos,
    valorCartera: aggregated.valorCartera
  }
}

// ============================================================================
// MANAGER FINANCIAL DATA
// ============================================================================

/**
 * Calculate financial data for a single manager
 */
export function calculateManagerFinancialData(
  managerId: string,
  managerName: string,
  managerEmail: string,
  loans: LoanWithSubLoans[],
  transacciones: Transaccion[] = [],
  createdAt: string
): ManagerFinancialData {
  const summary = calculateManagerFinancialSummary(managerId, loans, transacciones)

  return {
    managerId,
    managerName,
    managerEmail,
    capitalAsignado: summary.capitalAsignado,
    capitalDisponible: summary.capitalDisponible,
    prestadoActivo: summary.montoEnPrestamosActivos,
    gastos: summary.gastosEsteMes,
    valorCartera: summary.valorCartera,
    createdAt
  }
}

// ============================================================================
// ACTIVE LOANS FINANCIAL
// ============================================================================

/**
 * Transform loan to active loan financial data
 */
export function loanToActiveLoanFinancial(loan: LoanWithSubLoans): ActiveLoanFinancial {
  const montoTotal = Number(loan.amount || 0)
  
  // Calculate paid and pending from subloans
  let montoPagado = 0
  let montoPendiente = montoTotal

  if (loan.subLoans && Array.isArray(loan.subLoans)) {
    montoPagado = loan.subLoans
      .reduce((sum, sl) => sum + Number(sl.paidAmount || 0), 0)
    
    montoPendiente = loan.subLoans
      .filter(sl => sl.status !== 'PAID')
      .reduce((sum, sl) => sum + Number(sl.amount || 0), 0)
  }

  const progreso = montoTotal > 0 ? Math.round((montoPagado / montoTotal) * 100) : 0

  return {
    loanId: loan.id,
    clientId: loan.clientId,
    clientName: loan.client?.fullName || `Cliente ${loan.clientId}`,
    montoTotal,
    montoPendiente,
    montoPagado,
    progreso,
    status: loan.status as 'ACTIVE' | 'APPROVED'
  }
}

/**
 * Get active loans financial data from loans array
 */
export function getActiveLoansFinancial(loans: LoanWithSubLoans[]): ActiveLoanFinancial[] {
  return loans
    .filter(loan => loan.status === 'ACTIVE' || loan.status === 'APPROVED')
    .map(loanToActiveLoanFinancial)
}

// ============================================================================
// PORTFOLIO EVOLUTION
// ============================================================================

/**
 * Calculate portfolio evolution (simplified MVP version)
 * In production, this would come from historical transaction data
 */
export function calculatePortfolioEvolution(
  currentSummary: FinancialSummary,
  days: number = 30
): PortfolioEvolution[] {
  const evolution: PortfolioEvolution[] = []
  const today = new Date()

  // MVP: Generate simple trend based on current values
  // In production: Query historical data from database
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simple linear interpolation for MVP
    const factor = 1 - (i / days) * 0.2 // 20% growth over period

    evolution.push({
      date: date.toISOString().split('T')[0],
      valorCartera: Math.round(currentSummary.valorCartera * factor),
      capitalDisponible: Math.round(currentSummary.capitalDisponible * factor),
      prestadoActivo: Math.round(currentSummary.montoEnPrestamosActivos * factor)
    })
  }

  return evolution
}

// ============================================================================
// INCOME VS EXPENSES
// ============================================================================

/**
 * Calculate income vs expenses by month
 */
export function calculateIncomeVsExpenses(
  transacciones: Transaccion[],
  months: number = 6
): IncomeVsExpenses[] {
  const result: IncomeVsExpenses[] = []
  const now = new Date()

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)

    const ingresos = transacciones
      .filter(t => 
        t.tipo === 'ingreso' && 
        isDateInRange(t.fecha, monthStart, monthEnd)
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const egresos = transacciones
      .filter(t => 
        t.tipo === 'egreso' && 
        isDateInRange(t.fecha, monthStart, monthEnd)
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    result.push({
      period: monthNames[monthDate.getMonth()],
      ingresos,
      egresos
    })
  }

  return result
}

// ============================================================================
// CAPITAL DISTRIBUTION
// ============================================================================

/**
 * Calculate capital distribution from managers data
 */
export function calculateCapitalDistribution(
  managersData: ManagerFinancialData[]
): CapitalDistribution[] {
  const totalCapital = managersData.reduce(
    (sum, m) => sum + m.capitalAsignado, 
    0
  )

  return managersData.map(manager => ({
    managerName: manager.managerName,
    managerId: manager.managerId,
    capitalAsignado: manager.capitalAsignado,
    percentage: totalCapital > 0 
      ? Math.round((manager.capitalAsignado / totalCapital) * 100) 
      : 0
  }))
}

