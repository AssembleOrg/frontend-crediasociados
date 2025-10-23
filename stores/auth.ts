import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState, UserRole } from '@/types/auth';

// Custom cookie storage for Zustand persist
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((c) => c.trim().startsWith(`${key}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; path=/; max-age=86400; SameSite=Lax`;
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

/**
 * THE WAREHOUSE - Auth Store (MINIMAL)
 * "Dumb" store that ONLY holds authentication essentials.
 * NEVER stores business data (clientQuota, wallet, etc.) - that goes to usersStore.
 * NEVER calls services or has async logic.
 *
 * This enforces Single Source of Truth: usersStore is canonical for ALL user data.
 */
interface MinimalUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthStore {
  // Authentication essentials only
  userId: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Simple synchronous setters only
  setUser: (user: User | null) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  setAuthentication: (isAuthenticated: boolean) => void;
  clearAuth: () => void;
  getDashboardRoute: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State - MINIMAL
      userId: null,
      userEmail: null,
      userRole: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // Simple synchronous actions only
      setUser: (user: User | null) => {
        set({
          userId: user?.id || null,
          userEmail: user?.email || null,
          userRole: user?.role || null,
        });
      },

      setTokens: (token: string | null, refreshToken: string | null) => {
        set({ token, refreshToken });
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
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        userId: state.userId,
        userEmail: state.userEmail,
        userRole: state.userRole,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: false,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Zustand rehydration error:', error);
        }
      },
    }
  )
);
