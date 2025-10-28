import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Client, PaginationParams, SearchParams } from '@/types/auth'

/**
 * THE WAREHOUSE - Clients Store
 * "Dumb" store that only holds data and has simple, synchronous actions.
 * NEVER calls services or has async logic - that's the Controller Hook's job.
 */
interface ClientsState {
  clients: Client[]
  selectedClient: Client | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: SearchParams
}

interface ClientsStore extends ClientsState {
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (client: Client) => void
  removeClient: (id: string) => void
  setSelectedClient: (client: Client | null) => void
  setPagination: (pagination: ClientsState['pagination']) => void
  setFilters: (filters: Partial<SearchParams>) => void
  getFilteredClients: (searchParams?: SearchParams) => Client[]
  getTotalClients: () => number
  getClientByDni: (dni: string) => Client | undefined
  getClientByCuit: (cuit: string) => Client | undefined
  clearClients: () => void
}

export const useClientsStore = create<ClientsStore>()(
  immer((set, get) => ({
    // Initial state
    clients: [],
    selectedClient: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    filters: {
      page: 1,
      limit: 10,
      search: '',
    },

    // Simple synchronous setters only
    setClients: (clients: Client[]) => {
      set((state) => {
        state.clients = clients
      })
    },

    addClient: (client: Client) => {
      set((state) => {
        state.clients.push(client)
        state.pagination.total += 1
      })
    },

    updateClient: (updatedClient: Client) => {
      set((state) => {
        const index = state.clients.findIndex(client => client.id === updatedClient.id)
        if (index !== -1) {
          state.clients[index] = updatedClient
        }
      })
    },

    removeClient: (id: string) => {
      set((state) => {
        state.clients = state.clients.filter(client => client.id !== id)
        state.pagination.total = Math.max(0, state.pagination.total - 1)
      })
    },

    setSelectedClient: (client: Client | null) => {
      set((state) => {
        state.selectedClient = client
      })
    },

    setPagination: (pagination: ClientsState['pagination']) => {
      set((state) => {
        state.pagination = pagination
      })
    },

    setFilters: (filters: Partial<SearchParams>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
      })
    },

    // Centralized calculations - single source of truth
    getFilteredClients: (searchParams?: SearchParams) => {
      const state = get()
      const clients = state.clients
      const params = searchParams || state.filters

      if (!params.search) return clients

      return clients.filter((client) =>
        client.fullName.toLowerCase().includes(params.search!.toLowerCase()) ||
        (client.dni && client.dni.includes(params.search!)) ||
        (client.cuit && client.cuit.includes(params.search!)) ||
        (client.email && client.email.toLowerCase().includes(params.search!.toLowerCase()))
      )
    },

    getTotalClients: () => {
      return get().clients.length
    },

    getClientByDni: (dni: string) => {
      return get().clients.find(client => client.dni === dni)
    },

    getClientByCuit: (cuit: string) => {
      return get().clients.find(client => client.cuit === cuit)
    },

    clearClients: () => {
      set((state) => {
        state.clients = []
        state.selectedClient = null
        state.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      })
    },

    // Alias for clearClients (used by cache manager)
    clearCache: () => {
      get().clearClients()
    },
  }))
)