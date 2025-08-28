import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DolarBlueData, DolarBlueDisplayData } from '@/types/dolar-blue';
import { DOLAR_BLUE_CONFIG } from '@/types/dolar-blue';

interface DolarBlueStore {
  currentRate: DolarBlueData | null;
  isLoading: boolean;
  error: string | null;
  
  setCurrentRate: (data: DolarBlueData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  isCacheValid: () => boolean;
  getDisplayData: () => DolarBlueDisplayData | null;
  getTimeUntilRefresh: () => number;
}

function formatLastUpdated(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export const useDolarBlueStore = create<DolarBlueStore>()(
  immer((set, get) => ({
    currentRate: null,
    isLoading: false,
    error: null,

    setCurrentRate: (data: DolarBlueData) =>
      set((state) => {
        state.currentRate = data;
        state.error = null;
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    isCacheValid: () => {
      const { currentRate } = get();
      if (!currentRate) return false;
      
      const now = new Date();
      const cacheAge = now.getTime() - currentRate.lastFetched.getTime();
      return cacheAge < DOLAR_BLUE_CONFIG.CACHE_DURATION_MS;
    },

    getDisplayData: (): DolarBlueDisplayData | null => {
      const { currentRate } = get();
      if (!currentRate) return null;

      const lastUpdated = formatLastUpdated(currentRate.lastFetched);
      const displayText = `Dólar Blue: Compra $${currentRate.compra.toFixed(0)} - Venta $${currentRate.venta.toFixed(0)} - Actualizado: ${lastUpdated}`;

      return {
        compra: currentRate.compra,
        venta: currentRate.venta,
        cotizadoHace: lastUpdated,
        displayText
      };
    },

    getTimeUntilRefresh: () => {
      const { currentRate } = get();
      if (!currentRate) return 0;
      
      const now = new Date();
      const nextRefresh = currentRate.lastFetched.getTime() + DOLAR_BLUE_CONFIG.REFRESH_INTERVAL_MS;
      return Math.max(0, nextRefresh - now.getTime());
    }
  }))
);