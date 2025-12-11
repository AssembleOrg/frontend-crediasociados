/**
 * REQUEST DEDUPLICATOR
 * 
 * Previene llamadas duplicadas al backend:
 * 1. ✅ Deduplica requests en vuelo (misma URL = 1 request)
 * 2. ✅ Caché con TTL configurable
 * 3. ✅ Debouncing para llamadas rápidas
 * 4. ✅ Tracking de requests activos
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface InFlightRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicator {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private inFlight: Map<string, InFlightRequest<unknown>> = new Map()
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  
  // Configuración por defecto
  private defaultTTL = 30000 // 30 segundos
  private defaultDebounceMs = 100 // 100ms debounce
  
  // Stats para debugging
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    deduplicatedRequests: 0,
    totalRequests: 0
  }

  /**
   * Ejecuta un request con deduplicación y caché
   */
  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number
      debounce?: number
      forceRefresh?: boolean
    } = {}
  ): Promise<T> {
    const { 
      ttl = this.defaultTTL, 
      debounce = this.defaultDebounceMs,
      forceRefresh = false 
    } = options

    this.stats.totalRequests++

    // 1. Verificar caché (si no es forceRefresh)
    if (!forceRefresh) {
      const cached = this.cache.get(key)
      if (cached && Date.now() < cached.expiresAt) {
        this.stats.cacheHits++
        return cached.data as T
      }
    }

    this.stats.cacheMisses++

    // 2. Verificar si hay un request en vuelo
    const inFlight = this.inFlight.get(key)
    if (inFlight) {
      this.stats.deduplicatedRequests++
      return inFlight.promise as Promise<T>
    }

    // 3. Crear nuevo request
    const promise = this.executeWithDebounce(key, fetcher, debounce, ttl)
    
    return promise
  }

  private async executeWithDebounce<T>(
    key: string,
    fetcher: () => Promise<T>,
    debounce: number,
    ttl: number
  ): Promise<T> {
    // Limpiar timer anterior si existe
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key)
        
        try {
          // Marcar como en vuelo
          const fetchPromise = fetcher()
          this.inFlight.set(key, {
            promise: fetchPromise,
            timestamp: Date.now()
          })

          const data = await fetchPromise

          // Guardar en caché
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl
          })

          resolve(data)
        } catch (error) {
          reject(error)
        } finally {
          // Remover de en vuelo
          this.inFlight.delete(key)
        }
      }, debounce)

      this.debounceTimers.set(key, timer)
    })
  }

  /**
   * Invalida una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.inFlight.delete(key)
    const timer = this.debounceTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(key)
    }
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key)
      }
    }
  }

  /**
   * Limpia todo el caché
   */
  clearAll(): void {
    this.cache.clear()
    this.inFlight.clear()
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
  }

  /**
   * Obtiene estadísticas para debugging
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      inFlightCount: this.inFlight.size,
      hitRate: this.stats.totalRequests > 0 
        ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  /**
   * Limpia entradas expiradas del caché
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Configurar TTL por defecto
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  /**
   * Configurar debounce por defecto
   */
  setDefaultDebounce(ms: number): void {
    this.defaultDebounceMs = ms
  }
}

// Singleton global
export const requestDeduplicator = new RequestDeduplicator()

// Limpiar caché periódicamente (cada 5 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup()
  }, 5 * 60 * 1000)
}

// Hook helper para React
import { useCallback, useRef } from 'react'

export function useDedupedFetch() {
  const fetchingRef = useRef<Set<string>>(new Set())

  const dedupedFetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T | null> => {
    // Prevenir llamadas duplicadas dentro del mismo componente
    if (fetchingRef.current.has(key)) {
      return null
    }

    fetchingRef.current.add(key)
    
    try {
      return await requestDeduplicator.dedupe(key, fetcher, options)
    } finally {
      fetchingRef.current.delete(key)
    }
  }, [])

  const invalidate = useCallback((key: string) => {
    requestDeduplicator.invalidate(key)
  }, [])

  const invalidatePattern = useCallback((pattern: string | RegExp) => {
    requestDeduplicator.invalidatePattern(pattern)
  }, [])

  return { dedupedFetch, invalidate, invalidatePattern }
}

export default requestDeduplicator


