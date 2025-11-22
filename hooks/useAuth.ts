'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { useClientsStore } from '@/stores/clients';
import { useStatsStore } from '@/stores/stats';
import { useLoansStore } from '@/stores/loans';
import { useSubLoansStore } from '@/stores/sub-loans';
import { useFiltersStore } from '@/stores/filters';
import { useFinanzasStore } from '@/stores/finanzas';
import { useOperativaStore } from '@/stores/operativa';
import { useWalletsStore } from '@/stores/wallets';
import { authService } from '@/services/auth.service';
import { usersService } from '@/services/users.service';
import { setAuthToken } from '@/services/api';
import { apiUserToUser } from '@/types/transforms';
import { clearAllCaches, clearAllData } from '@/lib/cache-manager';
import type { LoginDto, ApiError } from '@/types/auth';

/**
 * THE CHEF/CONTROLLER - useAuth Hook
 * The brain of the authentication operation.
 * - Calls the Service
 * - Handles loading and error states
 * - Gives simple orders to the Store to update data
 * - Returns everything the UI needs
 */
export const useAuth = () => {
  const router = useRouter();
  const authStore = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStore.token) {
      setAuthToken(authStore.token);
    }
  }, [authStore.token]);

  const login = useCallback(
    async (credentials: LoginDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // CRITICAL: Clear all caches and stores BEFORE login to ensure fresh data
        // This prevents data from previous sessions mixing with new user data
        clearAllCaches();
        
        // Clear all stores that contain user-specific data to prevent cross-user contamination
        const usersStore = useUsersStore.getState();
        usersStore.clearUsers();
        if ('clearCache' in usersStore && typeof (usersStore as any).clearCache === 'function') {
          (usersStore as any).clearCache();
        }
        
        const clientsStore = useClientsStore.getState();
        clientsStore.clearClients();
        if ('clearCache' in clientsStore && typeof (clientsStore as any).clearCache === 'function') {
          (clientsStore as any).clearCache();
        }
        
        const statsStore = useStatsStore.getState();
        statsStore.clearStats();
        if ('clearCache' in statsStore && typeof (statsStore as any).clearCache === 'function') {
          (statsStore as any).clearCache();
        }
        
        // Clear loans store
        const loansStore = useLoansStore.getState();
        if (loansStore.reset) {
          loansStore.reset();
        }
        
        // Clear sub-loans store
        const subLoansStore = useSubLoansStore.getState();
        if (subLoansStore.reset) {
          subLoansStore.reset();
        }
        
        // Clear filters store
        const filtersStore = useFiltersStore.getState();
        if (filtersStore.clearAllFilters) {
          filtersStore.clearAllFilters();
        }
        
        // Clear finanzas store
        const finanzasStore = useFinanzasStore.getState();
        if (finanzasStore.clearFinancialData) {
          finanzasStore.clearFinancialData();
        }
        
        // Clear operativa store
        const operativaStore = useOperativaStore.getState();
        if (operativaStore.clearTransacciones) {
          operativaStore.clearTransacciones();
        }
        
        // Clear wallets store
        const walletsStore = useWalletsStore.getState();
        if (walletsStore.invalidateAll) {
          walletsStore.invalidateAll();
        }

        const response = await authService.login(credentials);

        if (!response.user) {
          throw new Error(
            'Backend returned invalid response: user data is missing'
          );
        }

        const user = apiUserToUser(response.user);

        // Set tokens first so API calls work
        authStore.setTokens(response.token, response.refreshToken);
        authStore.setAuthentication(true);
        setAuthToken(response.token);

        // CRITICAL: Fetch complete user data with quotas
        // Login endpoint might not include clientQuota/usedClientQuota
        try {
          const completeUserData = await usersService.getUserById(user.id);
          const completeUser = apiUserToUser(completeUserData);
          
          authStore.setUser(completeUser);
          useUsersStore.getState().upsertUsers([completeUser]);
        } catch (error) {
          // Fallback to basic user data if fetch fails
          
          authStore.setUser(user);
          useUsersStore.getState().upsertUsers([user]);
        }

        
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Login failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authStore]
  );

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!authStore.refreshToken) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.refresh({
        refreshToken: authStore.refreshToken,
      });

      authStore.setTokens(response.token, response.refreshToken);

      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Token refresh failed');

      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authStore]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout(authStore.refreshToken || undefined);
    } catch (err) {
      
    } finally {
      // CRITICAL: Clear ALL data including auth on logout
      
      clearAllData(); // This clears auth store too
      authService.clearAuth();
      setIsLoading(false);

      
      router.replace('/login');
    }
  }, [authStore, router]);

  const navigateToDashboard = useCallback(() => {
    // Get fresh state directly from store (not from closure)
    const freshState = useAuthStore.getState();
    const dashboardRoute = freshState.getDashboardRoute();
    
    router.push(dashboardRoute);
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh current user data from backend
   * Use this after operations that modify user quotas (create/edit/delete users)
   */
  const refreshCurrentUser = useCallback(async (): Promise<boolean> => {
    if (!authStore.currentUser?.id) {
      
      return false;
    }

    try {
      
      
      // ✅ FIRST: Recalculate quota on backend to ensure data consistency
      try {
        
        const recalcResult = await usersService.recalculateUserQuota(authStore.currentUser.id);
        
      } catch (recalcError) {
        // Quota recalculation failed (non-critical) - continue anyway
      }
      
      // ✅ THEN: Fetch fresh user data with updated quota
      const updatedUserData = await usersService.getUserById(authStore.currentUser.id);
      const updatedUser = apiUserToUser(updatedUserData);
      
      authStore.updateCurrentUser(updatedUser);
      useUsersStore.getState().upsertUsers([updatedUser]);
      
      return true;
    } catch (error) {
      
      return false;
    }
  }, [authStore]);

  // Memoize user object to prevent infinite loops when userId/email/role haven't changed
  // This prevents useEffect dependencies from being triggered by object reference changes
  const memoizedUser = useMemo(() => ({
    id: authStore.userId,
    email: authStore.userEmail,
    role: authStore.userRole,
  }), [authStore.userId, authStore.userEmail, authStore.userRole]);

  return {
    // Return minimal auth info
    user: memoizedUser,
    isAuthenticated: authStore.isAuthenticated,

    isLoading,
    error,

    login,
    logout,
    refreshToken,
    navigateToDashboard,
    refreshCurrentUser,
    clearError,
  };
};
