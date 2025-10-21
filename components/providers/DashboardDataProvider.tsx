'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';

// Services
import { subLoansLookupService } from '@/services/subloans-lookup.service';
import { subLoansService } from '@/services/sub-loans.service';
import { loansService } from '@/services/loans.service';
import { operativaService } from '@/services/operativa.service';
import { finanzasService } from '@/services/finanzas.service';

// Stores
import { useSubLoansStore } from '@/stores/sub-loans';
import { useLoansStore } from '@/stores/loans';
import { useOperativaStore } from '@/stores/operativa';
import { useFinanzasStore } from '@/stores/finanzas';

// Utils
import { apiLoanToLoan } from '@/types/transforms';

// Types
import type {
  ManagerFinancialData,
  ActiveLoanFinancial,
  PortfolioEvolution,
  IncomeVsExpenses,
  CapitalDistribution
} from '@/types/finanzas';
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service';

interface DashboardDataProviderProps {
  children: React.ReactNode;
}

interface DashboardDataProviderContextType {
  refreshAllData: () => Promise<void>;
  refreshSubLoans: () => Promise<void>;
  refreshOperativa: () => Promise<void>;
  refreshFinanzas: () => Promise<void>;
  isInitialLoading: boolean;
  loadingStates: {
    subLoans: boolean;
    operativa: boolean;
    finanzas: boolean;
  };
}

const DashboardDataProviderContext = createContext<DashboardDataProviderContextType | null>(null);

export const useDashboardDataProvider = () => {
  const context = useContext(DashboardDataProviderContext);
  if (!context) {
    throw new Error('useDashboardDataProvider must be used within DashboardDataProvider');
  }
  return context;
};

/**
 * DashboardDataProvider - Unified Provider Pattern
 * 
 * Solves "Provider Hell" by:
 * 1. ✅ Single provider instead of nested providers
 * 2. ✅ Parallel data loading (no waterfall)
 * 3. ✅ Graceful degradation (errors don't block dashboard)
 * 4. ✅ Independent loading states per module
 * 5. ✅ Timeout protection (5s max)
 * 6. ✅ No blocking overlays
 * 7. ✅ Background loading
 * 
 * Replaces:
 * - SubLoansProvider (nested)
 * - OperativaProvider (nested)
 * - FinanzasProvider (nested)
 */
