'use client';

import { useState, useCallback, useEffect } from 'react';
import { walletsService } from '@/services/wallets.service';
import type { Wallet, WalletTransaction, PaginatedResponse } from '@/types/auth';

interface UseWalletState {
  wallet: Wallet | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
}

interface UseWalletReturn extends UseWalletState {
  refetchWallet: () => Promise<void>;
  refetchBalance: () => Promise<void>;
  deposit: (amount: number, currency: string, description: string) => Promise<Wallet | null>;
  transfer: (managerId: string, amount: number, currency: string, description: string) => Promise<Wallet | null>;
  getTransactions: (page?: number, limit?: number) => Promise<PaginatedResponse<WalletTransaction> | null>;
  clearError: () => void;
}

/**
 * Hook para gestionar operaciones de cartera del usuario
 * Proporciona acceso a saldo, transacciones y operaciones de depósito/transferencia
 *
 * @param autoFetch - Si true, fetch automáticamente al montar (default: true)
 * @returns Estado y métodos de cartera
 */
export const useWallet = (autoFetch: boolean = true): UseWalletReturn => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener datos completos de la cartera
   */
  const refetchWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletData = await walletsService.getMyWallet();
      setWallet(walletData);
      setBalance(walletData.balance);
    } catch (err: any) {
      const errorMessage = err?.message || 'Error fetching wallet';
      setError(errorMessage);
      console.error('useWallet - refetchWallet error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtener solo el saldo (operación más ligera)
   */
  const refetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const balanceData = await walletsService.getBalance();
      setBalance(balanceData.balance);
      // Actualizar wallet con nuevos datos de disponibilidad
      if (wallet) {
        setWallet({
          ...wallet,
          balance: balanceData.balance,
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error fetching balance';
      setError(errorMessage);
      console.error('useWallet - refetchBalance error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  /**
   * Realizar depósito a la cartera
   */
  const deposit = useCallback(
    async (
      amount: number,
      currency: string,
      description: string
    ): Promise<Wallet | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await walletsService.deposit({
          amount,
          currency: currency as 'ARS' | 'USD',
          description,
        });

        // Actualizar wallet con nuevo balance
        setWallet(result.wallet);
        setBalance(result.wallet.balance);

        return result.wallet;
      } catch (err: any) {
        const errorMessage = err?.message || 'Error creating deposit';
        setError(errorMessage);
        console.error('useWallet - deposit error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Transferir dinero a otro usuario (manager)
   */
  const transfer = useCallback(
    async (
      managerId: string,
      amount: number,
      currency: string,
      description: string
    ): Promise<Wallet | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await walletsService.transfer({
          managerId,
          amount,
          currency: currency as 'ARS' | 'USD',
          description,
        });

        // Actualizar wallet del usuario actual con nuevo balance
        setWallet({
          ...wallet!,
          balance: result.fromWallet.newBalance,
        });
        setBalance(result.fromWallet.newBalance);

        return {
          ...wallet!,
          balance: result.fromWallet.newBalance,
        };
      } catch (err: any) {
        const errorMessage = err?.message || 'Error creating transfer';
        setError(errorMessage);
        console.error('useWallet - transfer error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  /**
   * Obtener historial de transacciones de la cartera
   */
  const getTransactions = useCallback(
    async (
      page: number = 1,
      limit: number = 10
    ): Promise<PaginatedResponse<WalletTransaction> | null> => {
      setError(null);

      try {
        const transactions = await walletsService.getTransactions({ page, limit });
        return transactions;
      } catch (err: any) {
        const errorMessage = err?.message || 'Error fetching transactions';
        setError(errorMessage);
        console.error('useWallet - getTransactions error:', err);
        return null;
      }
    },
    []
  );

  /**
   * Limpiar el error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Auto-fetch al montar si autoFetch = true
   */
  useEffect(() => {
    if (autoFetch) {
      refetchWallet();
    }
  }, [autoFetch, refetchWallet]);

  return {
    wallet,
    balance,
    isLoading,
    error,
    refetchWallet,
    refetchBalance,
    deposit,
    transfer,
    getTransactions,
    clearError,
  };
};

export default useWallet;
