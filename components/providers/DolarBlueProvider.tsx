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
    setError
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
      
      // DEBUG: Log full API response
      

      if (abortController.signal.aborted) {
        return false;
      }

      if (!response || !response.compra || !response.venta || !response.fechaActualizacion) {
        return false;
      }

      const dolarData: DolarBlueData = {
        compra: response.compra,
        venta: response.venta,
        fechaActualizacion: new Date(response.fechaActualizacion),
        lastFetched: new Date()
      };

      setCurrentRate(dolarData);
      
      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      
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
      return true;

    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return false;
      }

      
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
      // Fix: Get fresh store state each time instead of captured closure
      const store = useDolarBlueStore.getState();
      const isValid = store.isCacheValid();
      const isStale = store.isDataStale();
      
      
      
      // Force refresh if cache expired OR if API data is stale
      if (!isValid || isStale) {
        // Only ADMIN users can perform background POST refresh
        const authState = useAuthStore.getState();

        if (authState.userRole === 'admin') {
          fetchDolarBlue(true);
        } else {
          
        }
      }
    }, DOLAR_BLUE_CONFIG.REFRESH_INTERVAL_MS);
  };


  useEffect(() => {
    const init = async () => {
      if (isInitializedRef.current) return;
      if (!token) {
        
        return;
      }

      isInitializedRef.current = true;
      hasTokenBeenAvailableRef.current = true;

      

      // Fast login initialization - only GET first
      const initSuccess = await initDolarBlue();
      
      if (initSuccess) {
        // Check if data is stale (older than 4 hours) - Fix: use fresh store state
        const store = useDolarBlueStore.getState();
        if (store.isDataStale()) {
          // Only ADMIN users can perform POST to update external API data
          const authState = useAuthStore.getState();
          if (authState.userRole === 'admin') {
            await fetchDolarBlue(false);
          } else {
            
          }
        }
        
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