import { useCallback } from 'react';
import { dolarBlueService } from '@/services/dolar-blue.service';
import { useDolarBlueStore } from '@/stores/dolar-blue';
import { useAuthStore } from '@/stores/auth';
import type { DolarBlueData } from '@/types/dolar-blue';

export const useDolarBlue = () => {
  const {
    currentRate,
    isLoading,
    error,
    setCurrentRate,
    setLoading,
    setError,
    isCacheValid,
    getDisplayData,
    getTimeUntilRefresh
  } = useDolarBlueStore();

  const { userRole } = useAuthStore();

  const refreshManually = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Role-based refresh: ADMIN can POST + GET, others can only GET
      const response = userRole === 'admin' 
        ? await dolarBlueService.fetchAndUpdate()  // POST + GET for fresh data
        : await dolarBlueService.getLatest();      // GET only for existing data
      
      const dolarData: DolarBlueData = {
        compra: response.compra,
        venta: response.venta,
        fechaActualizacion: new Date(response.fechaActualizacion),
        lastFetched: new Date()
      };

      setCurrentRate(dolarData);
      
      return true;

    } catch (error: any) {
      
      setError(error.message || 'Error al obtener cotización');
      return false;

    } finally {
      setLoading(false);
    }
  }, [userRole]);

  return {
    currentRate,
    isLoading,
    error,
    displayData: getDisplayData(),
    timeUntilRefresh: getTimeUntilRefresh(),
    refresh: refreshManually,
    isCacheValid: isCacheValid()
    // isDataStale removed - should only be used by Provider, not in renders
  };
};