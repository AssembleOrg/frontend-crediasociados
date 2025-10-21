import api from './api';
import type {
  Wallet,
  WalletTransaction,
  PaginatedResponse,
} from '@/types/auth';

type WalletResponse = Wallet;

interface DepositResponse {
  wallet: Wallet;
  transaction: WalletTransaction;
}

interface TransferResponse {
  fromWallet: { userId: string; newBalance: number };
  toWallet: { userId: string; newBalance: number };
  transaction: WalletTransaction;
}

interface BalanceResponse {
  balance: number;
  currency: string;
  availableForLoan: number;
  lockedAmount: number;
}

interface DepositRequest {
  amount: number;
  currency: 'ARS';
  description: string;
}

interface TransferRequest {
  managerId: string;
  amount: number;
  currency: 'ARS';
  description: string;
}

class WalletsService {
  async getMyWallet(): Promise<WalletResponse> {
    const response = await api.get('/wallets/my-wallet');
    return response.data.data;
  }

  async deposit(data: DepositRequest): Promise<DepositResponse> {
    const response = await api.post('/wallets/deposit', data);
    return response.data.data;
  }

  async transfer(data: TransferRequest): Promise<TransferResponse> {
    const response = await api.post('/wallets/transfer', data);
    return response.data.data;
  }

  async getBalance(): Promise<BalanceResponse> {
    const response = await api.get('/wallets/balance');
    return response.data.data;
  }

  async getTransactions(
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<WalletTransaction>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString
      ? `/wallets/transactions?${queryString}`
      : '/wallets/transactions';

    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Cache for storing wallet balances by userId
   * Used to enrich user data without making multiple API calls
   */
  private walletCache: Map<string, { balance: number; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached wallet balance or fetch fresh if expired
   */
  async getCachedBalance(userId?: string): Promise<BalanceResponse> {
    // For now, this only works for current user
    // In the future, this could be enhanced if backend supports fetching other users' balances
    const cacheKey = userId || 'current';
    const cached = this.walletCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return {
        balance: cached.balance,
        currency: 'ARS',
        availableForLoan: cached.balance,
        lockedAmount: 0,
      };
    }

    // Fetch fresh data (only works for authenticated user currently)
    const balance = await this.getBalance();
    this.walletCache.set(cacheKey, {
      balance: balance.balance,
      timestamp: Date.now(),
    });

    return balance;
  }

  /**
   * Clear cache for a specific user or all
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.walletCache.delete(userId);
    } else {
      this.walletCache.clear();
    }
  }
}

export const walletsService = new WalletsService();
export default walletsService;
