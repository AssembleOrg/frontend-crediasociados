/**
 * THE MESSENGER - Finanzas Service
 *
 * Mock service for financial management
 * Returns hardcoded data - NO REAL API CALLS
 *
 * Following architecture: Only HTTP structure, no state management
 */

import type {
  FinancialSummary,
  ManagerFinancialData,
  ActiveLoanFinancial,
  PortfolioEvolution,
  IncomeVsExpenses,
  CapitalDistribution
} from '@/types/finanzas'

// ============================================================================
// MOCK DATA - Hardcoded for visual development
// ============================================================================

const MOCK_SUBADMIN_FINANCIAL_SUMMARY: FinancialSummary = {
  userId: 'subadmin-1',
  userRole: 'subadmin',
  capitalAsignado: 1000000,
  capitalDisponible: 450000,
  montoEnPrestamosActivos: 550000,
  recaudadoEsteMes: 85000,
  gastosEsteMes: 35000,
  valorCartera: 1000000
}

const MOCK_MANAGER_FINANCIAL_SUMMARY: FinancialSummary = {
  userId: 'manager-1',
  userRole: 'manager',
  capitalAsignado: 300000,
  capitalDisponible: 150000,
  montoEnPrestamosActivos: 150000,
  recaudadoEsteMes: 28000,
  gastosEsteMes: 12000,
  valorCartera: 288000
}

const MOCK_MANAGERS_FINANCIAL: ManagerFinancialData[] = [
  {
    managerId: 'manager-1',
    managerName: 'Juan Pérez',
    managerEmail: 'juan.perez@example.com',
    capitalAsignado: 300000,
    capitalDisponible: 150000,
    prestadoActivo: 150000,
    gastos: 12000,
    valorCartera: 288000,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    managerId: 'manager-2',
    managerName: 'María García',
    managerEmail: 'maria.garcia@example.com',
    capitalAsignado: 400000,
    capitalDisponible: 200000,
    prestadoActivo: 200000,
    gastos: 8000,
    valorCartera: 392000,
    createdAt: new Date('2024-02-10').toISOString()
  },
  {
    managerId: 'manager-3',
    managerName: 'Carlos López',
    managerEmail: 'carlos.lopez@example.com',
    capitalAsignado: 300000,
    capitalDisponible: 100000,
    prestadoActivo: 200000,
    gastos: 15000,
    valorCartera: 285000,
    createdAt: new Date('2024-03-05').toISOString()
  }
]

const MOCK_ACTIVE_LOANS_FINANCIAL: ActiveLoanFinancial[] = [
  {
    loanId: 'loan-1',
    clientId: 'client-1',
    clientName: 'Roberto Martínez',
    montoTotal: 50000,
    montoPendiente: 30000,
    montoPagado: 20000,
    progreso: 40,
    status: 'ACTIVE'
  },
  {
    loanId: 'loan-2',
    clientId: 'client-2',
    clientName: 'Ana Rodríguez',
    montoTotal: 30000,
    montoPendiente: 15000,
    montoPagado: 15000,
    progreso: 50,
    status: 'ACTIVE'
  },
  {
    loanId: 'loan-3',
    clientId: 'client-3',
    clientName: 'Luis Fernández',
    montoTotal: 70000,
    montoPendiente: 60000,
    montoPagado: 10000,
    progreso: 14,
    status: 'ACTIVE'
  }
]

const MOCK_PORTFOLIO_EVOLUTION: PortfolioEvolution[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))

  return {
    date: date.toISOString().split('T')[0],
    valorCartera: 280000 + Math.random() * 40000,
    capitalDisponible: 140000 + Math.random() * 20000,
    prestadoActivo: 140000 + Math.random() * 20000
  }
})

const MOCK_INCOME_VS_EXPENSES: IncomeVsExpenses[] = [
  { period: 'Enero', ingresos: 95000, egresos: 42000 },
  { period: 'Febrero', ingresos: 88000, egresos: 38000 },
  { period: 'Marzo', ingresos: 102000, egresos: 45000 },
  { period: 'Abril', ingresos: 110000, egresos: 48000 },
  { period: 'Mayo', ingresos: 98000, egresos: 41000 },
  { period: 'Junio', ingresos: 105000, egresos: 43000 }
]

const MOCK_CAPITAL_DISTRIBUTION: CapitalDistribution[] = [
  {
    managerName: 'Juan Pérez',
    managerId: 'manager-1',
    capitalAsignado: 300000,
    percentage: 30
  },
  {
    managerName: 'María García',
    managerId: 'manager-2',
    capitalAsignado: 400000,
    percentage: 40
  },
  {
    managerName: 'Carlos López',
    managerId: 'manager-3',
    capitalAsignado: 300000,
    percentage: 30
  }
]

// ============================================================================
// SERVICE CLASS
// ============================================================================

class FinanzasService {
  /**
   * Get financial summary for current user
   * @returns Mock financial summary
   */
  async getFinancialSummary(userId: string, role: 'subadmin' | 'manager'): Promise<FinancialSummary> {
    // Simulate API delay
    await this.mockDelay()

    // Return mock data based on role
    if (role === 'subadmin') {
      return { ...MOCK_SUBADMIN_FINANCIAL_SUMMARY, userId }
    }
    return { ...MOCK_MANAGER_FINANCIAL_SUMMARY, userId }
  }

  /**
   * Get financial data for all managers (Subadmin view)
   * @returns Mock managers financial data
   */
  async getManagersFinancial(subadminId: string): Promise<ManagerFinancialData[]> {
    await this.mockDelay()
    return MOCK_MANAGERS_FINANCIAL
  }

  /**
   * Get active loans financial data (Manager view)
   * @returns Mock active loans
   */
  async getActiveLoansFinancial(managerId: string): Promise<ActiveLoanFinancial[]> {
    await this.mockDelay()
    return MOCK_ACTIVE_LOANS_FINANCIAL
  }

  /**
   * Get portfolio evolution over time
   * @returns Mock portfolio evolution data (last 30 days)
   */
  async getPortfolioEvolution(userId: string, days: number = 30): Promise<PortfolioEvolution[]> {
    await this.mockDelay()
    return MOCK_PORTFOLIO_EVOLUTION.slice(-days)
  }

  /**
   * Get income vs expenses comparison
   * @returns Mock income vs expenses data
   */
  async getIncomeVsExpenses(userId: string, months: number = 6): Promise<IncomeVsExpenses[]> {
    await this.mockDelay()
    return MOCK_INCOME_VS_EXPENSES.slice(-months)
  }

  /**
   * Get capital distribution among managers
   * @returns Mock capital distribution
   */
  async getCapitalDistribution(subadminId: string): Promise<CapitalDistribution[]> {
    await this.mockDelay()
    return MOCK_CAPITAL_DISTRIBUTION
  }

  /**
   * Mock API delay (200-500ms)
   */
  private async mockDelay(): Promise<void> {
    const delay = 200 + Math.random() * 300
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}

// Export singleton instance
export const finanzasService = new FinanzasService()
export default finanzasService