export default function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const { user } = useAuth();
  const { token } = useAuthStore();

  // Stores
  const subLoansStore = useSubLoansStore();
  const loansStore = useLoansStore();
  const operativaStore = useOperativaStore();
  const finanzasStore = useFinanzasStore();

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    subLoans: true,
    operativa: true,
    finanzas: true,
  });

  // Race condition prevention
  const isInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache to prevent redundant fetches
  const dataCache = useRef<{
    subLoans?: { timestamp: number; data: SubLoanWithClientInfo[] };
    finanzas?: { timestamp: number; data: Record<string, unknown> };
  }>({});
  
  const CACHE_TTL = 30000; // 30 seconds

  /**
   * Initialize SubLoans + Loans data
   */
  const initSubLoans = async (): Promise<void> => {
    if (!user || !token) {
      console.log('🏦 [DASHBOARD PROVIDER] Skipping SubLoans - no user/token');
      return;
    }

    try {
      console.time('🏦 SubLoans Load');
      console.log('🏦 [DASHBOARD PROVIDER] Loading SubLoans + Loans...');

      // Parallel fetch with timeout
      const dataPromise = Promise.all([
        subLoansLookupService.getAllSubLoansWithClientInfo(),
        subLoansService.getTodayDueSubLoans(),
        subLoansService.getAllSubLoans(),
        subLoansService.getTodayDueSubLoansStats(),
        loansService.getAllLoans(),
      ]);

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('SubLoans timeout')), 5000)
      );

      const result = await Promise.race([dataPromise, timeoutPromise]);

      if (result) {
        const [enrichedSubLoans, todayDue, allSubLoans, stats, loansResponse] = result;

        subLoansStore.setAllSubLoansWithClient(enrichedSubLoans);
        subLoansStore.setTodayDueSubLoans(todayDue);
        subLoansStore.setAllSubLoans(allSubLoans);
        subLoansStore.setStats(stats);
        subLoansStore.setPagination({
          page: 1,
          limit: 20,
          total: todayDue.length,
          totalPages: Math.ceil(todayDue.length / 20),
        });

        const transformedLoans = loansResponse.map(apiLoanToLoan);
        loansStore.setLoans(transformedLoans);

        console.log('✅ [DASHBOARD PROVIDER] SubLoans loaded:', {
          enrichedSubLoans: enrichedSubLoans.length,
          todayDue: todayDue.length,
          allSubLoans: allSubLoans.length,
          loans: transformedLoans.length,
        });
      }

      console.timeEnd('🏦 SubLoans Load');
    } catch (error) {
      console.error('🏦 [DASHBOARD PROVIDER] SubLoans error (continuing):', error);
      // Graceful degradation: set empty arrays
        subLoansStore.setAllSubLoansWithClient([]);
        subLoansStore.setTodayDueSubLoans([]);
        subLoansStore.setAllSubLoans([]);
        subLoansStore.setStats({
          totalDueToday: 0,
          pendingCount: 0,
          overdueCount: 0,
          paidCount: 0,
          totalAmount: 0
        });
        loansStore.setLoans([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, subLoans: false }));
      subLoansStore.setLoading(false);
    }
  };

  /**
   * Initialize Operativa data
   */
  const initOperativa = async (): Promise<void> => {
    if (!user) {
      console.log('🧾 [DASHBOARD PROVIDER] Skipping Operativa - no user');
      return;
    }

    try {
      console.time('🧾 Operativa Load');
      console.log('🧾 [DASHBOARD PROVIDER] Loading Operativa...');

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Operativa timeout')), 3000)
      );

      const transaccionesPromise = operativaService.getTransacciones(user.id);
      const transacciones = await Promise.race([transaccionesPromise, timeoutPromise]);

      if (transacciones) {
        operativaStore.setTransacciones(transacciones);
        console.log('✅ [DASHBOARD PROVIDER] Operativa loaded:', transacciones.length);
      }

      console.timeEnd('🧾 Operativa Load');
    } catch (error) {
      console.error('🧾 [DASHBOARD PROVIDER] Operativa error (continuing):', error);
      // Graceful degradation
      operativaStore.setTransacciones([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, operativa: false }));
    }
  };

  /**
   * Initialize Finanzas data
   */
  const initFinanzas = async (): Promise<void> => {
    if (!user) {
      console.log('💰 [DASHBOARD PROVIDER] Skipping Finanzas - no user');
      return;
    }

    // Check cache
    const now = Date.now();
    if (dataCache.current.finanzas && 
        now - dataCache.current.finanzas.timestamp < CACHE_TTL) {
      console.log('💰 [DASHBOARD PROVIDER] Using cached finanzas data');
      return;
    }

    try {
      console.time('💰 Finanzas Load');
      console.log('💰 [DASHBOARD PROVIDER] Loading Finanzas...');

      // Only load finanzas for subadmin and manager roles
      if (user.role !== 'subadmin' && user.role !== 'manager') {
        console.log('💰 [DASHBOARD PROVIDER] Skipping Finanzas - role not supported:', user.role);
        return;
      }

      // Summary with timeout
      const summaryPromise = finanzasService.getFinancialSummary(user.id, user.role);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Finanzas summary timeout')), 5000)
      );

      const summary = await Promise.race([summaryPromise, timeoutPromise]);

      if (summary) {
        finanzasStore.setFinancialSummary(summary);
      }

      // Parallel fetch of additional data with Promise.allSettled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const additionalDataPromises: Promise<any>[] = [];

      if (user.role === 'subadmin') {
        additionalDataPromises.push(
          finanzasService.getManagersFinancial(user.id).catch((err) => {
            console.warn('💰 Managers financial failed:', err);
            return [] as ManagerFinancialData[];
          }),
          finanzasService.getPortfolioEvolution(user.id).catch((err) => {
            console.warn('💰 Portfolio evolution failed:', err);
            return [] as PortfolioEvolution[];
          }),
          finanzasService.getCapitalDistribution(user.id).catch((err) => {
            console.warn('💰 Capital distribution failed:', err);
            return [] as CapitalDistribution[];
          })
        );
      }

      additionalDataPromises.push(
        finanzasService.getActiveLoansFinancial(user.id, user.role).catch((err) => {
          console.warn('💰 Active loans failed:', err);
          return [] as ActiveLoanFinancial[];
        }),
        finanzasService.getIncomeVsExpenses(user.id).catch((err) => {
          console.warn('💰 Income vs expenses failed:', err);
          return [] as IncomeVsExpenses[];
        })
      );

      const results = await Promise.allSettled(additionalDataPromises);

      // Extract results with graceful degradation
      let resultIndex = 0;
      if (user.role === 'subadmin') {
        const managersResult = results[resultIndex++];
        const portfolioResult = results[resultIndex++];
        const capitalResult = results[resultIndex++];

        if (managersResult.status === 'fulfilled') {
          finanzasStore.setManagersFinancial(managersResult.value as ManagerFinancialData[]);
        }
        if (portfolioResult.status === 'fulfilled') {
          finanzasStore.setPortfolioEvolution(portfolioResult.value as PortfolioEvolution[]);
        }
        if (capitalResult.status === 'fulfilled') {
          finanzasStore.setCapitalDistribution(capitalResult.value as CapitalDistribution[]);
        }
      }

      const loansResult = results[resultIndex++];
      const incomeResult = results[resultIndex++];

      if (loansResult.status === 'fulfilled') {
        finanzasStore.setActiveLoansFinancial(loansResult.value as ActiveLoanFinancial[]);
      }
      if (incomeResult.status === 'fulfilled') {
        finanzasStore.setIncomeVsExpenses(incomeResult.value as IncomeVsExpenses[]);
      }

      console.log('✅ [DASHBOARD PROVIDER] Finanzas loaded');
      console.timeEnd('💰 Finanzas Load');

      // Update cache
      dataCache.current.finanzas = {
        timestamp: Date.now(),
        data: summary ? (summary as unknown as Record<string, unknown>) : {}
      };
    } catch (error) {
      console.error('💰 [DASHBOARD PROVIDER] Finanzas error (continuing):', error);
      // Graceful degradation: keep empty state
    } finally {
      setLoadingStates((prev) => ({ ...prev, finanzas: false }));
    }
  };

  /**
   * Initialize ALL dashboard data in PARALLEL
   */
  const initAllData = async (): Promise<void> => {
    if (!user || !token) {
      setIsInitialLoading(false);
      return;
    }

    if (isInitializedRef.current) {
      console.log('🔄 [DASHBOARD PROVIDER] Already initialized, skipping...');
      return;
    }

    isInitializedRef.current = true;

    console.log('🚀 [DASHBOARD PROVIDER] Initializing ALL dashboard data in PARALLEL...');
    console.time('🚀 Total Dashboard Load');

    try {
      // Cancel any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Load ALL modules in PARALLEL (not sequential!)
      await Promise.allSettled([
        initSubLoans(),
        initOperativa(),
        initFinanzas(),
      ]);

      console.log('✅ [DASHBOARD PROVIDER] All data initialized');
      console.timeEnd('🚀 Total Dashboard Load');
    } catch (error) {
      console.error('🚀 [DASHBOARD PROVIDER] Initialization error:', error);
    } finally {
      // ALWAYS unblock dashboard
      setIsInitialLoading(false);
      console.log('🚀 [DASHBOARD PROVIDER] Dashboard ready');
    }
  };

  /**
   * Refresh functions for manual refresh
   */
  const refreshSubLoans = async (): Promise<void> => {
    setLoadingStates((prev) => ({ ...prev, subLoans: true }));
    await initSubLoans();
  };

  const refreshOperativa = async (): Promise<void> => {
    setLoadingStates((prev) => ({ ...prev, operativa: true }));
    await initOperativa();
  };

  const refreshFinanzas = async (): Promise<void> => {
    setLoadingStates((prev) => ({ ...prev, finanzas: true }));
    await initFinanzas();
  };

  const refreshAllData = async (): Promise<void> => {
    isInitializedRef.current = false;
    setIsInitialLoading(true);
    setLoadingStates({ subLoans: true, operativa: true, finanzas: true });
    await initAllData();
  };

  // Auto-initialize when user is available
  useEffect(() => {
    if (user && token) {
      initAllData();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const contextValue: DashboardDataProviderContextType = {
    refreshAllData,
    refreshSubLoans,
    refreshOperativa,
    refreshFinanzas,
    isInitialLoading,
    loadingStates,
  };

  return (
    <DashboardDataProviderContext.Provider value={contextValue}>
      {/* No blocking overlay - dashboard renders immediately */}
      {/* Individual components can show loading states */}
      {children}
    </DashboardDataProviderContext.Provider>
  );
}

