import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState, UserRole } from '@/types/auth';

const SESSION_MARKER = 'cookie-session';

/**
 * THE WAREHOUSE - Auth Store
 * Single Source of Truth for authenticated user data + auth tokens.
 * Data persisted in localStorage (unlimited size) + lightweight cookie for tokens.
 * NEVER calls services or has async logic.
 */
interface AuthStore {
  // Authentication essentials
  userId: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Complete current user data (persisted - survives F5)
  currentUser: User | null;

  // Simple synchronous setters only
  setUser: (user: User | null) => void;
  updateCurrentUser: (user: User) => void;
  setTokens: (_token: string | null, _refreshToken: string | null) => void;
  setAuthentication: (isAuthenticated: boolean) => void;
  clearAuth: () => void;
  getDashboardRoute: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      userId: null,
      userEmail: null,
      userRole: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      currentUser: null,

      // Simple synchronous actions only
      setUser: (user: User | null) => {
        set({
          userId: user?.id || null,
          userEmail: user?.email || null,
          userRole: user?.role || null,
          currentUser: user,
        });
      },

      updateCurrentUser: (user: User) => {
        set({
          currentUser: user,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
        });
      },

      setTokens: (_token: string | null, _refreshToken: string | null) => {
        set({ token: SESSION_MARKER, refreshToken: null });
      },

      setAuthentication: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
      },

      clearAuth: () => {
        set({
          userId: null,
          userEmail: null,
          userRole: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          currentUser: null,
        });
      },

      // Utility function for routing - uses MINIMAL auth data
      getDashboardRoute: () => {
        const { userRole } = get();
        if (!userRole) return '/login';

        switch (userRole) {
          case 'admin':
            return '/dashboard/admin';
          case 'subadmin':
            return '/dashboard/subadmin';
          case 'prestamista':
            return '/dashboard/prestamista';
          default:
            return '/login';
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        return {
          ...persistedState,
          token: persistedState.isAuthenticated ? SESSION_MARKER : null,
          refreshToken: null,
        };
      },
      partialize: (state) => ({
        userId: state.userId,
        userEmail: state.userEmail,
        userRole: state.userRole,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
      }),
      skipHydration: true, // Skip SSR hydration to prevent React #418 in Brave
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Error during rehydration
        }
      },
    }
  )
);
