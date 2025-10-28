/**
 * Gastos Service - TO BE IMPLEMENTED WITH REAL API
 * 
 * ⚠️ WARNING: This service needs to be implemented with real API endpoints
 * Currently disabled - replace with actual backend calls
 * 
 * Required endpoints:
 * - GET    /api/v1/gastos?userId={userId}&startDate={date}&endDate={date}&category={category}
 * - GET    /api/v1/gastos/{id}
 * - POST   /api/v1/gastos
 * - PUT    /api/v1/gastos/{id}
 * - DELETE /api/v1/gastos/{id}
 * - GET    /api/v1/gastos/summary?userId={userId}&startDate={date}&endDate={date}
 */

import api from './api'
import type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseSummary
} from '@/types/finanzas'

class GastosService {
  /**
   * Get all expenses for a user with optional filters
   */
  async getExpenses(userId: string, filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      const params = new URLSearchParams()
      params.append('userId', userId)
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate.toISOString())
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate.toISOString())
      }
      if (filters?.category) {
        params.append('category', filters.category)
      }

      const response = await api.get(`/gastos?${params.toString()}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching expenses:', error)
      return []
    }
  }

  /**
   * Get expense summary statistics
   */
  async getExpenseSummary(userId: string, startDate: Date, endDate: Date): Promise<ExpenseSummary> {
    try {
      const params = new URLSearchParams()
      params.append('userId', userId)
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())

      const response = await api.get(`/gastos/summary?${params.toString()}`)
      return response.data.data || {
        totalAmount: 0,
        expensesByCategory: {},
        topExpenses: []
      }
    } catch (error) {
      console.error('Error fetching expense summary:', error)
      return {
        totalAmount: 0,
        expensesByCategory: {},
        topExpenses: []
      }
    }
  }

  /**
   * Create new expense
   */
  async createExpense(userId: string, data: CreateExpenseDto): Promise<Expense> {
    const response = await api.post('/gastos', {
      userId,
      ...data
    })
    return response.data.data
  }

  /**
   * Update existing expense
   */
  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const response = await api.put(`/gastos/${id}`, data)
    return response.data.data
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/gastos/${id}`)
  }
}

const gastosService = new GastosService()
export default gastosService
