'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrestamosStore } from '@/stores/prestamos'
import { useStatsStore } from '@/stores/stats'
import type { Prestamo, Pago } from '@/types/prestamo'

/**
 * THE CHEF/CONTROLLER - usePrestamos Hook
 * The brain of the loans management operation.
 * - Calls the Service (when available)
 * - Handles loading and error states  
 * - Orchestrates business logic between stores
 * - Gives simple orders to Stores to update data
 * - Returns everything the UI needs
 * - PREVENTS race conditions with proper patterns
 */
export const usePrestamos = () => {
  const prestamosStore = usePrestamosStore()
  const statsStore = useStatsStore()
  
  // Local state for loading and errors - NOT in the store
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs to prevent race conditions
  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * SAFE INITIALIZATION PATTERN
   */
  const initializePrestamos = useCallback(async (): Promise<void> => {
    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // TODO: Replace with actual API service calls
      // const response = await prestamosService.getPrestamos({ 
      //   ...prestamosStore.filters 
      // }, { signal: abortControllerRef.current.signal })
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const mockPrestamos: Prestamo[] = [
        {
          id: '1',
          clienteId: '1',
          monto: 100000,
          interes: 10,
          cuotas: 12,
          tipoInteres: 'mensual',
          montoTotal: 110000,
          valorCuota: 9166.67,
          fechaInicio: new Date('2024-01-01'),
          fechaVencimiento: new Date('2024-12-31'),
          estado: 'activo',
          garantias: ['Recibo de sueldo'],
          observaciones: 'Cliente con buen historial crediticio',
          pagos: [
            {
              id: 'pago-1',
              monto: 9166.67,
              fecha: new Date('2024-01-31'),
              metodoPago: 'efectivo',
              comprobante: 'REC-001'
            },
            {
              id: 'pago-2', 
              monto: 9166.67,
              fecha: new Date('2024-02-28'),
              metodoPago: 'transferencia',
              comprobante: 'TRF-002'
            }
          ]
        },
        {
          id: '2',
          clienteId: '2',
          monto: 50000,
          interes: 15,
          cuotas: 6,
          tipoInteres: 'mensual',
          montoTotal: 57500,
          valorCuota: 9583.33,
          fechaInicio: new Date('2024-02-01'),
          fechaVencimiento: new Date('2024-07-31'),
          estado: 'activo',
          garantias: ['Fiador'],
          observaciones: 'Préstamo personal',
          pagos: [
            {
              id: 'pago-3',
              monto: 9583.33,
              fecha: new Date('2024-02-29'),
              metodoPago: 'efectivo',
              comprobante: 'REC-003'
            }
          ]
        }
      ]

      // Update store with simple actions
      prestamosStore.setPrestamos(mockPrestamos)
      
      // Update pagination
      prestamosStore.setPagination({
        page: 1,
        limit: 10,
        total: mockPrestamos.length,
        totalPages: 1
      })
      
      // Calculate and update stats
      await updateStats(mockPrestamos)
      
      setIsInitialized(true)

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load prestamos')
      }
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore, statsStore])

  /**
   * BUSINESS LOGIC: Update stats when prestamos change
   */
  const updateStats = useCallback(async (prestamos?: Prestamo[]): Promise<void> => {
    const currentPrestamos = prestamos || prestamosStore.prestamos
    
    // Calculate dashboard stats
    const totalPrestamos = currentPrestamos.length
    const montoTotalPrestado = currentPrestamos.reduce((sum, p) => sum + p.monto, 0)
    const totalPagos = currentPrestamos.reduce((sum, p) => 
      sum + p.pagos.reduce((pSum, pago) => pSum + pago.monto, 0), 0
    )
    const prestamosActivos = currentPrestamos.filter(p => p.estado === 'activo').length
    const prestamosAtrasados = currentPrestamos.filter(p => p.estado === 'atrasado').length
    
    const tasaCobranza = montoTotalPrestado > 0 
      ? (totalPagos / montoTotalPrestado) * 100 
      : 0
    
    const dashboardStats = {
      totalPrestamos,
      montoTotalPrestado,
      montoTotalCobrado: totalPagos,
      clientesActivos: new Set(currentPrestamos.map(p => p.clienteId)).size,
      prestamistasCantidad: 1, // Mock value
      tasaCobranza: Math.round(tasaCobranza * 100) / 100,
      prestamosVencidos: prestamosAtrasados,
      prestamosActivos,
      montoPromedioPrestamo: totalPrestamos > 0 ? montoTotalPrestado / totalPrestamos : 0,
      ingresosDelMes: totalPagos, // Simplified
      crecimientoMensual: 5.2 // Mock value
    }
    
    // Update stats store
    statsStore.setDashboardStats(dashboardStats)
  }, [prestamosStore.prestamos, statsStore])

  const fetchPrestamos = useCallback(async (params?: {
    page?: number
    limit?: number
    estado?: 'activo' | 'completado' | 'atrasado'
    clienteId?: string
    search?: string
  }): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const filters = { ...prestamosStore.filters, ...params }
      
      // TODO: Replace with actual API service call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Mock filtered results
      let filteredPrestamos = prestamosStore.prestamos
      if (filters.estado) {
        filteredPrestamos = filteredPrestamos.filter(p => p.estado === filters.estado)
      }
      if (filters.clienteId) {
        filteredPrestamos = filteredPrestamos.filter(p => p.clienteId === filters.clienteId)
      }
      
      prestamosStore.setPrestamos(filteredPrestamos)
      prestamosStore.setFilters(filters)
      
      // Update stats after filtering
      await updateStats(filteredPrestamos)
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch prestamos')
      }
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore, updateStats])

  const createPrestamo = useCallback(async (
    prestamoData: Omit<Prestamo, 'id' | 'montoTotal' | 'valorCuota' | 'estado' | 'pagos'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // BUSINESS LOGIC: Calculate loan amounts using store method
      const { montoTotal, valorCuota } = prestamosStore.calcularMontosCredito(
        prestamoData.monto,
        prestamoData.interes,
        prestamoData.cuotas,
        prestamoData.tipoInteres
      )

      const newPrestamo: Prestamo = {
        id: `prestamo-${Date.now()}`,
        ...prestamoData,
        montoTotal,
        valorCuota,
        estado: 'activo',
        pagos: []
      }

      // TODO: Replace with actual API service call
      // const createdPrestamo = await prestamosService.createPrestamo(newPrestamo)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Update store
      prestamosStore.addPrestamo(newPrestamo)
      
      // Update stats
      await updateStats()
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to create prestamo')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore, updateStats])

  const registrarPago = useCallback(async (
    prestamoId: string,
    pagoData: Omit<Pago, 'id'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const nuevoPago: Pago = {
        id: `pago-${Date.now()}`,
        ...pagoData
      }

      // TODO: Replace with actual API service call
      // await pagosService.createPago(prestamoId, nuevoPago)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Update store
      prestamosStore.addPago(prestamoId, nuevoPago)
      
      // BUSINESS LOGIC: Check if loan is now completed
      const prestamo = prestamosStore.prestamos.find(p => p.id === prestamoId)
      if (prestamo) {
        const totalPagado = prestamo.pagos.reduce((sum, pago) => sum + pago.monto, 0) + pagoData.monto
        
        if (totalPagado >= prestamo.montoTotal) {
          prestamosStore.updatePrestamo(prestamoId, { estado: 'completado' })
        }
      }
      
      // Update stats after payment
      await updateStats()
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to register payment')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore, updateStats])

  const updatePrestamo = useCallback(async (
    id: string,
    prestamoData: Partial<Prestamo>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API service call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      prestamosStore.updatePrestamo(id, prestamoData)
      await updateStats()
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to update prestamo')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore, updateStats])

  /**
   * SAFE INITIALIZATION EFFECT
   */
  useEffect(() => {
    initializePrestamos()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Safe empty deps

  // Helper functions
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSelectedPrestamo = useCallback(() => {
    prestamosStore.setPrestamoSeleccionado(null)
  }, [prestamosStore])

  const refreshPrestamos = useCallback(() => {
    return fetchPrestamos(prestamosStore.filters)
  }, [fetchPrestamos, prestamosStore.filters])

  return {
    // State from store (single source of truth)
    prestamos: prestamosStore.prestamos,
    prestamoSeleccionado: prestamosStore.prestamoSeleccionado,
    pagination: prestamosStore.pagination,
    filters: prestamosStore.filters,
    
    // Computed values from store (centralized calculations)
    prestamosActivos: prestamosStore.getPrestamosActivos(),
    prestamosAtrasados: prestamosStore.getPrestamosAtrasados(),
    prestamosCompletados: prestamosStore.getPrestamosCompletados(),
    prestamosRecientes: prestamosStore.getPrestamosRecientes(),
    totalMontosPrestados: prestamosStore.getTotalMontosPrestados(),
    totalMontosPendientes: prestamosStore.getTotalMontosPendientes(),
    totalPagosRecibidos: prestamosStore.getTotalPagosRecibidos(),
    proximosVencimientos: prestamosStore.getProximosVencimientos(),
    
    // Calculator function from store
    calcularMontosCredito: prestamosStore.calcularMontosCredito,
    
    // Local state (not persisted)
    isLoading,
    error,
    isInitialized,
    
    // Actions
    fetchPrestamos,
    createPrestamo,
    updatePrestamo,
    registrarPago,
    clearSelectedPrestamo,
    clearError,
    refreshPrestamos,
    
    // Business logic helpers
    getPrestamosByCliente: prestamosStore.getPrestamosByCliente
  }
}

/**
 * BUSINESS LOGIC PATTERNS DEMONSTRATED:
 * 
 * 1. ✅ Calculations centralized in stores (single source of truth)
 * 2. ✅ Cross-store orchestration (prestamos update stats)  
 * 3. ✅ Complex business rules (auto-complete loans, calculate amounts)
 * 4. ✅ Proper error handling and loading states
 * 5. ✅ Safe initialization patterns
 * 6. ✅ Request cancellation to prevent race conditions
 */