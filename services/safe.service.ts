import api from './api'

export type SafeTransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'EXPENSE' 
  | 'TRANSFER_TO_COLLECTOR' 
  | 'TRANSFER_FROM_COLLECTOR' 
  | 'TRANSFER_TO_SAFE' 
  | 'TRANSFER_FROM_SAFE'

export interface SafeBalance {
  balance: number
  currency: string
}

export interface SafeExpense {
  id: string
  name: string
  amount: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SafeTransaction {
  id: string
  type: SafeTransactionType
  amount: number
  currency: string
  description: string
  balanceBefore: number
  balanceAfter: number
  relatedUserId?: string | null
  relatedSafeId?: string | null
  createdAt: string
  user?: {
    id: string
    fullName: string
    email: string
  }
  expense?: {
    id: string
    name: string
    description?: string | null
  }
}

export interface SafeHistoryResponse {
  transactions: SafeTransaction[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  currentBalance: number
}

class SafeService {
  /**
   * Get safe balance for a specific manager
   * @param managerId - Manager ID (optional, defaults to authenticated user)
   */
  async getBalance(managerId?: string): Promise<SafeBalance> {
    const url = managerId 
      ? `/safe/balance?managerId=${managerId}`
      : '/safe/balance'
    const response = await api.get(url)
    return response.data.data || response.data
  }

  /**
   * Deposit funds to safe
   * @param amount - Amount to deposit
   * @param description - Description of the deposit
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async deposit(
    amount: number,
    description: string,
    managerId?: string
  ): Promise<SafeTransaction> {
    const url = managerId
      ? `/safe/deposit?managerId=${managerId}`
      : '/safe/deposit'
    const response = await api.post(url, { amount, description })
    return response.data.data || response.data
  }

  /**
   * Withdraw funds from safe
   * @param amount - Amount to withdraw
   * @param description - Description of the withdrawal
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async withdraw(
    amount: number,
    description: string,
    managerId?: string
  ): Promise<SafeTransaction> {
    const url = managerId
      ? `/safe/withdraw?managerId=${managerId}`
      : '/safe/withdraw'
    const response = await api.post(url, { amount, description })
    return response.data.data || response.data
  }

  /**
   * Create or reuse an expense
   * @param name - Name of the expense (case-insensitive matching)
   * @param amount - Amount of the expense
   * @param description - Description (optional)
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async createExpense(
    name: string,
    amount: number,
    description?: string,
    managerId?: string
  ): Promise<{
    expense: SafeExpense
    transaction: SafeTransaction
  }> {
    const url = managerId
      ? `/safe/expense?managerId=${managerId}`
      : '/safe/expense'
    const response = await api.post(url, { name, amount, description })
    return response.data.data || response.data
  }

  /**
   * Get saved expenses
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async getExpenses(managerId?: string): Promise<SafeExpense[]> {
    const url = managerId
      ? `/safe/expenses?managerId=${managerId}`
      : '/safe/expenses'
    const response = await api.get(url)
    return response.data.data || response.data || []
  }

  /**
   * Get expense by ID
   * @param expenseId - Expense ID
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async getExpenseById(expenseId: string, managerId?: string): Promise<SafeExpense> {
    const url = managerId
      ? `/safe/expenses/${expenseId}?managerId=${managerId}`
      : `/safe/expenses/${expenseId}`
    const response = await api.get(url)
    return response.data.data || response.data
  }

  /**
   * Create an expense category (without amount, no transaction)
   * @param name - Name of the category
   * @param description - Description (optional)
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async createExpenseCategory(
    name: string,
    description?: string,
    managerId?: string
  ): Promise<SafeExpense> {
    const url = managerId
      ? `/safe/expenses?managerId=${managerId}`
      : '/safe/expenses'
    // Solo enviamos name y description, sin amount
    const response = await api.post(url, { name, description })
    return response.data.data || response.data
  }

  /**
   * Update an expense category (only name and description, no amount)
   * @param expenseId - Expense ID
   * @param updates - Partial expense data to update (only name and description)
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async updateExpense(
    expenseId: string,
    updates: {
      name?: string
      amount?: number
      description?: string
    },
    managerId?: string
  ): Promise<SafeExpense> {
    const url = managerId
      ? `/safe/expenses/${expenseId}?managerId=${managerId}`
      : `/safe/expenses/${expenseId}`
    const response = await api.put(url, updates)
    return response.data.data || response.data
  }

  /**
   * Delete an expense
   * @param expenseId - Expense ID
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async deleteExpense(expenseId: string, managerId?: string): Promise<{
    message: string
    deletedExpense: SafeExpense
  }> {
    const url = managerId
      ? `/safe/expenses/${expenseId}?managerId=${managerId}`
      : `/safe/expenses/${expenseId}`
    const response = await api.delete(url)
    return response.data.data || response.data
  }

  /**
   * Transfer funds to collector wallet
   * @param amount - Amount to transfer
   * @param description - Description
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async transferToCollector(
    amount: number,
    description: string,
    managerId?: string
  ): Promise<SafeTransaction> {
    const url = managerId
      ? `/safe/transfer-to-collector?managerId=${managerId}`
      : '/safe/transfer-to-collector'
    const response = await api.post(url, { amount, description })
    return response.data.data || response.data
  }

  /**
   * Transfer funds between safes
   * @param targetManagerId - Target manager ID
   * @param amount - Amount to transfer
   * @param description - Description
   * @param managerId - Source manager ID (optional, for subadmin/admin)
   */
  async transferBetweenSafes(
    targetManagerId: string,
    amount: number,
    description: string,
    managerId?: string
  ): Promise<{
    fromTransaction: SafeTransaction
    toTransaction: SafeTransaction
  }> {
    const url = managerId
      ? `/safe/transfer-between-safes?managerId=${managerId}`
      : '/safe/transfer-between-safes'
    const response = await api.post(url, { targetManagerId, amount, description })
    return response.data.data || response.data
  }

  /**
   * Get transaction history
   * @param params - Query parameters
   * @param managerId - Manager ID (optional, for subadmin/admin)
   */
  async getHistory(
    params: {
      page?: number
      limit?: number
      startDate?: string // YYYY-MM-DD
      endDate?: string // YYYY-MM-DD
      type?: SafeTransactionType
    } = {},
    managerId?: string
  ): Promise<SafeHistoryResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.startDate) searchParams.append('startDate', params.startDate)
    if (params.endDate) searchParams.append('endDate', params.endDate)
    if (params.type) searchParams.append('type', params.type)
    if (managerId) searchParams.append('managerId', managerId)

    const queryString = searchParams.toString()
    const url = `/safe/history${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get(url)
    return response.data.data || response.data
  }
}

export const safeService = new SafeService()


