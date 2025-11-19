import api from './api';

/**
 * Collector Wallet Service
 * Manages the separate collection wallet for managers (cobradores)
 * This wallet only tracks collections and withdrawals
 */

export interface CollectorWalletBalance {
  walletId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface CollectorWalletWithdrawRequest {
  amount: number;
  description: string;
}

export interface CollectorWalletWithdrawResponse {
  transactionId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface TodayCollectionsResponse {
  date: string;
  total: number;
  totalAmount: number;
  collections: Array<{
    monto: number;
    nombreUsuario: string;
    emailUsuario: string;
    descripcion: string;
    fechaCobro: string;
  }>;
}

class CollectorWalletService {
  /**
   * Get collector wallet balance for a specific manager
   * Admin/Subadmin can get balance for any of their managers
   */
  async getBalanceForUser(userId: string): Promise<CollectorWalletBalance> {
    const response = await api.get(`/users/${userId}/collector-wallet/balance`);
    return response.data.data || response.data;
  }

  /**
   * Get collector wallet balance for current user
   */
  async getMyBalance(): Promise<CollectorWalletBalance> {
    const response = await api.get('/collector-wallet/balance');
    return response.data.data || response.data;
  }

  /**
   * Withdraw from collector wallet for a specific user
   * This removes money from the collector's wallet but DOES NOT add it to anyone's wallet
   * It's purely a withdrawal operation
   */
  async withdrawForUser(
    userId: string,
    data: CollectorWalletWithdrawRequest
  ): Promise<CollectorWalletWithdrawResponse> {
    const response = await api.post(`/collector-wallet/withdraw-manager?managerId=${userId}`, data);
    return response.data.data || response.data;
  }

  /**
   * Withdraw from current user's collector wallet
   */
  async withdraw(
    data: CollectorWalletWithdrawRequest
  ): Promise<CollectorWalletWithdrawResponse> {
    const response = await api.post('/collector-wallet/withdraw', data);
    return response.data.data || response.data;
  }

  /**
   * Get today's collections
   */
  async getTodayCollections(): Promise<TodayCollectionsResponse> {
    const response = await api.get('/collector-wallet/today/collections');
    return response.data.data || response.data;
  }

  /**
   * Get complete wallet history (all transactions)
   * Returns all movements (collections and withdrawals) without pagination
   * @deprecated Use getCompleteHistory for paginated results
   */
  async getWalletHistory(): Promise<{
    total: number;
    transactions: Array<{
      id: string;
      type: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT';
      amount: number;
      currency: string;
      description: string;
      balanceBefore: number;
      balanceAfter: number;
      subLoanId?: string;
      createdAt: string;
    }>;
  }> {
    const response = await api.get('/collector-wallet/history');
    return response.data.data || response.data;
  }

  /**
   * Get complete wallet history with pagination
   * Returns paginated transactions with filters support
   * @param params - Query parameters (managerId is required)
   */
  async getCompleteHistory(params: {
    managerId: string; // Required
    page?: number;
    limit?: number;
    type?: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    transactions: Array<{
      id: string;
      type: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT';
      amount: number;
      currency: string;
      description: string;
      balanceBefore: number;
      balanceAfter: number;
      subLoanId?: string | null;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    wallet: {
      id: string;
      balance: number;
      currency: string;
    };
  }> {
    const searchParams = new URLSearchParams();
    // managerId is always required
    searchParams.append('managerId', params.managerId);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    const url = `/collector-wallet/complete-history?${queryString}`;

    const response = await api.get(url);
    const apiData = response.data.data || response.data;
    return {
      transactions: apiData.transactions || [],
      pagination: apiData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      wallet: apiData.wallet || {
        id: '',
        balance: 0,
        currency: 'ARS'
      }
    };
  }

  /**
   * Get detailed information about a manager
   * Includes manager info, dinero en calle, and active loans with subloans
   */
  async getManagerDetail(managerId: string): Promise<{
    manager: {
      id: string;
      fullName: string;
      email: string;
      clientQuota: number;
      usedClientQuota: number;
      availableClientQuota: number;
    };
    dineroEnCalle: number;
    totalLoans: number;
    loans: Array<{
      id: string;
      loanTrack: string;
      amount: number;
      originalAmount: number;
      currency: string;
      status: string;
      baseInterestRate: number;
      penaltyInterestRate: number;
      paymentFrequency: string;
      totalPayments: number;
      description: string | null;
      createdAt: string;
      client: {
        id: string;
        fullName: string;
        dni: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
      };
      subLoans: Array<{
        id: string;
        paymentNumber: number;
        amount: number;
        totalAmount: number;
        status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
        dueDate: string;
        paidDate: string | null;
        paidAmount: number;
        daysOverdue: number;
        createdAt: string;
        pendingAmount: number;
        isFullyPaid: boolean;
      }>;
      stats: {
        totalSubLoans: number;
        paidSubLoans: number;
        pendingSubLoans: number;
        overdueSubLoans: number;
        partialSubLoans: number;
        totalPaid: number;
        totalPending: number;
      };
    }>;
  }> {
    const response = await api.get(`/collector-wallet/manager-detail?managerId=${managerId}`);
    return response.data.data || response.data;
  }

  /**
   * Get managers balances (for subadmin)
   * Returns total balance and list of all managers with their collector wallet balances
   */
  async getManagersBalances(): Promise<{
    total: number;
    totalBalance: number;
    managers: Array<{
      managerId: string;
      email: string;
      fullName: string;
      collectorWallet: {
        id: string;
        balance: number;
        currency: string;
      };
    }>;
  }> {
    const response = await api.get('/collector-wallet/managers-balances');
    return response.data.data || response.data;
  }

  /**
   * Cash adjustment for collector wallet
   * Used to add money when balance is negative
   */
  async cashAdjustment(data: {
    managerId: string;
    amount: number;
    description: string;
  }): Promise<CollectorWalletWithdrawResponse> {
    const response = await api.post('/collector-wallet/cash-adjustment', data);
    return response.data.data || response.data;
  }

  /**
   * Get collections summary for a manager in a date range
   * Returns total amount and count of collections (COLLECTION transactions only)
   * @param managerId - Manager ID
   * @param startDate - Start date in DD/MM/YYYY format
   * @param endDate - End date in DD/MM/YYYY format
   */
  async getCollectionsSummary(
    managerId: string,
    startDate: string, // DD/MM/YYYY
    endDate: string    // DD/MM/YYYY
  ): Promise<{
    managerId: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    currency: string;
    totalCollections: number;
  }> {
    const response = await api.get(
      `/collector-wallet/collections-summary?managerId=${managerId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data || response.data;
  }
}

export const collectorWalletService = new CollectorWalletService();
export default collectorWalletService;

