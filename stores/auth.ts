import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState, UserRole } from '@/types/auth'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; user: User | null }>
  logout: () => void
  setLoading: (loading: boolean) => void
  getDashboardRoute: () => string
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Simulación de autenticación - aquí conectarías con tu backend
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Mock de usuarios para desarrollo
          const mockUsers: Record<string, User> = {
            'admin@prestamito.com': { 
              id: '1', 
              email: 'admin@prestamito.com', 
              name: 'Administrador', 
              role: 'admin' 
            },
            'prestamista@prestamito.com': { 
              id: '2', 
              email: 'prestamista@prestamito.com', 
              name: 'Juan Pérez', 
              role: 'prestamista' 
            },
            'cliente@prestamito.com': { 
              id: '3', 
              email: 'cliente@prestamito.com', 
              name: 'María González', 
              role: 'cliente' 
            }
          }

          const user = mockUsers[email]
          if (user && password === 'password') {
            const token = `token-${user.id}-${Date.now()}`
            set({ 
              user, 
              token, 
              isAuthenticated: true, 
              isLoading: false 
            })
            console.log('Auth store updated with user:', user)
            return { success: true, user }
          }
          
          set({ isLoading: false })
          return { success: false, user: null }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, user: null }
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false
        })
      },

      getDashboardRoute: () => {
        const { user } = get()
        if (!user) return '/login'
        
        switch (user.role) {
          case 'admin': return '/dashboard/admin'
          case 'prestamista': return '/dashboard/prestamista'
          case 'cliente': return '/dashboard/cliente'
          default: return '/login'
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      skipHydration: false, // Asegurar hidratación correcta
    }
  )
)