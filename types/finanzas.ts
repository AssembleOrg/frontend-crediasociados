/**
 * Types for Financial Management System
 *
 * Hierarchy:
 * - Subadmin manages multiple Managers (Prestamistas)
 * - Manager manages multiple Clients
 * - Clients receive Loans
 */

// ============================================================================
// CORE FINANCIAL TYPES
// ============================================================================

/**
 * Financial summary for a user (Subadmin or Manager)
 */
export interface FinancialSummary {
  userId: string
  userRole: 'subadmin' | 'manager'
  capitalAsignado: number // Total capital assigned to this user
  capitalDisponible: number // Available capital (not lent yet)
  montoEnPrestamosActivos: number // Total amount in active loans
  recaudadoEsteMes: number // Collected this month (payments received)
  gastosEsteMes: number // Expenses this month
  valorCartera: number // Portfolio value = Disponible + Prestado - Gastos
}

/**
 * Financial data for a Manager (from Subadmin's perspective)
 */
export interface ManagerFinancialData {
  managerId: string
  managerName: string
  managerEmail: string
  capitalAsignado: number
  capitalDisponible: number
  prestadoActivo: number
  gastos: number
  valorCartera: number
  createdAt: string
}

/**
 * Active loan data for financial tracking
 */
export interface ActiveLoanFinancial {
  loanId: string
  clientId: string
  clientName: string
  montoTotal: number
  montoPendiente: number
  montoPagado: number
  progreso: number // Percentage (0-100)
  status: 'ACTIVE' | 'APPROVED'
}

/**
 * Client data optimized for charts (from /users/{managerId}/clients/chart)
 */
export interface ClientChartData {
  id: string
  fullName: string
  dni?: string
  cuit?: string
  totalLoans: number
  totalAmount: number
  activeLoans: number
  activeAmount: number
  createdAt: string
  lastLoanDate?: string
}

/**
 * Loan data optimized for charts (from /users/{managerId}/loans/chart)
 */
export interface LoanChartData {
  id: string
  loanTrack: string
  amount: number
  originalAmount: number
  status: string
  currency: string
  paymentFrequency: string
  totalPayments: number
  completedPayments: number
  pendingPayments: number
  paidAmount: number
  remainingAmount: number
  createdAt: string
  nextDueDate?: string
  client: {
    id: string
    fullName: string
    dni?: string
  }
  subLoans?: Array<{
    id: string
    amount: number
    paidAmount: number
    status: string
  }>
}

// ============================================================================
// EXPENSES (GASTOS)
// ============================================================================

export type ExpenseCategory = 'fuel' | 'travel' | 'materials' | 'other'

export interface Expense {
  id: string
  userId: string
  category: ExpenseCategory
  amount: number
  description: string
  date: Date
  receiptUrl?: string // Optional receipt image/PDF
  createdAt: Date
  updatedAt: Date
}

export interface CreateExpenseDto {
  category: ExpenseCategory
  amount: number
  description: string
  date: Date
  receiptUrl?: string
}

export interface UpdateExpenseDto {
  category?: ExpenseCategory
  amount?: number
  description?: string
  date?: Date
  receiptUrl?: string
}

/**
 * Expense filters for querying
 */
export interface ExpenseFilters {
  startDate?: Date
  endDate?: Date
  category?: ExpenseCategory
  minAmount?: number
  maxAmount?: number
}

/**
 * Expense summary statistics
 */
export interface ExpenseSummary {
  totalExpenses: number
  expensesByCategory: Record<ExpenseCategory, number>
  averageExpense: number
  expenseCount: number
  period: {
    from: Date
    to: Date
  }
}

// ============================================================================
// CAPITAL MANAGEMENT
// ============================================================================

/**
 * Capital assignment from Subadmin to Manager
 */
export interface CapitalAssignment {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  date: Date
  notes?: string
  status: 'active' | 'withdrawn'
  createdAt: Date
}

export interface CreateCapitalAssignmentDto {
  toUserId: string
  amount: number
  notes?: string
}

// ============================================================================
// CHARTS & EVOLUTION DATA
// ============================================================================

/**
 * Portfolio value over time
 */
export interface PortfolioEvolution {
  date: string // ISO date string
  valorCartera: number
  capitalDisponible: number
  prestadoActivo: number
}

/**
 * Income vs Expenses comparison
 */
export interface IncomeVsExpenses {
  period: string // e.g., "Enero 2025"
  ingresos: number
  egresos: number
}

/**
 * Capital distribution among managers (for PieChart)
 */
export interface CapitalDistribution {
  managerName: string
  managerId: string
  capitalAsignado: number
  percentage: number
}

// ============================================================================
// DAILY CLOSE (Future implementation)
// ============================================================================

export interface DailyClose {
  id: string
  userId: string
  date: Date
  paymentsCollected: number // Number of payments
  paymentsAmount: number // Total amount collected
  loansGranted: number // Number of loans granted
  loansAmount: number // Total amount lent
  expenses: number // Total expenses
  netBalance: number // Net balance for the day
  physicalCash: number // Physical cash counted
  systemCash: number // System calculated cash
  discrepancy: number // Difference between physical and system
  notes?: string
  status: 'open' | 'closed'
  closedAt?: Date
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Category display metadata
 */
export interface ExpenseCategoryMeta {
  value: ExpenseCategory
  label: string
  icon: string
  color: string
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  fuel: {
    value: 'fuel',
    label: 'Combustible',
    icon: 'LocalGasStation',
    color: '#f57c00'
  },
  travel: {
    value: 'travel',
    label: 'Viáticos',
    icon: 'DirectionsCar',
    color: '#1976d2'
  },
  materials: {
    value: 'materials',
    label: 'Materiales',
    icon: 'ShoppingCart',
    color: '#388e3c'
  },
  other: {
    value: 'other',
    label: 'Otros',
    icon: 'MoreHoriz',
    color: '#757575'
  }
}

/**
 * Financial metrics with trend
 */
export interface FinancialMetricWithTrend {
  value: number
  previousValue: number
  trend: number // Percentage change
  isPositive: boolean
}
