import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Cliente } from '@/types/prestamo'

/**
 * THE WAREHOUSE - Clientes Store
 * "Dumb" store that only holds data and has simple, synchronous actions.
 * NEVER calls services or has async logic - that's the Controller Hook's job.
 */
interface ClientesState {
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
}

interface ClientesStore extends ClientesState {
  // Simple synchronous setters only - NO async logic here
  setClientes: (clientes: Cliente[]) => void
  addCliente: (cliente: Cliente) => void
  updateCliente: (id: string, datos: Partial<Cliente>) => void
  removeCliente: (id: string) => void
  setClienteSeleccionado: (cliente: Cliente | null) => void
  setPagination: (pagination: ClientesState['pagination']) => void
  setFilters: (filters: Partial<ClientesState['filters']>) => void
  clearClientes: () => void
  
  // Centralized calculations - single source of truth
  getClientesByFilter: () => Cliente[]
  getTotalClientes: () => number
  getClientesActivos: () => Cliente[]
}

export const useClientesStore = create<ClientesStore>()(
  immer((set, get) => ({
    // Initial state
    clientes: [],
    clienteSeleccionado: null,
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
    setClientes: (clientes: Cliente[]) => {
      set((state) => {
        state.clientes = clientes
      })
    },

    addCliente: (cliente: Cliente) => {
      set((state) => {
        state.clientes.push(cliente)
      })
    },

    updateCliente: (id: string, datos: Partial<Cliente>) => {
      set((state) => {
        const index = state.clientes.findIndex(c => c.id === id)
        if (index !== -1) {
          state.clientes[index] = { ...state.clientes[index], ...datos }
        }
        
        // Update selected if it's the same client
        if (state.clienteSeleccionado?.id === id) {
          state.clienteSeleccionado = { ...state.clienteSeleccionado, ...datos }
        }
      })
    },

    removeCliente: (id: string) => {
      set((state) => {
        state.clientes = state.clientes.filter(c => c.id !== id)
        
        // Clear selection if it's the removed client
        if (state.clienteSeleccionado?.id === id) {
          state.clienteSeleccionado = null
        }
      })
    },

    setClienteSeleccionado: (cliente: Cliente | null) => {
      set((state) => {
        state.clienteSeleccionado = cliente
      })
    },

    setPagination: (pagination: ClientesState['pagination']) => {
      set((state) => {
        state.pagination = pagination
      })
    },

    setFilters: (filters: Partial<ClientesState['filters']>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
      })
    },

    clearClientes: () => {
      set((state) => {
        state.clientes = []
        state.clienteSeleccionado = null
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
    getClientesByFilter: () => {
      const { clientes, filters } = get()
      
      let filtered = [...clientes]
      
      // Apply search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(cliente => 
          cliente.nombre.toLowerCase().includes(search) ||
          cliente.apellido.toLowerCase().includes(search) ||
          cliente.email?.toLowerCase().includes(search) ||
          cliente.telefono?.includes(search)
        )
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filtered.sort((a, b) => {
          const aVal = a[filters.sortBy as keyof Cliente]
          const bVal = b[filters.sortBy as keyof Cliente]
          
          if (filters.sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1
          }
          return aVal > bVal ? 1 : -1
        })
      }
      
      return filtered
    },

    getTotalClientes: () => {
      return get().clientes.length
    },

    getClientesActivos: () => {
      return get().clientes.filter(cliente => cliente.estado === 'activo')
    }
  }))
)