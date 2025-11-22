import api from './api';
import type { DolarBlueApiResponse, DolarBlueCurrentRateResponse } from '@/types/dolar-blue';

class DolarBlueService {
  async getLatest(abortSignal?: AbortSignal): Promise<DolarBlueApiResponse> {
    const response = await api.get('/external-api/dolar-blue/latest', {
      signal: abortSignal
    });
    return response.data.data;
  }

  async getCurrentRate(abortSignal?: AbortSignal): Promise<DolarBlueCurrentRateResponse> {
    const response = await api.get('/external-api/dolar-blue/current-rate', {
      signal: abortSignal
    });
    return response.data.data;
  }

  async fetchAndUpdate(abortSignal?: AbortSignal): Promise<DolarBlueApiResponse> {
    try {
      // POST: Force update from external API to database
      
      await api.post('/external-api/dolar-blue/fetch', {}, {
        signal: abortSignal
      });
      
      
      // GET: Retrieve fresh data from database
      const response = await api.get('/external-api/dolar-blue/latest', {
        signal: abortSignal
      });
      
      return response.data.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        
        throw new Error('Usuario no autenticado - inicia sesión nuevamente');
      } else if (error.response?.status === 403) {
        
        
        // For 403, try to get existing data but don't retry POST
        try {
          const fallbackResponse = await api.get('/external-api/dolar-blue/latest', {
            signal: abortSignal
          });
          return fallbackResponse.data.data;
        } catch (fallbackError) {
          throw new Error('Sin permisos para actualizar y datos no disponibles');
        }
      } else {
        // Other errors - try fallback
        
        try {
          const fallbackResponse = await api.get('/external-api/dolar-blue/latest', {
            signal: abortSignal
          });
          return fallbackResponse.data.data;
        } catch (fallbackError) {
          throw error;
        }
      }
    }
  }

  async initWithoutUpdate(abortSignal?: AbortSignal): Promise<DolarBlueApiResponse> {
    // Only GET - for fast login initialization
    const response = await api.get('/external-api/dolar-blue/latest', {
      signal: abortSignal
    });
    return response.data.data;
  }
}

export const dolarBlueService = new DolarBlueService();