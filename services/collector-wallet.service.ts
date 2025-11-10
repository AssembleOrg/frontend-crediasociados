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
    const response = await api.post(`/users/${userId}/collector-wallet/withdraw`, data);
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
}

export const collectorWalletService = new CollectorWalletService();
export default collectorWalletService;

