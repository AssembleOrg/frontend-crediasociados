'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { finanzasService } from '@/services/finanzas.service';
import { useFinanzasStore } from '@/stores/finanzas';
import { useAuth } from '@/hooks/useAuth';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';
import type { UserRole } from '@/types/auth';

interface FinanzasProviderProps {
  children: React.ReactNode;
}

interface FinanzasProviderContextType {
  refreshData: () => Promise<void>;
  isInitialLoading: boolean;
}

const FinanzasProviderContext = createContext<FinanzasProviderContextType | null>(null);

export const useFinanzasProviderContext = () => {
  const context = useContext(FinanzasProviderContext);
  if (!context) {
    throw new Error('useFinanzasProviderContext must be used within FinanzasProvider');
  }
  return context;
};

export default function FinanzasProvider({ children }: FinanzasProviderProps) {
  const {
    setFinancialSummary,
    setManagersFinancial,
    setActiveLoansFinancial,
    setPortfolioEvolution,
    setIncomeVsExpenses,
    setCapitalDistribution
  } = useFinanzasStore();

  const { user } = useAuth();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);
  const hasUserBeenAvailableRef = useRef(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const initFinanzasData = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log('💰 Inicializando datos de Finanzas...');

      const userRole = user.role as UserRole;

      const summary = await finanzasService.getFinancialSummary(
        user.id,
        userRole === 'subadmin' ? 'subadmin' : 'manager'
      );

      if (abortController.signal.aborted) {
        return false;
      }

      setFinancialSummary(summary);

      if (userRole === 'subadmin') {
        const [managersData, portfolioData, capitalDist] = await Promise.all([
          finanzasService.getManagersFinancial(user.id),
          finanzasService.getPortfolioEvolution(user.id, 30),
          finanzasService.getCapitalDistribution(user.id)
        ]);

        if (abortController.signal.aborted) {
          return false;
        }

        setManagersFinancial(managersData);
        setPortfolioEvolution(portfolioData);
        setCapitalDistribution(capitalDist);

        console.log('✅ Finanzas data initialized (subadmin)');
      } else if (userRole === 'manager' || userRole === 'prestamista') {
        const [loansData, portfolioData, incomeData] = await Promise.all([
          finanzasService.getActiveLoansFinancial(user.id),
          finanzasService.getPortfolioEvolution(user.id, 30),
          finanzasService.getIncomeVsExpenses(user.id, 6)
        ]);

        if (abortController.signal.aborted) {
          return false;
        }

        setActiveLoansFinancial(loansData);
        setPortfolioEvolution(portfolioData);
        setIncomeVsExpenses(incomeData);

        console.log('✅ Finanzas data initialized (manager/prestamista)');
      }

      return true;
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('Error initializing finanzas data:', err);
      return false;
    } finally {
      if (!abortController.signal.aborted) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isInitializedRef.current) return;
      if (!user) return;

      isInitializedRef.current = true;
      hasUserBeenAvailableRef.current = true;

      await initFinanzasData();
    };

    if (user && !hasUserBeenAvailableRef.current) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refreshData = async (): Promise<void> => {
    await initFinanzasData();
  };

  const contextValue: FinanzasProviderContextType = {
    refreshData,
    isInitialLoading
  };

  return (
    <FinanzasProviderContext.Provider value={contextValue}>
      <AuthLoadingOverlay
        open={isInitialLoading && !!user}
        message="Cargando datos financieros..."
      />
      {children}
    </FinanzasProviderContext.Provider>
  );
}
