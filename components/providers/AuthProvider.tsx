'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { setAuthToken } from '@/services/api';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';
import { logger } from '@/lib/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Read token directly from auth-storage-token cookie
 * This is the same cookie the middleware uses
 */
function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth-storage-token='));
    
    if (!authCookie) return null;
    
    const cookieValue = authCookie.split('=')[1];
    const decoded = decodeURIComponent(cookieValue);
    const data = JSON.parse(decoded);
    
    // Handle different formats
    if (data.token) {
      return data.token;
    }
    if (data.state?.token) {
      return data.state.token;
    }
    
    return null;
  } catch (error) {
    logger.error('Error reading token from cookie:', error);
    return null;
  }
}

/**
 * AuthProvider - Global Authentication Initializer
 *
 * Ensures auth is ready before rendering children:
 * 1. First: Read token directly from cookie (fastest, for axios)
 * 2. Then: Rehydrate Zustand store for full user data
 * 3. Shows loading overlay during initialization
 * 4. Prevents race conditions on page refresh (F5)
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
        
        // STEP 1: Immediately set token from cookie for axios
        // This is the fastest way to restore auth for API calls
        const tokenFromCookie = getTokenFromCookie();
        if (tokenFromCookie) {
          setAuthToken(tokenFromCookie);
          logger.success('Token restored from cookie');
        }
        
        // STEP 2: Rehydrate Zustand store for full user data
        // With skipHydration: true, we MUST manually call rehydrate()
        if (useAuthStore.persist?.rehydrate) {
          await useAuthStore.persist.rehydrate();
          logger.info('Zustand store rehydrated');
        }

        // Small delay to ensure state is fully updated
        await new Promise(resolve => setTimeout(resolve, 30));
        
        // STEP 3: Verify token from store matches (use store token as source of truth)
        const state = useAuthStore.getState();
        if (state.token && state.token !== tokenFromCookie) {
          // Store has different token, use that instead
          setAuthToken(state.token);
          logger.info('Token updated from store');
        } else if (!tokenFromCookie && state.token) {
          // Cookie was empty but store has token
          setAuthToken(state.token);
          logger.info('Token set from store (cookie was empty)');
        }

        setIsRehydrated(true);
        logger.success(`Auth ready: ${state.userEmail || 'no user'}`);
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        setIsRehydrated(true); // Continue anyway to not block the app
      }
    };

    initializeAuth();
  }, []);

  if (!isRehydrated) {
    return (
      <AuthLoadingOverlay
        open={true}
        message="Inicializando..."
      />
    );
  }

  return <>{children}</>;
}
