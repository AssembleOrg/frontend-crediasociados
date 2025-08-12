import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Prestamo, Pago } from '@/types/prestamo'

/**
 * THE WAREHOUSE - Prestamos Store
 * "Dumb" store that only holds data and has simple, synchronous actions.
 * NEVER calls services or has async logic - that's the Controller Hook's job.
 */
interface PrestamosState {
  prestamos: Prestamo[]
  prestamoSeleccionado: Prestamo | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    page: number
    limit: number
    estado?: 'activo' | 'completado' | 'atrasado'
    clienteId?: string
    fechaDesde?: Date
    fechaHasta?: Date
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
}

interface PrestamosStore extends PrestamosState {
  // Simple synchronous setters only - NO async logic here
  setPrestamos: (prestamos: Prestamo[]) => void
  addPrestamo: (prestamo: Prestamo) => void
  updatePrestamo: (id: string, datos: Partial<Prestamo>) => void
  removePrestamo: (id: string) => void
  setPrestamoSeleccionado: (prestamo: Prestamo | null) => void
  addPago: (prestamoId: string, pago: Pago) => void
  removePago: (prestamoId: string, pagoId: string) => void
  setPagination: (pagination: PrestamosState['pagination']) => void
  setFilters: (filters: Partial<PrestamosState['filters']>) => void
  clearPrestamos: () => void
  
  // Centralized calculations - single source of truth
  calcularMontosCredito: (monto: number, interes: number, cuotas: number, tipoInteres: 'diario' | 'mensual') => { montoTotal: number, valorCuota: number }
  getPrestamosActivos: () => Prestamo[]
  getPrestamosAtrasados: () => Prestamo[]
  getPrestamosCompletados: () => Prestamo[]
  getPrestamosRecientes: () => Prestamo[]
  getTotalMontosPrestados: () => number
  getTotalMontosPendientes: () => number
  getTotalPagosRecibidos: () => number
  getPrestamosByCliente: (clienteId: string) => Prestamo[]
  getProximosVencimientos: () => Prestamo[]
}

