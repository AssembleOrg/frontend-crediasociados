import { useCallback } from 'react';
import { dolarBlueService } from '@/services/dolar-blue.service';
import { useDolarBlueStore } from '@/stores/dolar-blue';
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

  const refreshManually = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Manual refresh should force POST + GET for fresh data
      const response = await dolarBlueService.fetchAndUpdate();
      
      const dolarData: DolarBlueData = {
        compra: response.compra,
        venta: response.venta,
        fechaActualizacion: new Date(response.fechaActualizacion),
        lastFetched: new Date()
      };

      setCurrentRate(dolarData);
      console.log('💰 Dólar Blue manual refresh (POST + GET):', { compra: response.compra, venta: response.venta });
      return true;

    } catch (error: any) {
      console.error('Error fetching dolar blue:', error);
      setError(error.message || 'Error al obtener cotización');
      return false;

    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentRate,
    isLoading,
    error,
    displayData: getDisplayData(),
    timeUntilRefresh: getTimeUntilRefresh(),
    refresh: refreshManually,
    isCacheValid: isCacheValid()
  };
};