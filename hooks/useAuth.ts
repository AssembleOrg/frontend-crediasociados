'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth.service';
import { setAuthToken } from '@/services/api';
import { apiUserToUser } from '@/types/transforms';
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
        const response = await authService.login(credentials);

        if (!response.user) {
          throw new Error(
            'Backend returned invalid response: user data is missing'
          );
        }

        const user = apiUserToUser(response.user);

        authStore.setUser(user);
        authStore.setTokens(response.token, response.refreshToken);
        authStore.setAuthentication(true);

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
      authStore.clearAuth();
      authService.clearAuth();
      setIsLoading(false);

      router.replace('/login');
    }
  }, [authStore, router]);

  const navigateToDashboard = useCallback(() => {
    const dashboardRoute = authStore.getDashboardRoute();
    router.push(dashboardRoute);
  }, [authStore, router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,

    isLoading,
    error,

    login,
    logout,
    refreshToken,
    navigateToDashboard,
    clearError,
  };
};