export const usePrestamosStore = create<PrestamosStore>()(
  immer((set, get) => ({
    // Initial state
    prestamos: [],
    prestamoSeleccionado: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    filters: {
      page: 1,
      limit: 10
    },

    // Simple synchronous actions only
    setPrestamos: (prestamos: Prestamo[]) => {
      set((state) => {
        state.prestamos = prestamos
      })
    },

    addPrestamo: (prestamo: Prestamo) => {
      set((state) => {
        state.prestamos.push(prestamo)
      })
    },

    updatePrestamo: (id: string, datos: Partial<Prestamo>) => {
      set((state) => {
        const index = state.prestamos.findIndex(p => p.id === id)
        if (index !== -1) {
          state.prestamos[index] = { ...state.prestamos[index], ...datos }
        }
        
        // Update selected if it's the same prestamo
        if (state.prestamoSeleccionado?.id === id) {
          state.prestamoSeleccionado = { ...state.prestamoSeleccionado, ...datos }
        }
      })
    },

    removePrestamo: (id: string) => {
      set((state) => {
        state.prestamos = state.prestamos.filter(p => p.id !== id)
        
        // Clear selection if it's the removed prestamo
        if (state.prestamoSeleccionado?.id === id) {
          state.prestamoSeleccionado = null
        }
      })
    },

    setPrestamoSeleccionado: (prestamo: Prestamo | null) => {
      set((state) => {
        state.prestamoSeleccionado = prestamo
      })
    },

    addPago: (prestamoId: string, pago: Pago) => {
      set((state) => {
        const prestamo = state.prestamos.find(p => p.id === prestamoId)
        if (prestamo) {
          prestamo.pagos.push(pago)
        }
        
        // Update selected if it's the same prestamo
        if (state.prestamoSeleccionado?.id === prestamoId) {
          state.prestamoSeleccionado.pagos.push(pago)
        }
      })
    },

    removePago: (prestamoId: string, pagoId: string) => {
      set((state) => {
        const prestamo = state.prestamos.find(p => p.id === prestamoId)
        if (prestamo) {
          prestamo.pagos = prestamo.pagos.filter(p => p.id !== pagoId)
        }
        
        // Update selected if it's the same prestamo
        if (state.prestamoSeleccionado?.id === prestamoId) {
          state.prestamoSeleccionado.pagos = state.prestamoSeleccionado.pagos.filter(p => p.id !== pagoId)
        }
      })
    },

    setPagination: (pagination: PrestamosState['pagination']) => {
      set((state) => {
        state.pagination = pagination
      })
    },

    setFilters: (filters: Partial<PrestamosState['filters']>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
      })
    },

    clearPrestamos: () => {
      set((state) => {
        state.prestamos = []
        state.prestamoSeleccionado = null
        state.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
        state.filters = {
          page: 1,
          limit: 10
        }
      })
    },

    // Centralized calculations - single source of truth
    calcularMontosCredito: (monto: number, interes: number, cuotas: number, tipoInteres: 'diario' | 'mensual') => {
      let montoTotal: number
      
      if (tipoInteres === 'diario') {
        // Interés simple diario
        const dias = cuotas // Asumiendo cuotas diarias
        montoTotal = monto * (1 + (interes / 100) * dias)
      } else {
        // Interés mensual
        montoTotal = monto * (1 + (interes / 100))
      }
      
      const valorCuota = montoTotal / cuotas
      
      return { montoTotal, valorCuota }
    },

    getPrestamosActivos: () => {
      return get().prestamos.filter(prestamo => prestamo.estado === 'activo')
    },

    getPrestamosAtrasados: () => {
      return get().prestamos.filter(prestamo => prestamo.estado === 'atrasado')
    },

    getPrestamosCompletados: () => {
      return get().prestamos.filter(prestamo => prestamo.estado === 'completado')
    },

    getPrestamosRecientes: () => {
      const ahora = new Date()
      const hace30Dias = new Date(ahora.getTime() - (30 * 24 * 60 * 60 * 1000))
      
      return get().prestamos
        .filter(prestamo => new Date(prestamo.fechaInicio) >= hace30Dias)
        .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
    },

    getTotalMontosPrestados: () => {
      return get().prestamos.reduce((total, prestamo) => total + prestamo.monto, 0)
    },

    getTotalMontosPendientes: () => {
      return get().prestamos
        .filter(prestamo => prestamo.estado === 'activo' || prestamo.estado === 'atrasado')
        .reduce((total, prestamo) => {
          const totalPagado = prestamo.pagos.reduce((sum, pago) => sum + pago.monto, 0)
          return total + (prestamo.montoTotal - totalPagado)
        }, 0)
    },

    getTotalPagosRecibidos: () => {
      return get().prestamos.reduce((total, prestamo) => 
        total + prestamo.pagos.reduce((sum, pago) => sum + pago.monto, 0), 0
      )
    },

    getPrestamosByCliente: (clienteId: string) => {
      return get().prestamos.filter(prestamo => prestamo.clienteId === clienteId)
    },

    getProximosVencimientos: () => {
      const ahora = new Date()
      const proximos7Dias = new Date(ahora.getTime() + (7 * 24 * 60 * 60 * 1000))
      
      return get().prestamos
        .filter(prestamo => {
          if (prestamo.estado !== 'activo') return false
          
          // Calcular próximo vencimiento basado en pagos realizados
          const totalPagado = prestamo.pagos.reduce((sum, pago) => sum + pago.monto, 0)
          const cuotasPagadas = Math.floor(totalPagado / prestamo.valorCuota)
          
          if (cuotasPagadas >= prestamo.cuotas) return false
          
          // Calcular fecha del próximo vencimiento
          const fechaInicio = new Date(prestamo.fechaInicio)
          let proximoVencimiento: Date
          
          if (prestamo.tipoInteres === 'diario') {
            proximoVencimiento = new Date(fechaInicio.getTime() + (cuotasPagadas + 1) * 24 * 60 * 60 * 1000)
          } else {
            proximoVencimiento = new Date(fechaInicio)
            proximoVencimiento.setMonth(proximoVencimiento.getMonth() + cuotasPagadas + 1)
          }
          
          return proximoVencimiento <= proximos7Dias
        })
        .sort((a, b) => {
          // Ordenar por fecha de vencimiento más próxima
          const fechaA = new Date(a.fechaInicio)
          const fechaB = new Date(b.fechaInicio)
          return fechaA.getTime() - fechaB.getTime()
        })
    }
  }))
)