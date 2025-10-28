'use client';

import { useState, useCallback, useEffect } from 'react';
import { walletsService } from '@/services/wallets.service';
import { useWalletsStore } from '@/stores/wallets';
import type {
  Wallet,
  WalletTransaction,
  PaginatedResponse,
} from '@/types/auth';

interface UseWalletState {
  wallet: Wallet | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
}

interface UseWalletReturn extends UseWalletState {
  refetchWallet: () => Promise<void>;
  refetchBalance: () => Promise<void>;
  deposit: (
    amount: number,
    currency: string,
    description: string
  ) => Promise<Wallet | null>;
  transfer: (
    managerId: string,
    amount: number,
    currency: string,
    description: string
  ) => Promise<Wallet | null>;
  getTransactions: (
    page?: number,
    limit?: number
  ) => Promise<PaginatedResponse<WalletTransaction> | null>;
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

  // Get store actions
  const setCurrentUserWallet = useWalletsStore((state) => state.setCurrentUserWallet);

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

      // Also update Zustand store for global access
      setCurrentUserWallet({
        balance: walletData.balance,
        currency: walletData.currency,
        availableForLoan: (walletData as any).availableForLoan ?? walletData.balance,
        lockedAmount: (walletData as any).lockedAmount ?? 0,
      });
    } catch (err: any) {
      // Handle specific errors gracefully
      let errorMessage = 'Error al cargar la billetera';

      if (
        err?.status === 500 ||
        err?.statusCode === 500 ||
        err?.response?.status === 500
      ) {
        errorMessage =
          'Tu billetera aún no está configurada. Contacta al administrador.';
      } else if (
        err?.status === 404 ||
        err?.statusCode === 404 ||
        err?.response?.status === 404
      ) {
        errorMessage = 'Billetera no encontrada. Por favor contacta soporte.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.warn('useWallet - Wallet not available:', {
        status: err?.status || err?.statusCode,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUserWallet]);

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
      // Handle specific errors gracefully
      let errorMessage = 'Error al obtener el saldo';

      if (
        err?.status === 500 ||
        err?.statusCode === 500 ||
        err?.response?.status === 500
      ) {
        errorMessage = 'Tu billetera aún no está configurada.';
      } else if (
        err?.status === 404 ||
        err?.statusCode === 404 ||
        err?.response?.status === 404
      ) {
        errorMessage = 'Billetera no encontrada.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.warn('useWallet - Balance fetch error:', {
        status: err?.status || err?.statusCode,
      });
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
          currency: currency as 'ARS',
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
          currency: currency as 'ARS',
          description,
        });

        // Actualizar wallet del usuario actual con nuevo balance
        const updatedWallet = {
          ...wallet!,
          balance: result.fromWallet.newBalance,
        };
        setWallet(updatedWallet);
        setBalance(result.fromWallet.newBalance);

        // Update Zustand store as well
        setCurrentUserWallet({
          balance: result.fromWallet.newBalance,
          currency: updatedWallet.currency,
          availableForLoan: (updatedWallet as any).availableForLoan ?? result.fromWallet.newBalance,
          lockedAmount: (updatedWallet as any).lockedAmount ?? 0,
        });

        return updatedWallet;
      } catch (err: any) {
        const errorMessage = err?.message || 'Error creating transfer';
        setError(errorMessage);
        console.error('useWallet - transfer error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, setCurrentUserWallet]
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
        const transactions = await walletsService.getTransactions({
          page,
          limit,
        });
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
