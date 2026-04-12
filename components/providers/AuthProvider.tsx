'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { logger } from '@/lib/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Global Authentication Initializer
 *
 * Ensures auth is ready before rendering children:
 * 1. Rehydrate Zustand store for user/session metadata
 * 2. Shows loading overlay during initialization
 * 3. Prevents race conditions on page refresh (F5)
 *
 * This is CRITICAL for preventing 401 errors on F5.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [isRehydrated, setIsRehydrated] = useState(false);
  const rehydrationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double rehydration in StrictMode
    if (rehydrationAttempted.current) return;
    rehydrationAttempted.current = true;

    const initializeAuth = async () => {
      try {
        logger.info('Starting auth initialization...');

        // STEP 1: Rehydrate Zustand store for full user data
        // With skipHydration: true, we MUST manually call rehydrate()
        if (useAuthStore.persist?.rehydrate) {
          await useAuthStore.persist.rehydrate();
          logger.info('Zustand store rehydrated');
        }

        // Small delay to ensure state is fully updated
        await new Promise(resolve => setTimeout(resolve, 30));
        
        // STEP 2: auth store is the source of truth for app-level user state
        const state = useAuthStore.getState();
        setIsRehydrated(true);
        logger.success(`Auth ready: ${state.userEmail || 'no user'}`);
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        setIsRehydrated(true); // Continue anyway to not block the app
      }
    };

    initializeAuth();
  }, []);

  return (
    <>
      <SplashScreen visible={!isRehydrated} />
      {isRehydrated && children}
    </>
  );
}
