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
}

export const dolarBlueService = new DolarBlueService();