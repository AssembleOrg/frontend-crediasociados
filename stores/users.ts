import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { User, PaginationParams, SearchParams } from '@/types/auth'

/**
 * THE WAREHOUSE - Users Store
 * "Dumb" store that only holds data and has simple, synchronous actions.
 * NEVER calls services or has async logic - that's the Controller Hook's job.
 */
interface UsersState {
  users: User[]
  selectedUser: User | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: SearchParams
}

interface UsersStore extends UsersState {
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  updateUser: (user: User) => void
  upsertUsers: (users: User[]) => void
  removeUser: (id: string) => void
  setSelectedUser: (user: User | null) => void
  setPagination: (pagination: UsersState['pagination']) => void
  setFilters: (filters: Partial<SearchParams>) => void
  getFilteredUsers: (searchParams?: SearchParams) => User[]
  clearUsers: () => void

  // Centralized calculations - single source of truth
  getUsersByRole: (role: User['role']) => User[]
  getTotalUsers: () => number
  getUsersWithPhone: () => User[]
  getAdminUsers: () => User[]
}

export const useUsersStore = create<UsersStore>()(
  immer((set, get) => ({
    users: [],
    selectedUser: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    filters: {},

    // Local filtering getter
    getFilteredUsers: (searchParams?: SearchParams) => {
      const state = get()
      const params = searchParams || state.filters
      let filtered = [...state.users]

      // Apply role filter
      if (params.role) {
        filtered = filtered.filter(user => user.role === params.role)
      }

      // Apply search filter
      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filtered = filtered.filter(user => 
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        )
      }

      // Apply sorting (frontend only - not sent to API)
      if (params.sortBy) {
        filtered.sort((a, b) => {
          const aVal = a[params.sortBy as keyof User]
          const bVal = b[params.sortBy as keyof User]
          
          if (!aVal && !bVal) return 0
          if (!aVal) return 1
          if (!bVal) return -1
          
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return params.sortOrder === 'desc' ? -comparison : comparison
        })
      }

      return filtered
    },

    setUsers: (users: User[]) => {
      set((state) => {
        state.users = users
      })
    },

    addUser: (user: User) => {
      set((state) => {
        state.users.push(user)
      })
    },

    updateUser: (user: User) => {
      set((state) => {
        const index = state.users.findIndex(u => u.id === user.id)
        if (index !== -1) {
          state.users[index] = user
        }

        if (state.selectedUser?.id === user.id) {
          state.selectedUser = user
        }
      })
    },

    upsertUsers: (incomingUsers: User[]) => {
      set((state) => {
        incomingUsers.forEach((incomingUser) => {
          const existingIndex = state.users.findIndex(u => u.id === incomingUser.id)

          if (existingIndex === -1) {
            // User doesn't exist, add it directly
            state.users.push(incomingUser)
          } else {
            // User exists, merge intelligently to preserve rich data
            // IMPORTANT: Prioritize INCOMING data if present, only preserve EXISTING if incoming is empty
            // This fixes the issue where backend updates (e.g., usedClientQuota) were being overwritten by old frontend data
            const existing = state.users[existingIndex]
            state.users[existingIndex] = {
              ...incomingUser,
              // Preserve quota fields ONLY if incoming data is missing (incomplete response from backend)
              // If backend sends any value, it means it has fresh data - use it
              clientQuota: incomingUser.clientQuota !== undefined ? incomingUser.clientQuota : existing.clientQuota,
              usedClientQuota: incomingUser.usedClientQuota !== undefined ? incomingUser.usedClientQuota : existing.usedClientQuota,
              availableClientQuota: incomingUser.availableClientQuota !== undefined ? incomingUser.availableClientQuota : existing.availableClientQuota,
              // Preserve wallet if it exists
              wallet: incomingUser.wallet ?? existing.wallet
            }
          }
        })
      })
    },

    removeUser: (id: string) => {
      set((state) => {
        state.users = state.users.filter(u => u.id !== id)
        
        if (state.selectedUser?.id === id) {
          state.selectedUser = null
        }
      })
    },

    setSelectedUser: (user: User | null) => {
      set((state) => {
        state.selectedUser = user
      })
    },

    setPagination: (pagination: UsersState['pagination']) => {
      set((state) => {
        state.pagination = pagination
      })
    },

    setFilters: (filters: Partial<SearchParams>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
      })
    },

    clearUsers: () => {
      set((state) => {
        state.users = []
        state.selectedUser = null
        state.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
        state.filters = {}
      })
    },

    getUsersByRole: (role: User['role']) => {
      return get().users.filter(user => user.role === role)
    },

    getTotalUsers: () => {
      return get().users.length
    },

    getUsersWithPhone: () => {
      return get().users.filter(user => user.phone && user.phone.trim() !== '')
    },

    getAdminUsers: () => {
      return get().users.filter(user => user.role === 'admin')
    }
  }))
)