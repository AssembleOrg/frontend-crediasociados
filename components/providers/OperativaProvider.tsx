'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { operativaService } from '@/services/operativa.service';
import { useOperativaStore } from '@/stores/operativa';
import { useAuth } from '@/hooks/useAuth';

interface OperativaProviderProps {
  children: React.ReactNode;
}

interface OperativaProviderContextType {
  refreshData: () => Promise<void>;
  isInitialLoading: boolean;
}

const OperativaProviderContext = createContext<OperativaProviderContextType | null>(null);

export const useOperativaProviderContext = () => {
  const context = useContext(OperativaProviderContext);
  if (!context) {
    throw new Error('useOperativaProviderContext must be used within OperativaProvider');
  }
  return context;
};

export default function OperativaProvider({ children }: OperativaProviderProps) {
  const { setTransacciones } = useOperativaStore();
  const { user } = useAuth();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);
  const hasUserBeenAvailableRef = useRef(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const initOperativaData = async (): Promise<boolean> => {
    if (!user) {
      setIsInitialLoading(false);
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log('🧾 [OPERATIVA PROVIDER] Inicializando datos de Operativa...');

      // Add timeout to prevent blocking (3 seconds for operativa)
      const transaccionesPromise = operativaService.getTransacciones(user.id);
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          console.warn('🧾 [OPERATIVA PROVIDER] Fetch timeout, continuing with empty data');
          resolve(null);
        }, 3000)
      );

      const transacciones = await Promise.race([transaccionesPromise, timeoutPromise]);

      if (abortController.signal.aborted) {
        return false;
      }

      if (transacciones) {
        setTransacciones(transacciones);
        console.log('✅ [OPERATIVA PROVIDER] Operativa data initialized:', transacciones.length, 'transacciones');
      } else {
        console.warn('🧾 [OPERATIVA PROVIDER] Using empty transacciones due to timeout');
        setTransacciones([]);
      }

      return true;
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('🧾 [OPERATIVA PROVIDER] Error initializing operativa data:', err);
      // Graceful degradation: set empty array instead of blocking
      setTransacciones([]);
      return false;
    } finally {
      // ALWAYS set loading to false to prevent blocking
      if (!abortController.signal.aborted) {
        setIsInitialLoading(false);
        console.log('🧾 [OPERATIVA PROVIDER] Loading complete');
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isInitializedRef.current) return;
      if (!user) return;

      isInitializedRef.current = true;
      hasUserBeenAvailableRef.current = true;

      await initOperativaData();
    };

    if (user && !hasUserBeenAvailableRef.current) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refreshData = async (): Promise<void> => {
    await initOperativaData();
  };

  const contextValue: OperativaProviderContextType = {
    refreshData,
    isInitialLoading
  };

  return (
    <OperativaProviderContext.Provider value={contextValue}>
      {/* Removed blocking overlay - operativa loads in background */}
      {/* Dashboard can render while operativa data loads */}
      {children}
    </OperativaProviderContext.Provider>
  );
}
