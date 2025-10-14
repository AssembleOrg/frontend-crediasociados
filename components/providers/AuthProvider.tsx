'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { setAuthToken, setRefreshToken, initializeTokensFromCookie } from '@/services/api';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';
import { logger } from '@/lib/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Global Authentication Initializer
 *
 * Ensures auth is ready before rendering children:
 * 1. Waits for Zustand to rehydrate from cookies
 * 2. Initializes tokens in axios before any requests
 * 3. Shows loading overlay during initialization
 * 4. Prevents race conditions on page refresh (F5)
 *
 * This is CRITICAL for preventing 401 errors on F5.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const authStore = useAuthStore();
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    const checkRehydration = async () => {
      initializeTokensFromCookie();

      if (authStore.token) {
        setAuthToken(authStore.token);
      }

      if (authStore.refreshToken) {
        setRefreshToken(authStore.refreshToken);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      setIsRehydrated(true);
      logger.success('Auth rehydrated and ready');
    };

    checkRehydration();
  }, [authStore.token, authStore.refreshToken]);

  if (!isRehydrated) {
    return (
      <AuthLoadingOverlay
        open={true}
        message="Inicializando autenticación..."
      />
    );
  }

  return <>{children}</>;
}
