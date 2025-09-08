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
    } catch (error) {
      // If POST fails, try to get existing data as fallback
      console.warn('POST /fetch failed, falling back to existing data:', error);
      const fallbackResponse = await api.get('/external-api/dolar-blue/latest', {
        signal: abortSignal
      });
      return fallbackResponse.data.data;
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