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
  currency: 'ARS' | 'USD';
  description: string;
}

interface TransferRequest {
  managerId: string;
  amount: number;
  currency: 'ARS' | 'USD';
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
}

export const walletsService = new WalletsService();
export default walletsService;
