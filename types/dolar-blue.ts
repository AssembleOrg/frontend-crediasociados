export interface DolarBlueApiResponse {
  id: string;
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
  apiUrl: string;
  status: string;
  responseTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface DolarBlueCurrentRateResponse {
  compra: number;
  venta: number;
}

export interface DolarBlueData {
  compra: number;
  venta: number;
  fechaActualizacion: Date;
  lastFetched: Date;
}

export interface DolarBlueDisplayData {
  compra: number;
  venta: number;
  cotizadoHace: string;
  displayText: string;
}

export const DOLAR_BLUE_CONFIG = {
  CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  RETRY_DELAYS: [1000, 2000, 4000, 8000], // Exponential backoff
  MAX_RETRY_DELAY: 30000
} as const;