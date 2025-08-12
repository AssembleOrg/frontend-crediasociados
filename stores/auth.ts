import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState } from '@/types/auth'

/**
 * THE WAREHOUSE - Auth Store
 * "Dumb" store that only holds data and has simple, synchronous actions.
 * NEVER calls services or has async logic.
 */
interface AuthStore extends AuthState {
  // Simple synchronous setters only
  setUser: (user: User | null) => void
  setTokens: (token: string | null, refreshToken: string | null) => void
  setAuthentication: (isAuthenticated: boolean) => void
  clearAuth: () => void
  getDashboardRoute: () => string
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // Simple synchronous actions only
      setUser: (user: User | null) => {
        set({ user })
      },

      setTokens: (token: string | null, refreshToken: string | null) => {
        set({ token, refreshToken })
      },

      setAuthentication: (isAuthenticated: boolean) => {
        set({ isAuthenticated })
      },

      // Complete authentication setup
      clearAuth: () => {
        set({ 
          user: null, 
          token: null, 
          refreshToken: null,
          isAuthenticated: false
        })
      },

      // Utility function for routing
      getDashboardRoute: () => {
        const { user } = get()
        if (!user) return '/login'
        
        switch (user.role) {
          case 'admin': return '/dashboard/admin'
          case 'subadmin': return '/dashboard/subadmin'
          case 'prestamista': return '/dashboard/prestamista'
          default: return '/login'
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
      skipHydration: false,
    }
  )
)