'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { finanzasService } from '@/services/finanzas.service';
import { useFinanzasStore } from '@/stores/finanzas';
import { useAuth } from '@/hooks/useAuth';
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
      setIsInitialLoading(false);
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      

      const userRole = (user?.role || 'prestamista') as UserRole;

      // Get financial summary with timeout
      const summaryPromise = finanzasService.getFinancialSummary(
        user?.id || '',
        userRole === 'subadmin' ? 'subadmin' : 'manager'
      );

      // Set timeout to prevent blocking (5 seconds)
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          
          resolve(null);
        }, 5000)
      );

      const summary = await Promise.race([summaryPromise, timeoutPromise]);

      if (abortController.signal.aborted) {
        return false;
      }

      if (summary) {
        setFinancialSummary(summary);
        
      } else {
        
      }

      if (userRole === 'subadmin') {
        // Load subadmin data with graceful degradation
        const [managersData, portfolioData, capitalDist] = await Promise.allSettled([
          finanzasService.getManagersFinancial(user?.id || ''),
          finanzasService.getPortfolioEvolution(user?.id || '', 30),
          finanzasService.getCapitalDistribution(user?.id || '')
        ]);

        if (abortController.signal.aborted) {
          return false;
        }

        // Set data with graceful fallbacks
        if (managersData.status === 'fulfilled') {
          setManagersFinancial(managersData.value);
          
        } else {
          
          setManagersFinancial([]);
        }

        if (portfolioData.status === 'fulfilled') {
          setPortfolioEvolution(portfolioData.value);
        } else {
          
          setPortfolioEvolution([]);
        }

        if (capitalDist.status === 'fulfilled') {
          setCapitalDistribution(capitalDist.value);
        } else {
          
          setCapitalDistribution([]);
        }

      } else if (userRole === 'manager' || userRole === 'prestamista') {
        // Load manager data with graceful degradation
        const [loansData, portfolioData, incomeData] = await Promise.allSettled([
          finanzasService.getActiveLoansFinancial(user?.id || ''),
          finanzasService.getPortfolioEvolution(user?.id || '', 30),
          finanzasService.getIncomeVsExpenses(user?.id || '', 6)
        ]);

        if (abortController.signal.aborted) {
          return false;
        }

        // Set data with graceful fallbacks
        if (loansData.status === 'fulfilled') {
          setActiveLoansFinancial(loansData.value);
        } else {
          
          setActiveLoansFinancial([]);
        }

        if (portfolioData.status === 'fulfilled') {
          setPortfolioEvolution(portfolioData.value);
        } else {
          
          setPortfolioEvolution([]);
        }

        if (incomeData.status === 'fulfilled') {
          setIncomeVsExpenses(incomeData.value);
        } else {
          
          setIncomeVsExpenses([]);
        }

      }

      return true;
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }

      
      // Don't throw - allow dashboard to continue loading
      return false;
    } finally {
      // ALWAYS set loading to false to prevent blocking
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
      {/* Removed blocking overlay - finanzas loads in background */}
      {/* Dashboard can render while finanzas data loads */}
      {children}
    </FinanzasProviderContext.Provider>
  );
}
