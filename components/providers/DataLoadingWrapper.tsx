'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';

interface DataLoadingWrapperProps {
  children: ReactNode;
  loadingMessage?: string;
  minLoadingTime?: number; // milliseconds
}

/**
 * Generic wrapper for data loading states
 * Prevents showing "0" values while data is loading
 * Provides consistent loading UX across all dashboard views
 */
export function DataLoadingWrapper({
  children,
  loadingMessage = "Cargando datos...",
  minLoadingTime = 800
}: DataLoadingWrapperProps) {
  const { token } = useAuthStore();
  const { user: currentUser } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be ready and apply minimum loading time
    const timer = setTimeout(() => {
      if (token && currentUser) {
        setIsInitialLoading(false);
      }
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [token, currentUser, minLoadingTime]);

  return (
    <>
      <AuthLoadingOverlay
        open={isInitialLoading}
        message={loadingMessage}
      />
      {children}
    </>
  );
}