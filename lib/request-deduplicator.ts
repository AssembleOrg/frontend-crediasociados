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
  // Sube con cada invalidate(key): un request que arrancó antes de la
  // invalidación termina igual para quien lo espera, pero no se cachea.
  private generation: Map<string, number> = new Map()
  
  // Configuración por defecto
  private defaultTTL = 30000 // 30 segundos
  private defaultDebounceMs = 0 // No debounce - execute immediately
  
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

    // 2. Verificar si hay un request en vuelo (o ya programado) con la misma
    // clave: todos los que llaman en la misma ventana comparten la promesa.
    const inFlight = this.inFlight.get(key)
    if (inFlight) {
      this.stats.deduplicatedRequests++
      return inFlight.promise as Promise<T>
    }

    // 3. Crear nuevo request y registrarlo en vuelo YA, antes de que corra el
    // timer. Antes se registraba recién al disparar el fetch, y una segunda
    // llamada en el mismo tick pisaba el timer anterior con clearTimeout: la
    // primera promesa no resolvía ni rechazaba nunca, y el componente que la
    // esperaba quedaba "cargando" para siempre (alta de clientes con 0 clientes).
    const promise = this.executeWithDebounce(key, fetcher, debounce, ttl)
    const entry: InFlightRequest<T> = { promise, timestamp: Date.now() }
    this.inFlight.set(key, entry)
    const settle = () => {
      if (this.inFlight.get(key) === entry) this.inFlight.delete(key)
    }
    promise.then(settle, settle)

    return promise
  }

  private executeWithDebounce<T>(
    key: string,
    fetcher: () => Promise<T>,
    debounce: number,
    ttl: number
  ): Promise<T> {
    const generation = this.generation.get(key) ?? 0

    return new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const data = await fetcher()

          // Guardar en caché solo si nadie invalidó la clave mientras tanto
          if ((this.generation.get(key) ?? 0) === generation) {
            this.cache.set(key, {
              data,
              timestamp: Date.now(),
              expiresAt: Date.now() + ttl
            })
          }

          resolve(data)
        } catch (error) {
          reject(error)
        }
      }, debounce)
    })
  }

  /**
   * Invalida una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    // No se cancela el request en vuelo (quien lo espera tiene que recibir
    // respuesta): solo se saca del mapa para que el próximo pedido vaya al
    // backend, y se marca para que su resultado no quede cacheado.
    this.inFlight.delete(key)
    this.generation.set(key, (this.generation.get(key) ?? 0) + 1)
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keys = new Set([...this.cache.keys(), ...this.inFlight.keys()])

    for (const key of keys) {
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
    for (const key of this.inFlight.keys()) {
      this.generation.set(key, (this.generation.get(key) ?? 0) + 1)
    }
    this.inFlight.clear()
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


