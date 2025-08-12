import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { User, PaginationParams } from '@/types/auth'

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
  filters: PaginationParams
}

interface UsersStore extends UsersState {
  // Simple synchronous setters only - NO async logic here
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  updateUser: (id: string, userData: Partial<User>) => void
  removeUser: (id: string) => void
  setSelectedUser: (user: User | null) => void
  setPagination: (pagination: UsersState['pagination']) => void
  setFilters: (filters: Partial<PaginationParams>) => void
  clearUsers: () => void
  
  // Centralized calculations - single source of truth
  getUsersByRole: (role: User['role']) => User[]
  getTotalUsers: () => number
  getUsersWithPhone: () => User[]
  getAdminUsers: () => User[]
}

export const useUsersStore = create<UsersStore>()(
  immer((set, get) => ({
    // Initial state
    users: [],
    selectedUser: null,
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

    updateUser: (id: string, userData: Partial<User>) => {
      set((state) => {
        const index = state.users.findIndex(u => u.id === id)
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...userData }
        }
        
        // Update selected if it's the same user
        if (state.selectedUser?.id === id) {
          state.selectedUser = { ...state.selectedUser, ...userData }
        }
      })
    },

    removeUser: (id: string) => {
      set((state) => {
        state.users = state.users.filter(u => u.id !== id)
        
        // Clear selection if it's the removed user
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

    setFilters: (filters: Partial<PaginationParams>) => {
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
        state.filters = {
          page: 1,
          limit: 10
        }
      })
    },

    // Centralized calculations - single source of truth
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