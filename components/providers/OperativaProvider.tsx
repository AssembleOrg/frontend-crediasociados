'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { operativaService } from '@/services/operativa.service';
import { useOperativaStore } from '@/stores/operativa';
import { useAuth } from '@/hooks/useAuth';
import { AuthLoadingOverlay } from '@/components/ui/AuthLoadingOverlay';

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
      return false;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log('🧾 Inicializando datos de Operativa...');

      const transacciones = await operativaService.getTransacciones(user.id);

      if (abortController.signal.aborted) {
        return false;
      }

      setTransacciones(transacciones);
      console.log('✅ Operativa data initialized:', transacciones.length, 'transacciones');

      return true;
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('Error initializing operativa data:', err);
      return false;
    } finally {
      if (!abortController.signal.aborted) {
        setIsInitialLoading(false);
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
      <AuthLoadingOverlay
        open={isInitialLoading && !!user}
        message="Cargando datos operativos..."
      />
      {children}
    </OperativaProviderContext.Provider>
  );
}
