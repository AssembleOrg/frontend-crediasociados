/**
 * THE MESSENGER - Gastos Service
 *
 * Mock service for expense management
 * Returns hardcoded data - NO REAL API CALLS
 *
 * Following architecture: Only HTTP structure, no state management
 */

import type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseSummary
} from '@/types/finanzas'

// ============================================================================
// MOCK DATA - Hardcoded expenses
// ============================================================================

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'expense-1',
    userId: 'manager-1',
    category: 'fuel',
    amount: 5000,
    description: 'Combustible visita clientes zona norte',
    date: new Date('2025-10-01'),
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01')
  },
  {
    id: 'expense-2',
    userId: 'manager-1',
    category: 'materials',
    amount: 3500,
    description: 'Papel y carpetas para contratos',
    date: new Date('2025-09-30'),
    createdAt: new Date('2025-09-30'),
    updatedAt: new Date('2025-09-30')
  },
  {
    id: 'expense-3',
    userId: 'manager-1',
    category: 'travel',
    amount: 8000,
    description: 'Viáticos reunión con 5 clientes',
    date: new Date('2025-09-28'),
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-09-28')
  },
  {
    id: 'expense-4',
    userId: 'manager-1',
    category: 'fuel',
    amount: 4500,
    description: 'Combustible cobranzas zona sur',
    date: new Date('2025-09-25'),
    createdAt: new Date('2025-09-25'),
    updatedAt: new Date('2025-09-25')
  },
  {
    id: 'expense-5',
    userId: 'manager-1',
    category: 'other',
    amount: 2000,
    description: 'Café reunión con clientes',
    date: new Date('2025-09-22'),
    createdAt: new Date('2025-09-22'),
    updatedAt: new Date('2025-09-22')
  },
  {
    id: 'expense-6',
    userId: 'manager-1',
    category: 'fuel',
    amount: 6000,
    description: 'Combustible visita clientes oeste',
    date: new Date('2025-09-20'),
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-20')
  },
  {
    id: 'expense-7',
    userId: 'manager-1',
    category: 'materials',
    amount: 4200,
    description: 'Tóner impresora y papel carta',
    date: new Date('2025-09-18'),
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18')
  },
  {
    id: 'expense-8',
    userId: 'manager-1',
    category: 'travel',
    amount: 9500,
    description: 'Viáticos visita clientes interior',
    date: new Date('2025-09-15'),
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-15')
  },
  {
    id: 'expense-9',
    userId: 'manager-1',
    category: 'fuel',
    amount: 5500,
    description: 'Combustible ruta cobranzas',
    date: new Date('2025-09-12'),
    createdAt: new Date('2025-09-12'),
    updatedAt: new Date('2025-09-12')
  },
  {
    id: 'expense-10',
    userId: 'manager-1',
    category: 'other',
    amount: 3000,
    description: 'Reparación menor vehículo',
    date: new Date('2025-09-10'),
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2025-09-10')
  }
]

// ============================================================================
// SERVICE CLASS
// ============================================================================

class GastosService {
  // In-memory storage for mock CRUD operations
  private expenses: Expense[] = [...MOCK_EXPENSES]
  private nextId = 11

  /**
   * Get all expenses for a user with optional filters
   */
  async getExpenses(userId: string, filters?: ExpenseFilters): Promise<Expense[]> {
    await this.mockDelay()

    let result = this.expenses.filter((expense) => expense.userId === userId)

    // Apply filters
    if (filters) {
      if (filters.startDate) {
        result = result.filter((e) => new Date(e.date) >= filters.startDate!)
      }
      if (filters.endDate) {
        result = result.filter((e) => new Date(e.date) <= filters.endDate!)
      }
      if (filters.category) {
        result = result.filter((e) => e.category === filters.category)
      }
      if (filters.minAmount !== undefined) {
        result = result.filter((e) => e.amount >= filters.minAmount!)
      }
      if (filters.maxAmount !== undefined) {
        result = result.filter((e) => e.amount <= filters.maxAmount!)
      }
    }

    // Sort by date descending (most recent first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Get expense summary statistics
   */
  async getExpenseSummary(userId: string, startDate: Date, endDate: Date): Promise<ExpenseSummary> {
    await this.mockDelay()

    const expenses = await this.getExpenses(userId, { startDate, endDate })

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const expensesByCategory = expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalExpenses,
      expensesByCategory: expensesByCategory as any,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      expenseCount: expenses.length,
      period: { from: startDate, to: endDate }
    }
  }

  /**
   * Create new expense
   */
  async createExpense(userId: string, data: CreateExpenseDto): Promise<Expense> {
    await this.mockDelay()

    const newExpense: Expense = {
      id: `expense-${this.nextId++}`,
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.expenses.push(newExpense)
    return newExpense
  }

  /**
   * Update existing expense
   */
  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense> {
    await this.mockDelay()

    const index = this.expenses.findIndex((e) => e.id === id)
    if (index === -1) {
      throw new Error('Expense not found')
    }

    this.expenses[index] = {
      ...this.expenses[index],
      ...data,
      updatedAt: new Date()
    }

    return this.expenses[index]
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<void> {
    await this.mockDelay()

    const index = this.expenses.findIndex((e) => e.id === id)
    if (index === -1) {
      throw new Error('Expense not found')
    }

    this.expenses.splice(index, 1)
  }

  /**
   * Mock API delay (200-500ms)
   */
  private async mockDelay(): Promise<void> {
    const delay = 200 + Math.random() * 300
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  /**
   * Reset expenses to initial mock data (for testing)
   */
  resetExpenses(): void {
    this.expenses = [...MOCK_EXPENSES]
    this.nextId = 11
  }
}

// Export singleton instance
export const gastosService = new GastosService()
export default gastosService
