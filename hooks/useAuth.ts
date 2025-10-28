'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
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
        // CRITICAL: Clear all caches BEFORE login to ensure fresh data
        console.log('🧹 LOGIN: Clearing all caches before authentication...');
        clearAllCaches();

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
          
          console.log('✅ Login successful with complete user data:', {
            userId: completeUser.id,
            role: completeUser.role,
            clientQuota: completeUser.clientQuota,
            hasToken: !!response.token,
          });
        } catch (error) {
          // Fallback to basic user data if fetch fails
          console.warn('Failed to fetch complete user data, using login response:', error);
          authStore.setUser(user);
          useUsersStore.getState().upsertUsers([user]);
        }

        console.log('✅ LOGIN: Fresh session started with clean caches');
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
      console.warn('Logout API call failed:', err);
    } finally {
      // CRITICAL: Clear ALL data including auth on logout
      console.log('🧹 LOGOUT: Clearing all data and caches...');
      clearAllData(); // This clears auth store too
      authService.clearAuth();
      setIsLoading(false);

      console.log('✅ LOGOUT: All data cleared, redirecting to login');
      router.replace('/login');
    }
  }, [authStore, router]);

  const navigateToDashboard = useCallback(() => {
    // Get fresh state directly from store (not from closure)
    const freshState = useAuthStore.getState();
    const dashboardRoute = freshState.getDashboardRoute();
    
    console.log('🚀 Navigating to dashboard:', {
      userRole: freshState.userRole,
      currentUser: freshState.currentUser?.role,
      route: dashboardRoute,
      isAuthenticated: freshState.isAuthenticated,
    });
    
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
      console.warn('⚠️ Cannot refresh: no current user ID');
      return false;
    }

    try {
      console.log('🔄 Refreshing current user data...', authStore.currentUser.id);
      
      // ✅ FIRST: Recalculate quota on backend to ensure data consistency
      try {
        console.log('🧮 Recalculating quota on backend...');
        const recalcResult = await usersService.recalculateUserQuota(authStore.currentUser.id);
        console.log('✅ Quota recalculated:', recalcResult);
      } catch (recalcError) {
        console.warn('⚠️ Quota recalculation failed (non-critical):', recalcError);
        // Continue anyway - we'll still fetch the latest data
      }
      
      // ✅ THEN: Fetch fresh user data with updated quota
      const updatedUserData = await usersService.getUserById(authStore.currentUser.id);
      const updatedUser = apiUserToUser(updatedUserData);
      
      authStore.updateCurrentUser(updatedUser);
      useUsersStore.getState().upsertUsers([updatedUser]);
      
      console.log('✅ Current user data refreshed:', {
        userId: updatedUser.id,
        clientQuota: updatedUser.clientQuota,
        usedClientQuota: updatedUser.usedClientQuota,
        availableClientQuota: updatedUser.availableClientQuota,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh current user data:', error);
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
