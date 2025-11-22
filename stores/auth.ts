import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState, UserRole } from '@/types/auth';

// Hybrid storage: cookies for tokens (secure), localStorage for user data (no size limit)
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Try localStorage first (preferred for large data)
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
    
    // Fallback to cookies for backward compatibility
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((c) => c.trim().startsWith(`${key}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // Store in localStorage (no size limit)
    localStorage.setItem(key, value);
    
    // Also set a lightweight cookie for token/auth checks
    // Only store essential auth data in cookie (< 4KB limit)
    try {
      const data = JSON.parse(value);
      const lightweightData = {
        userId: data.state?.userId || data.userId,
        userRole: data.state?.userRole || data.userRole,
        token: data.state?.token || data.token,
        refreshToken: data.state?.refreshToken || data.refreshToken,
        isAuthenticated: data.state?.isAuthenticated || data.isAuthenticated,
      };
      const cookieValue = encodeURIComponent(JSON.stringify(lightweightData));
      document.cookie = `${key}-token=${cookieValue}; path=/; max-age=259200; SameSite=Lax`; // 3 days
    } catch (e) {
      
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${key}-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

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
  setTokens: (token: string | null, refreshToken: string | null) => void;
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
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({
        userId: state.userId,
        userEmail: state.userEmail,
        userRole: state.userRole,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
      }),
      skipHydration: false,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Error during rehydration
        }
      },
    }
  )
);
