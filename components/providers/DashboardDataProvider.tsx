'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';

// Services
import { subLoansLookupService } from '@/services/subloans-lookup.service';
import { subLoansService } from '@/services/sub-loans.service';
import { loansService } from '@/services/loans.service';
// import operativaService from '@/services/operativa.service'; // ⚠️ Disabled until backend ready
import { finanzasService } from '@/services/finanzas.service';
import { requestDeduplicator } from '@/lib/request-deduplicator';

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
  const { user } = useAuth();  // user.id is always available (minimal auth data)
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
  const hasTokenRef = useRef(false); // ✅ Track if we've seen the token
  
  // Cache to prevent redundant fetches
  const dataCache = useRef<{
    subLoans?: { timestamp: number; data: SubLoanWithClientInfo[] };
    finanzas?: { timestamp: number; data: Record<string, unknown> };
  }>({});
  
  const CACHE_TTL = 30000; // 30 seconds

  /**
   * Initialize SubLoans + Loans data (con deduplicación)
   */
  const initSubLoans = async (): Promise<void> => {
    if (!user || !token) {
      return;
    }

    try {
      // Usar deduplicador para cada llamada individual
      const dataPromise = Promise.all([
        requestDeduplicator.dedupe('subloans:with-client', 
          () => subLoansLookupService.getAllSubLoansWithClientInfo(),
          { ttl: 30000 }
        ),
        requestDeduplicator.dedupe('subloans:today-due',
          () => subLoansService.getTodayDueSubLoans(),
          { ttl: 30000 }
        ),
        requestDeduplicator.dedupe('subloans:all',
          () => subLoansService.getAllSubLoans(),
          { ttl: 30000 }
        ),
        requestDeduplicator.dedupe('subloans:stats',
          () => subLoansService.getTodayDueSubLoansStats(),
          { ttl: 30000 }
        ),
        requestDeduplicator.dedupe('loans:all',
          () => loansService.getAllLoans(),
          { ttl: 30000 }
        ),
      ]);

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('SubLoans timeout')), 15000)
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
      }
    } catch (error) {
      // SubLoans error (continuing)
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
   * ⚠️ DISABLED: Operativa endpoints not ready yet
   */
  const initOperativa = async (): Promise<void> => {
    // Gracefully set empty data
    operativaStore.setTransacciones([]);
    setLoadingStates((prev) => ({ ...prev, operativa: false }));
    
    // TODO: Uncomment when backend endpoints are ready
    /*
    if (!user) {
      return;
    }

    try {

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Operativa timeout')), 3000)
      );

      const transaccionesPromise = operativaService.getTransacciones(user?.id || '');
      const transacciones = await Promise.race([transaccionesPromise, timeoutPromise]);

      if (transacciones) {
        operativaStore.setTransacciones(transacciones);
      }
    } catch (error) {
      // Operativa error (continuing)
      // Graceful degradation
      operativaStore.setTransacciones([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, operativa: false }));
    }
    */
  };

  /**
   * Initialize Finanzas data (con deduplicación)
   */
  const initFinanzas = async (): Promise<void> => {
    if (!user) {
      return;
    }

    // Solo cargar finanzas para subadmin y manager
    if (user.role !== 'subadmin' && user.role !== 'manager') {
      setLoadingStates((prev) => ({ ...prev, finanzas: false }));
      return;
    }

    try {
      // Summary con deduplicador (60 segundos de caché)
      const summary = await requestDeduplicator.dedupe(
        `finanzas:summary:${user.id}`,
        () => finanzasService.getFinancialSummary(user?.id || '', user?.role || 'prestamista'),
        { ttl: 60000 }
      );

      if (summary) {
        finanzasStore.setFinancialSummary(summary);
      }

      // Parallel fetch con deduplicación individual
      const additionalDataPromises: Promise<unknown>[] = [];

      if (user?.role === 'subadmin') {
        additionalDataPromises.push(
          requestDeduplicator.dedupe(
            `finanzas:managers:${user.id}`,
            () => finanzasService.getManagersFinancial(user?.id || ''),
            { ttl: 60000 }
          ).catch(() => [] as ManagerFinancialData[]),
          requestDeduplicator.dedupe(
            `finanzas:portfolio:${user.id}`,
            () => finanzasService.getPortfolioEvolution(user?.id || ''),
            { ttl: 60000 }
          ).catch(() => [] as PortfolioEvolution[]),
          requestDeduplicator.dedupe(
            `finanzas:capital:${user.id}`,
            () => finanzasService.getCapitalDistribution(user?.id || ''),
            { ttl: 60000 }
          ).catch(() => [] as CapitalDistribution[])
        );
      }

      additionalDataPromises.push(
        requestDeduplicator.dedupe(
          `finanzas:active-loans:${user.id}`,
          () => finanzasService.getActiveLoansFinancial(user?.id || '', user?.role || 'prestamista'),
          { ttl: 60000 }
        ).catch(() => [] as ActiveLoanFinancial[]),
        requestDeduplicator.dedupe(
          `finanzas:income-expenses:${user.id}`,
          () => finanzasService.getIncomeVsExpenses(user?.id || ''),
          { ttl: 60000 }
        ).catch(() => [] as IncomeVsExpenses[])
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
    } catch (error) {
      // Finanzas error (continuing)
      // Graceful degradation: keep empty state
    } finally {
      setLoadingStates((prev) => ({ ...prev, finanzas: false }));
    }
  };

  /**
   * Initialize ALL dashboard data in PARALLEL
   */
  const initAllData = async (): Promise<void> => {
    // ✅ Wait for both user AND token to be available
    if (!user || !token) {
      setIsInitialLoading(false);
      return;
    }

    // ✅ Prevent duplicate initialization
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    hasTokenRef.current = true; // ✅ Mark that we've seen the token

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
    } catch (error) {
      // Initialization error
    } finally {
      // ALWAYS unblock dashboard
      setIsInitialLoading(false);
    }
  };

  /**
   * Refresh functions for manual refresh (invalidan caché antes)
   */
  const refreshSubLoans = async (): Promise<void> => {
    // Invalidar caché de subloans y loans
    requestDeduplicator.invalidatePattern(/^(subloans|loans):/);
    setLoadingStates((prev) => ({ ...prev, subLoans: true }));
    await initSubLoans();
  };

  const refreshOperativa = async (): Promise<void> => {
    setLoadingStates((prev) => ({ ...prev, operativa: true }));
    await initOperativa();
  };

  const refreshFinanzas = async (): Promise<void> => {
    // Invalidar caché de finanzas
    requestDeduplicator.invalidatePattern(/^finanzas:/);
    setLoadingStates((prev) => ({ ...prev, finanzas: true }));
    await initFinanzas();
  };

  const refreshAllData = async (): Promise<void> => {
    // Invalidar todos los cachés relacionados
    requestDeduplicator.invalidatePattern(/^(subloans|loans|finanzas):/);
    
    isInitializedRef.current = false;
    setIsInitialLoading(true);
    setLoadingStates({ subLoans: true, operativa: true, finanzas: true });
    await initAllData();
  };

  // Auto-initialize when user AND token are available
  useEffect(() => {
    // ✅ CRITICAL: Only initialize once we have BOTH user AND token
    if (user && token && !isInitializedRef.current) {
      initAllData();
    } else if (!user || !token) {
      setIsInitialLoading(false);
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

