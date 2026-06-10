'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';

// Services
// subLoansLookupService removed - heavy data loaded per-page now
import { subLoansService } from '@/services/sub-loans.service';
// loansService removed - loans loaded per-page now
// import operativaService from '@/services/operativa.service'; // ⚠️ Disabled until backend ready
import { finanzasService } from '@/services/finanzas.service';
import { requestDeduplicator } from '@/lib/request-deduplicator';

// Stores
import { useSubLoansStore } from '@/stores/sub-loans';
// useLoansStore removed - loans loaded per-page now
import { useOperativaStore } from '@/stores/operativa';
import { useFinanzasStore } from '@/stores/finanzas';

// Utils
// apiLoanToLoan removed - loans loaded per-page now

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
  // loansStore removed - loans loaded per-page now
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
  /**
   * Initialize only lightweight dashboard data.
   * Heavy data (loans, subloans) is loaded by each page that needs it.
   * - /prestamos loads its own loans via useLoans
   * - /cobros loads via GET /sub-loans/cobros (server-side)
   * - /rutas loads via useCollectionRoutes
   */
  const initSubLoans = async (): Promise<void> => {
    // Only load today-due stats for the dashboard summary cards
    if (!user || !token) {
      setLoadingStates((prev) => ({ ...prev, subLoans: false }));
      return;
    }

    try {
      const [todayDue, stats] = await Promise.all([
        requestDeduplicator.dedupe('subloans:today-due',
          () => subLoansService.getTodayDueSubLoans(),
          { ttl: 30000 }
        ),
        requestDeduplicator.dedupe('subloans:stats',
          () => subLoansService.getTodayDueSubLoansStats(),
          { ttl: 30000 }
        ),
      ]);

      subLoansStore.setTodayDueSubLoans(todayDue);
      subLoansStore.setStats(stats);
      subLoansStore.setPagination({
        page: 1,
        limit: 20,
        total: todayDue.length,
        totalPages: Math.ceil(todayDue.length / 20),
      });
    } catch (error) {
      subLoansStore.setTodayDueSubLoans([]);
      subLoansStore.setStats({
        totalDueToday: 0,
        pendingCount: 0,
        overdueCount: 0,
        paidCount: 0,
        totalAmount: 0
      });
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
   *
   * DISABLED for subadmin: the Finanzas page is not active in subadmin navigation,
   * and loading it triggers N requests per manager (loans/chart + transacciones)
   * causing 404s (operativa doesn't exist) and 429 rate limiting.
   * Re-enable when: (1) operativa backend exists, (2) finanzas page is active,
   * (3) backend has aggregate endpoints instead of per-manager calls.
   */
  const initFinanzas = async (): Promise<void> => {
    // Finanzas page is disabled for both subadmin and prestamista in navigation.
    // Skip loading to avoid request flood (operativa endpoints don't exist → 404s,
    // and it triggers per-manager calls for subadmin → 429 rate limiting).
    // Re-enable when finanzas page is active and operativa backend exists.
    if (!user || user.role === 'subadmin' || user.role === 'prestamista') {
      setLoadingStates((prev) => ({ ...prev, finanzas: false }));
      return;
    }

    if (user.role !== 'manager') {
      setLoadingStates((prev) => ({ ...prev, finanzas: false }));
      return;
    }

    try {
      const summary = await requestDeduplicator.dedupe(
        `finanzas:summary:${user.id}`,
        () => finanzasService.getFinancialSummary(user?.id || '', 'manager'),
        { ttl: 60000 }
      );

      if (summary) {
        finanzasStore.setFinancialSummary(summary);
      }

      const [loansResult, incomeResult] = await Promise.allSettled([
        requestDeduplicator.dedupe(
          `finanzas:active-loans:${user.id}`,
          () => finanzasService.getActiveLoansFinancial(user?.id || '', 'manager'),
          { ttl: 60000 }
        ).catch(() => [] as ActiveLoanFinancial[]),
        requestDeduplicator.dedupe(
          `finanzas:income-expenses:${user.id}`,
          () => finanzasService.getIncomeVsExpenses(user?.id || ''),
          { ttl: 60000 }
        ).catch(() => [] as IncomeVsExpenses[])
      ]);

      if (loansResult.status === 'fulfilled') {
        finanzasStore.setActiveLoansFinancial(loansResult.value as ActiveLoanFinancial[]);
      }
      if (incomeResult.status === 'fulfilled') {
        finanzasStore.setIncomeVsExpenses(incomeResult.value as IncomeVsExpenses[]);
      }
    } catch (error) {
      // Finanzas error (continuing)
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

