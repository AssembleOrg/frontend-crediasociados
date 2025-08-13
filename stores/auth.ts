import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthState } from '@/types/auth'

// Custom cookie storage for Zustand persist
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    console.log('🍪 Cookie Storage - Setting cookie:', key, 'value length:', value.length);
    // Set cookie with appropriate flags for Next.js middleware
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
    
    // Verify the cookie was set
    const verification = document.cookie.split(';').find(c => c.trim().startsWith(`${key}=`));
    console.log('🍪 Cookie Storage - Cookie set verification:', !!verification);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};

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
        console.log('🔄 Auth Store - Clearing auth state');
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
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
      skipHydration: false,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('🔄 Zustand rehydration error:', error);
        } else {
          console.log('🔄 Zustand rehydrated state:', state);
        }
      },
    }
  )
)