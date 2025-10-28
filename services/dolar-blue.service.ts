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
      // DEBUG: Check JWT token before POST
      console.log('🔐 JWT Token check before POST:', {
        defaultHeader: api.defaults.headers.common['Authorization'],
        hasToken: !!api.defaults.headers.common['Authorization']
      });
      
      // POST: Force update from external API to database
      console.log('📤 Executing POST /external-api/dolar-blue/fetch...');
      await api.post('/external-api/dolar-blue/fetch', {}, {
        signal: abortSignal
      });
      console.log('✅ POST /fetch successful!');
      
      // GET: Retrieve fresh data from database
      const response = await api.get('/external-api/dolar-blue/latest', {
        signal: abortSignal
      });
      
      return response.data.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🚫 Authentication failed - user not logged in');
        throw new Error('Usuario no autenticado - inicia sesión nuevamente');
      } else if (error.response?.status === 403) {
        console.warn('⛔ POST /fetch permission denied (403) - user needs ADMIN role');
        console.warn('📊 Falling back to existing data from database...');
        
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
        console.warn('POST /fetch failed with error:', error);
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