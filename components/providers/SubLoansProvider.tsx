'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { subLoansLookupService } from '@/services/subloans-lookup.service';
import { subLoansService } from '@/services/sub-loans.service';
import { loansService } from '@/services/loans.service';
import { useSubLoansStore } from '@/stores/sub-loans';
import { useLoansStore } from '@/stores/loans';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/hooks/useAuth';
import { apiLoanToLoan } from '@/types/transforms';

interface SubLoansProviderProps {
  children: React.ReactNode;
}

// Context for refreshing data
interface SubLoansProviderContextType {
  refreshData: () => Promise<void>;
  isInitialLoading: boolean;
}

const SubLoansProviderContext = createContext<SubLoansProviderContextType | null>(null);

export const useSubLoansProviderContext = () => {
  const context = useContext(SubLoansProviderContext);
  if (!context) {
    throw new Error('useSubLoansProviderContext must be used within SubLoansProvider');
  }
  return context;
};

export default function SubLoansProvider({ children }: SubLoansProviderProps) {
  const {
    setTodayDueSubLoans,
    setAllSubLoans,
    setAllSubLoansWithClient,
    setStats,
    setLoading,
    setError,
    setPagination,
    todayDueSubLoans,
    allSubLoans,
    allSubLoansWithClient,
    stats,
  } = useSubLoansStore();

  const {
    setLoans,
    loans,
  } = useLoansStore();

  const { token } = useAuthStore();
  const { user: currentUser } = useAuth();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);
  const hasTokenBeenAvailableRef = useRef(false);

  // Estado local para el loading inicial
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Global initialization - ALL SubLoans data types in parallel
  const initAllSubLoansData = async (): Promise<boolean> => {
    if (!currentUser || !['admin', 'subadmin', 'manager', 'prestamista'].includes(currentUser.role)) {
      setIsInitialLoading(false);
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      console.time('🏦 SubLoans Init - Total Time');
      console.log('🏦 [SUBLOANS PROVIDER] Inicializando TODOS los datos de SubLoans + Loans globalmente (Consolidated Provider Pattern)');

      console.time('🏦 API Calls (Parallel)');
      
      // Add timeout to prevent blocking (5 seconds for critical data)
      const dataPromise = Promise.all([
        // 1. All SubLoans with Client Info
        subLoansLookupService.getAllSubLoansWithClientInfo(),
        
        // 2. Today Due SubLoans
        subLoansService.getTodayDueSubLoans(),

        // 3. All SubLoans (basic)
        subLoansService.getAllSubLoans(),
        
        // 4. Stats
        subLoansService.getTodayDueSubLoansStats(),
        
        // 5. Basic Loans (consolidated to prevent architectural drift)
        loansService.getAllLoans(),
      ]);

      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          console.warn('🏦 [SUBLOANS PROVIDER] Fetch timeout, continuing with empty data');
          resolve(null);
        }, 5000)
      );

      const result = await Promise.race([dataPromise, timeoutPromise]);

      console.timeEnd('🏦 API Calls (Parallel)');

      if (abortController.signal.aborted) {
        return false;
      }

      if (!result) {
        console.warn('🏦 [SUBLOANS PROVIDER] Using empty data due to timeout');
        setAllSubLoansWithClient([]);
        setTodayDueSubLoans([]);
        setAllSubLoans([]);
        // Don't set stats since the store expects SubLoanStats, not null
        setLoans([]);
        return false;
      }

      const [
        enrichedSubLoans,
        todayDueResponse,
        allSubLoansResponse,
        statsResponse,
        loansResponse
      ] = result;

      console.time('🏦 Data Transform & Store Update');
      // Update ALL store data
      setAllSubLoansWithClient(enrichedSubLoans);
      setTodayDueSubLoans(todayDueResponse);
      setAllSubLoans(allSubLoansResponse);
      setStats(statsResponse);

      // Transform and set loans data
      const transformedLoans = loansResponse.map(apiLoanToLoan);
      setLoans(transformedLoans);

      // Set default pagination (since we're not using paginated responses anymore)
      setPagination({
        page: 1,
        limit: 20,
        total: todayDueResponse.length,
        totalPages: Math.ceil(todayDueResponse.length / 20)
      });

      console.timeEnd('🏦 Data Transform & Store Update');

      console.log('✅ [SUBLOANS PROVIDER] SubLoans + Loans data initialized globally (Consolidated):', {
        enrichedSubLoans: enrichedSubLoans.length,
        todayDue: todayDueResponse.length,
        allSubLoans: allSubLoansResponse.length,
        loans: transformedLoans.length,
        stats: !!statsResponse
      });

      console.timeEnd('🏦 SubLoans Init - Total Time');
      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('🏦 [SUBLOANS PROVIDER] Error initializing subloans data:', error);
      setError((error as Error).message || 'Error al cargar datos de préstamos');
      
      // Graceful degradation: set empty arrays instead of blocking
      setAllSubLoansWithClient([]);
      setTodayDueSubLoans([]);
      setAllSubLoans([]);
      // Don't set stats since the store expects SubLoanStats, not null
      setLoans([]);
      
      return false;

    } finally {
      // ALWAYS set loading to false to prevent blocking
      if (!abortController.signal.aborted) {
        setLoading(false);
        setIsInitialLoading(false);
        console.log('🏦 [SUBLOANS PROVIDER] Loading complete');
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isInitializedRef.current) return;
      if (!token || !currentUser) return;

      isInitializedRef.current = true;
      hasTokenBeenAvailableRef.current = true;

      // Initialize only if ANY store data is empty
      const needsInitialization = 
        allSubLoansWithClient.length === 0 ||
        todayDueSubLoans.length === 0 ||
        allSubLoans.length === 0 ||
        loans.length === 0 ||
        !stats;

      if (needsInitialization) {
        await initAllSubLoansData();
      } else {
        console.log('🔄 SubLoans data already available, skipping initialization');
        setIsInitialLoading(false);
      }
    };

    if (token && currentUser && !hasTokenBeenAvailableRef.current) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Wrapper function to match context type
  const refreshData = async (): Promise<void> => {
    await initAllSubLoansData();
  };

  // Expose refreshData method and isInitialLoading via context
  const contextValue: SubLoansProviderContextType = {
    refreshData,
    isInitialLoading
  };

  return (
    <SubLoansProviderContext.Provider value={contextValue}>
      {/* Removed blocking overlay - subloans loads in background */}
      {/* Dashboard can render while subloans data loads */}
      {children}
    </SubLoansProviderContext.Provider>
  );
}