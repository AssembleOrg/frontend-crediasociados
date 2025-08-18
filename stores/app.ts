import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
  duration?: number;
}

export interface AppState {
  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentPage: string;
  isOffline: boolean;

  // Loading states (global UI feedback)
  globalLoading: boolean;
  loadingMessage: string | null;

  // Modal states
  modals: {
    createUser: boolean;
    editUser: boolean;
    createCliente: boolean;
    editCliente: boolean;
    createPrestamo: boolean;
    editPrestamo: boolean;
    registrarPago: boolean;
    confirmDelete: boolean;
  };

  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;

  // User preferences (persisted)
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'es' | 'en';
    currency: 'ARS';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timezone: string;
    itemsPerPage: number;
    soundNotifications: boolean;
    emailNotifications: boolean;
    autoRefresh: boolean;
    compactMode: boolean;
  };

  // Feature flags / app configuration
  features: {
    darkMode: boolean;
    advancedReports: boolean;
    exportData: boolean;
    bulkOperations: boolean;
  };
}

interface AppStore extends AppState {
  // UI Actions - simple synchronous setters
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setOffline: (offline: boolean) => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  clearGlobalLoading: () => void;

  // Modal actions
  openModal: (modalName: keyof AppState['modals']) => void;
  closeModal: (modalName: keyof AppState['modals']) => void;
  closeAllModals: () => void;

  // Notification actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Preference actions
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
  resetPreferences: () => void;

  // Feature flag actions
  updateFeatures: (features: Partial<AppState['features']>) => void;

  // Utility getters
  getUnreadNotifications: () => Notification[];
  getRecentNotifications: (limit?: number) => Notification[];
  isModalOpen: (modalName: keyof AppState['modals']) => boolean;
}

const defaultPreferences: AppState['preferences'] = {
  theme: 'light',
  language: 'es',
  currency: 'ARS',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'America/Argentina/Buenos_Aires',
  itemsPerPage: 10,
  soundNotifications: true,
  emailNotifications: true,
  autoRefresh: true,
  compactMode: false,
};

const defaultFeatures: AppState['features'] = {
  darkMode: true,
  advancedReports: true,
  exportData: true,
  bulkOperations: false,
};

const defaultModals: AppState['modals'] = {
  createUser: false,
  editUser: false,
  createCliente: false,
  editCliente: false,
  createPrestamo: false,
  editPrestamo: false,
  registrarPago: false,
  confirmDelete: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      currentPage: 'dashboard',
      isOffline: false,

      globalLoading: false,
      loadingMessage: null,

      modals: defaultModals,

      notifications: [],
      unreadNotificationsCount: 0,

      preferences: defaultPreferences,
      features: defaultFeatures,

      // UI Actions
      setSidebarOpen: (open: boolean) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setCurrentPage: (page: string) => {
        set((state) => {
          state.currentPage = page;
        });
      },

      setOffline: (offline: boolean) => {
        set((state) => {
          state.isOffline = offline;
        });
      },

      // Loading actions
      setGlobalLoading: (loading: boolean, message?: string) => {
        set((state) => {
          state.globalLoading = loading;
          state.loadingMessage = message || null;
        });
      },

      clearGlobalLoading: () => {
        set((state) => {
          state.globalLoading = false;
          state.loadingMessage = null;
        });
      },

      // Modal actions
      openModal: (modalName: keyof AppState['modals']) => {
        set((state) => {
          state.modals[modalName] = true;
        });
      },

      closeModal: (modalName: keyof AppState['modals']) => {
        set((state) => {
          state.modals[modalName] = false;
        });
      },

      closeAllModals: () => {
        set((state) => {
          Object.keys(state.modals).forEach((key) => {
            state.modals[key as keyof AppState['modals']] = false;
          });
        });
      },

      // Notification actions
      addNotification: (
        notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>
      ) => {
        set((state) => {
          const notification: Notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            read: false,
            ...notificationData,
          };

          state.notifications.unshift(notification); // Add to beginning

          // Limit to last 50 notifications
          if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
          }

          // Update unread count
          state.unreadNotificationsCount = state.notifications.filter(
            (n) => !n.read
          ).length;
        });
      },

      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id);
          state.unreadNotificationsCount = state.notifications.filter(
            (n) => !n.read
          ).length;
        });
      },

      markNotificationAsRead: (id: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadNotificationsCount = state.notifications.filter(
              (n) => !n.read
            ).length;
          }
        });
      },

      markAllNotificationsAsRead: () => {
        set((state) => {
          state.notifications.forEach((notification) => {
            notification.read = true;
          });
          state.unreadNotificationsCount = 0;
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
          state.unreadNotificationsCount = 0;
        });
      },

      // Preference actions
      updatePreferences: (preferences: Partial<AppState['preferences']>) => {
        set((state) => {
          state.preferences = { ...state.preferences, ...preferences };
        });
      },

      resetPreferences: () => {
        set((state) => {
          state.preferences = defaultPreferences;
        });
      },

      // Feature flag actions
      updateFeatures: (features: Partial<AppState['features']>) => {
        set((state) => {
          state.features = { ...state.features, ...features };
        });
      },

      // Utility getters
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },

      getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit);
      },

      isModalOpen: (modalName: keyof AppState['modals']) => {
        return get().modals[modalName];
      },
    })),
    {
      name: 'app-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        features: state.features,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      skipHydration: false,
    }
  )
);

// Convenience hooks for common patterns
export const useNotifications = () => {
  const store = useAppStore();

  return {
    notifications: store.notifications,
    unreadCount: store.unreadNotificationsCount,
    unreadNotifications: store.getUnreadNotifications(),
    recentNotifications: store.getRecentNotifications(),
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    markAsRead: store.markNotificationAsRead,
    markAllAsRead: store.markAllNotificationsAsRead,
    clearAll: store.clearNotifications,
  };
};

export const useModals = () => {
  const store = useAppStore();

  return {
    modals: store.modals,
    openModal: store.openModal,
    closeModal: store.closeModal,
    closeAllModals: store.closeAllModals,
    isModalOpen: store.isModalOpen,
  };
};

export const usePreferences = () => {
  const store = useAppStore();

  return {
    preferences: store.preferences,
    updatePreferences: store.updatePreferences,
    resetPreferences: store.resetPreferences,
    theme: store.preferences.theme,
    language: store.preferences.language,
    currency: store.preferences.currency,
    itemsPerPage: store.preferences.itemsPerPage,
  };
};
