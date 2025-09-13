'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
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

  // Global initialization - ALL SubLoans data types in parallel
  const initAllSubLoansData = async (): Promise<boolean> => {
    if (!currentUser || !['ADMIN', 'SUBADMIN', 'MANAGER', 'prestamista'].includes(currentUser.role)) {
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      console.log('🏦 Inicializando TODOS los datos de SubLoans + Loans globalmente (Consolidated Provider Pattern)');

      // Initialize ALL data types in parallel
      const [
        enrichedSubLoans,
        todayDueResponse,
        allSubLoansResponse,
        statsResponse,
        loansResponse
      ] = await Promise.all([
        // 1. All SubLoans with Client Info
        subLoansLookupService.getAllSubLoansWithClientInfo(),
        
        // 2. Today Due SubLoans
        subLoansService.getTodayDueSubLoans({ page: 1, limit: 20 }),
        
        // 3. All SubLoans (basic)
        subLoansService.getAllSubLoans({ page: 1, limit: 50 }),
        
        // 4. Stats
        subLoansService.getTodayDueSubLoansStats(),
        
        // 5. Basic Loans (consolidated to prevent architectural drift)
        loansService.getAllLoans(),
      ]);

      if (abortController.signal.aborted) {
        return false;
      }

      // Update ALL store data
      setAllSubLoansWithClient(enrichedSubLoans);
      setTodayDueSubLoans(todayDueResponse.data);
      setAllSubLoans(allSubLoansResponse.data);
      setStats(statsResponse);
      
      // Transform and set loans data
      const transformedLoans = loansResponse.map(apiLoanToLoan);
      setLoans(transformedLoans);

      // Set pagination from todayDue response
      if (todayDueResponse.meta) {
        setPagination({
          page: todayDueResponse.meta.page,
          limit: todayDueResponse.meta.limit,
          total: todayDueResponse.meta.total,
          totalPages: todayDueResponse.meta.totalPages
        });
      }

      console.log('🔄 SubLoans + Loans data initialized globally (Consolidated):', {
        enrichedSubLoans: enrichedSubLoans.length,
        todayDue: todayDueResponse.data.length,
        allSubLoans: allSubLoansResponse.data.length,
        loans: transformedLoans.length,
        stats: !!statsResponse
      });

      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('Error initializing subloans data:', error);
      setError((error as Error).message || 'Error al cargar datos de préstamos');
      return false;

    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
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

  // Expose refreshData method via context
  const contextValue: SubLoansProviderContextType = {
    refreshData
  };

  return (
    <SubLoansProviderContext.Provider value={contextValue}>
      {children}
    </SubLoansProviderContext.Provider>
  );
}