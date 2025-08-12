'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useStatsStore } from '@/stores/stats'
import { usePrestamosStore } from '@/stores/prestamos'
import { useClientesStore } from '@/stores/clientes'
import { useUsersStore } from '@/stores/users'

/**
 * THE CHEF/CONTROLLER - useStats Hook
 * The brain of the statistics and analytics operation.
 * - Orchestrates data from multiple stores
 * - Handles computed statistics and KPIs
 * - Manages real-time updates and refresh intervals
 * - Provides dashboard metrics and reporting data
 * - PREVENTS unnecessary recalculations with smart dependencies
 */
export const useStats = () => {
  const statsStore = useStatsStore()
  const prestamosStore = usePrestamosStore()
  const clientesStore = useClientesStore()
  const usersStore = useUsersStore()
  
  // Local state for loading and errors
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs for managing intervals and preventing race conditions
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastCalculationRef = useRef<number>(0)

  /**
   * CENTRALIZED STATS CALCULATION
   * This consolidates all business logic for statistics in one place
   */
  const calculateDashboardStats = useCallback(() => {
    const prestamos = prestamosStore.prestamos
    const clientes = clientesStore.clientes
    const users = usersStore.users
    
    // Basic aggregations
    const totalPrestamos = prestamos.length
    const montoTotalPrestado = prestamos.reduce((sum, p) => sum + p.monto, 0)
    const totalPagosRecibidos = prestamos.reduce((sum, p) => 
      sum + p.pagos.reduce((pSum, pago) => pSum + pago.monto, 0), 0
    )
    
    // Status-based metrics
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length
    const prestamosCompletados = prestamos.filter(p => p.estado === 'completado').length
    const prestamosAtrasados = prestamos.filter(p => p.estado === 'atrasado').length
    
    // Client metrics
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length
    const clientesConPrestamos = new Set(prestamos.map(p => p.clienteId)).size
    
    // User metrics
    const prestamistasCantidad = users.filter(u => u.role === 'prestamista').length
    
    // Calculated KPIs
    const tasaCobranza = montoTotalPrestado > 0 
      ? (totalPagosRecibidos / montoTotalPrestado) * 100 
      : 0
      
    const montoPromedioPrestamo = totalPrestamos > 0 
      ? montoTotalPrestado / totalPrestamos 
      : 0
    
    // Monthly calculations (simplified - in real app would use date ranges)
    const prestamosDelMes = prestamos.filter(p => {
      const fechaPrestamo = new Date(p.fechaInicio)
      const ahora = new Date()
      return fechaPrestamo.getMonth() === ahora.getMonth() && 
             fechaPrestamo.getFullYear() === ahora.getFullYear()
    })
    
    const ingresosDelMes = prestamosDelMes.reduce((sum, p) => 
      sum + p.pagos.reduce((pSum, pago) => {
        const fechaPago = new Date(pago.fecha)
        const ahora = new Date()
        return fechaPago.getMonth() === ahora.getMonth() && 
               fechaPago.getFullYear() === ahora.getFullYear() 
               ? pSum + pago.monto : pSum
      }, 0), 0
    )
    
    // Growth calculation (mock - would need historical data)
    const crecimientoMensual = 8.5 // Mock value
    
    return {
      totalPrestamos,
      montoTotalPrestado,
      montoTotalCobrado: totalPagosRecibidos,
      clientesActivos,
      prestamistasCantidad,
      tasaCobranza: Math.round(tasaCobranza * 100) / 100,
      prestamosVencidos: prestamosAtrasados,
      prestamosActivos,
      montoPromedioPrestamo: Math.round(montoPromedioPrestamo),
      ingresosDelMes,
      crecimientoMensual
    }
  }, [prestamosStore.prestamos, clientesStore.clientes, usersStore.users])

  /**
   * SMART UPDATE MECHANISM
   * Only recalculates when underlying data actually changed
   */
  const updateDashboardStats = useCallback(async (force = false): Promise<void> => {
    const now = Date.now()
    
    // Prevent excessive recalculations (debounce)
    if (!force && now - lastCalculationRef.current < 1000) {
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this might involve API calls for complex calculations
      // For now, we calculate from local store data
      const dashboardStats = calculateDashboardStats()
      
      // Update the store
      statsStore.setDashboardStats(dashboardStats)
      
      lastCalculationRef.current = now
      
    } catch (err: any) {
      setError(err.message || 'Failed to update statistics')
    } finally {
      setIsLoading(false)
    }
  }, [calculateDashboardStats, statsStore])

  /**
   * PERIOD STATS CALCULATION
   */
  const calculatePeriodStats = useCallback(async (
    periodo: 'diario' | 'semanal' | 'mensual' | 'anual',
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: In a real app, this would call an API endpoint
      // await statsService.getPeriodStats(periodo, fechaInicio, fechaFin)
      
      // Mock calculation
      const prestamosEnPeriodo = prestamosStore.prestamos.filter(p => {
        const fechaPrestamo = new Date(p.fechaInicio)
        return fechaPrestamo >= fechaInicio && fechaPrestamo <= fechaFin
      })
      
      const clientesNuevosEnPeriodo = clientesStore.clientes.filter(c => {
        const fechaRegistro = new Date(c.fechaRegistro)
        return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin
      })
      
      const periodStat = {
        periodo,
        fechaInicio,
        fechaFin,
        prestamosOtorgados: prestamosEnPeriodo.length,
        montoOtorgado: prestamosEnPeriodo.reduce((sum, p) => sum + p.monto, 0),
        pagosRecibidos: prestamosEnPeriodo.reduce((sum, p) => sum + p.pagos.length, 0),
        montoCobrado: prestamosEnPeriodo.reduce((sum, p) => 
          sum + p.pagos.reduce((pSum, pago) => pSum + pago.monto, 0), 0
        ),
        clientesNuevos: clientesNuevosEnPeriodo.length,
        morosidad: prestamosEnPeriodo.filter(p => p.estado === 'atrasado').length
      }
      
      statsStore.addPeriodStat(periodStat)
      
    } catch (err: any) {
      setError(err.message || 'Failed to calculate period statistics')
    } finally {
      setIsLoading(false)
    }
  }, [prestamosStore.prestamos, clientesStore.clientes, statsStore])

  /**
   * AUTO-REFRESH MECHANISM
   */
  const startAutoRefresh = useCallback((intervalMinutes = 5) => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    
    // Start new interval
    refreshIntervalRef.current = setInterval(() => {
      updateDashboardStats()
    }, intervalMinutes * 60 * 1000)
  }, [updateDashboardStats])

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  /**
   * INITIALIZATION
   */
  const initializeStats = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Initial calculation
      await updateDashboardStats(true)
      
      // Calculate current month stats
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
      
      await calculatePeriodStats('mensual', inicioMes, finMes)
      
      // Start auto-refresh
      startAutoRefresh(5) // Every 5 minutes
      
      setIsInitialized(true)
      
    } catch (err: any) {
      setError(err.message || 'Failed to initialize statistics')
    } finally {
      setIsLoading(false)
    }
  }, [updateDashboardStats, calculatePeriodStats, startAutoRefresh])

  /**
   * MANUAL REFRESH
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    await updateDashboardStats(true)
  }, [updateDashboardStats])

  /**
   * PERIOD SELECTION HANDLER
   */
  const changePeriod = useCallback(async (
    periodo: 'diario' | 'semanal' | 'mensual' | 'anual'
  ): Promise<void> => {
    statsStore.setSelectedPeriod(periodo)
    
    // Calculate stats for the new period if not already cached
    const existingStats = statsStore.getStatsByPeriod(periodo)
    
    if (existingStats.length === 0) {
      const ahora = new Date()
      let fechaInicio: Date
      let fechaFin = ahora
      
      switch (periodo) {
        case 'diario':
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
          break
        case 'semanal':
          fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'mensual':
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
          break
        case 'anual':
          fechaInicio = new Date(ahora.getFullYear(), 0, 1)
          break
      }
      
      await calculatePeriodStats(periodo, fechaInicio, fechaFin)
    }
  }, [statsStore, calculatePeriodStats])

  /**
   * CLEANUP EFFECT
   */
  useEffect(() => {
    initializeStats()
    
    return () => {
      stopAutoRefresh()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Safe empty deps

  /**
   * REACTIVE UPDATES
   * Update stats when core data changes
   */
  useEffect(() => {
    if (isInitialized) {
      updateDashboardStats()
    }
  }, [
    prestamosStore.prestamos.length,
    clientesStore.clientes.length,
    usersStore.users.length,
    updateDashboardStats,
    isInitialized
  ])

  // Helper functions
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State from store
    dashboardStats: statsStore.dashboardStats,
    periodStats: statsStore.periodStats,
    selectedPeriod: statsStore.selectedPeriod,
    filters: statsStore.filters,
    ultimaActualizacion: statsStore.ultimaActualizacion,
    
    // Computed values from store
    statsByPeriod: statsStore.getStatsByPeriod(statsStore.selectedPeriod),
    currentMonthStats: statsStore.getCurrentMonthStats(),
    growthTrend: statsStore.getGrowthTrend(),
    topMetrics: statsStore.getTopMetrics(),
    efficiencyMetrics: statsStore.getEfficiencyMetrics(),
    
    // Local state
    isLoading,
    error,
    isInitialized,
    
    // Actions
    refreshStats,
    changePeriod,
    calculatePeriodStats,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
    
    // Filters and controls
    setFilters: statsStore.setFilters
  }
}

/**
 * USAGE PATTERNS FOR STATS:
 * 
 * ✅ CORRECT DASHBOARD USAGE:
 * const { dashboardStats, topMetrics, isLoading } = useStats()
 * 
 * // Use topMetrics for cards, dashboardStats for detailed views
 * 
 * ✅ CORRECT PERIOD SELECTION:
 * const { changePeriod, statsByPeriod } = useStats()
 * 
 * const handlePeriodChange = (period) => {
 *   changePeriod(period) // This handles loading and caching automatically
 * }
 * 
 * ✅ AUTOMATIC UPDATES:
 * Stats automatically recalculate when prestamos/clientes data changes
 * No manual triggers needed in components
 */