'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { setAuthToken } from '@/services/api';
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
      // With skipHydration: true, store hydrates on first access in client
      // Wait a tick to ensure client-side only execution
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Access store to trigger hydration (if not already hydrated)
      const currentState = useAuthStore.getState();
      
      // Wait for any async hydration to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Initialize auth token from store
      const finalState = useAuthStore.getState();
      if (finalState.token) {
        setAuthToken(finalState.token);
      }

      setIsRehydrated(true);
      logger.success('Auth rehydrated and ready');
    };

    checkRehydration();
  }, []);

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
