'use client';

import { useEffect, useRef } from 'react';
import { dolarBlueService } from '@/services/dolar-blue.service';
import { useDolarBlueStore } from '@/stores/dolar-blue';
import { useAuthStore } from '@/stores/auth';
import { DOLAR_BLUE_CONFIG } from '@/types/dolar-blue';
import type { DolarBlueData } from '@/types/dolar-blue';

interface DolarBlueProviderProps {
  children: React.ReactNode;
}

export default function DolarBlueProvider({ children }: DolarBlueProviderProps) {
  const {
    setCurrentRate,
    setLoading,
    setError,
    isCacheValid
  } = useDolarBlueStore();

  const { token } = useAuthStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const hasTokenBeenAvailableRef = useRef(false);

  // Fast initialization - only GET for login
  const initDolarBlue = async (): Promise<boolean> => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);

      const response = await dolarBlueService.initWithoutUpdate(abortController.signal);

      if (abortController.signal.aborted) {
        return false;
      }

      const dolarData: DolarBlueData = {
        compra: response.compra,
        venta: response.venta,
        fechaActualizacion: new Date(response.fechaActualizacion),
        lastFetched: new Date()
      };

      setCurrentRate(dolarData);
      console.log('💰 Dólar Blue initialized (GET only):', { compra: response.compra, venta: response.venta });
      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('Error initializing dolar blue:', error);
      setError((error as Error).message || 'Error al obtener cotización');
      return false;

    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Background update - POST + GET every 2 hours
  const fetchDolarBlue = async (isBackground = false): Promise<boolean> => {
    if (abortControllerRef.current && !isBackground) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!isBackground) {
        setLoading(true);
      }

      const response = await dolarBlueService.fetchAndUpdate(abortController.signal);

      if (abortController.signal.aborted) {
        return false;
      }

      const dolarData: DolarBlueData = {
        compra: response.compra,
        venta: response.venta,
        fechaActualizacion: new Date(response.fechaActualizacion),
        lastFetched: new Date()
      };

      setCurrentRate(dolarData);
      console.log('💰 Dólar Blue updated (POST + GET):', { compra: response.compra, venta: response.venta });
      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      console.error('Error fetching dolar blue:', error);
      setError((error as Error).message || 'Error al obtener cotización');
      return false;

    } finally {
      if (!isBackground && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const scheduleBackgroundRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (!isCacheValid()) {
        fetchDolarBlue(true);
      }
    }, DOLAR_BLUE_CONFIG.REFRESH_INTERVAL_MS);
  };


  useEffect(() => {
    const init = async () => {
      if (isInitializedRef.current) return;
      if (!token) return;

      isInitializedRef.current = true;
      hasTokenBeenAvailableRef.current = true;

      console.log('🪙 Inicializando Dólar Blue globalmente (GET only para login rápido)');

      // Fast login initialization - only GET
      const success = await initDolarBlue();
      if (success) {
        // Schedule background refresh every 2 hours (POST + GET)
        scheduleBackgroundRefresh();
      }
    };

    if (token && !hasTokenBeenAvailableRef.current) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}