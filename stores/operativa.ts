/**
 * Operativa Store (Dumb Store Pattern)
 *
 * This store handles the state for the unified transaction system (Operativa).
 * It follows the "dumb store" pattern - only synchronous setters, NO async/await.
 * All business logic and API calls belong in hooks.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  Transaccion,
  IngresoTransaccion,
  EgresoTransaccion,
  TransaccionSummary,
  TransaccionesByTipo,
  TransaccionFilters,
  TransaccionTipo,
  IngresoTipo,
  EgresoTipo
} from '@/types/operativa'

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface OperativaStore {
  // State
  transacciones: Transaccion[]

  // Synchronous setters
  setTransacciones: (transacciones: Transaccion[]) => void
  addTransaccion: (transaccion: Transaccion) => void
  updateTransaccion: (id: string, updates: Partial<Transaccion>) => void
  removeTransaccion: (id: string) => void
  clearTransacciones: () => void

  // Centralized getters (computed values)
  getTransaccionesByTipo: () => TransaccionesByTipo
  getIngresos: () => IngresoTransaccion[]
  getEgresos: () => EgresoTransaccion[]
  getSummary: () => TransaccionSummary
  getFiltered: (filters: TransaccionFilters) => Transaccion[]
  getTotalIngresos: () => number
  getTotalEgresos: () => number
  getBalance: () => number
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useOperativaStore = create<OperativaStore>()(
  immer((set, get) => ({
    // ========================================================================
    // STATE
    // ========================================================================

    transacciones: [],

    // ========================================================================
    // SYNCHRONOUS SETTERS (ONLY!)
    // ========================================================================

    setTransacciones: (transacciones) => {
      set((state) => {
        state.transacciones = transacciones
      })
    },

    addTransaccion: (transaccion) => {
      set((state) => {
        // Add to beginning (most recent first)
        state.transacciones.unshift(transaccion)
      })
    },

    updateTransaccion: (id, updates) => {
      set((state) => {
        const index = state.transacciones.findIndex((t) => t.id === id)
        if (index !== -1) {
          state.transacciones[index] = {
            ...state.transacciones[index],
            ...updates,
            updatedAt: new Date()
          }
        }
      })
    },

    removeTransaccion: (id) => {
      set((state) => {
        state.transacciones = state.transacciones.filter((t) => t.id !== id)
      })
    },

    clearTransacciones: () => {
      set((state) => {
        state.transacciones = []
      })
    },

    // ========================================================================
    // CENTRALIZED GETTERS
    // ========================================================================

    getTransaccionesByTipo: () => {
      const { transacciones } = get()
      return {
        ingresos: transacciones.filter((t) => t.tipo === 'ingreso') as IngresoTransaccion[],
        egresos: transacciones.filter((t) => t.tipo === 'egreso') as EgresoTransaccion[]
      }
    },

    getIngresos: () => {
      const { transacciones } = get()
      return transacciones.filter((t) => t.tipo === 'ingreso') as IngresoTransaccion[]
    },

    getEgresos: () => {
      const { transacciones } = get()
      return transacciones.filter((t) => t.tipo === 'egreso') as EgresoTransaccion[]
    },

    getSummary: () => {
      const { transacciones } = get()

      const ingresos = transacciones.filter((t) => t.tipo === 'ingreso')
      const egresos = transacciones.filter((t) => t.tipo === 'egreso')

      const totalIngresos = ingresos.reduce((sum, t) => sum + t.amount, 0)
      const totalEgresos = egresos.reduce((sum, t) => sum + t.amount, 0)

      return {
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos,
        countIngresos: ingresos.length,
        countEgresos: egresos.length
      }
    },

    getFiltered: (filters) => {
      const { transacciones } = get()

      return transacciones.filter((t) => {
        // Filter by tipo
        if (filters.tipo && t.tipo !== filters.tipo) {
          return false
        }

        // Filter by subTipo
        if (filters.subTipo && t.subTipo !== filters.subTipo) {
          return false
        }

        // Filter by fecha range
        if (filters.fechaDesde) {
          const tDate = new Date(t.fecha)
          const fromDate = new Date(filters.fechaDesde)
          if (tDate < fromDate) {
            return false
          }
        }

        if (filters.fechaHasta) {
          const tDate = new Date(t.fecha)
          const toDate = new Date(filters.fechaHasta)
          if (tDate > toDate) {
            return false
          }
        }

        // Filter by search (descripcion)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          if (!t.descripcion.toLowerCase().includes(searchLower)) {
            return false
          }
        }

        return true
      })
    },

    getTotalIngresos: () => {
      const { transacciones } = get()
      return transacciones
        .filter((t) => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0)
    },

    getTotalEgresos: () => {
      const { transacciones } = get()
      return transacciones
        .filter((t) => t.tipo === 'egreso')
        .reduce((sum, t) => sum + t.amount, 0)
    },

    getBalance: () => {
      const { getTotalIngresos, getTotalEgresos } = get()
      return getTotalIngresos() - getTotalEgresos()
    }
  }))
)
