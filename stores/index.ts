// Core domain stores
export { useAuthStore } from './auth'
export { useUsersStore } from './users'
export { useClientesStore } from './clientes'
export { usePrestamosStore } from './prestamos'
export { useStatsStore } from './stats'

// App/UI store
export { useAppStore, useNotifications, useModals, usePreferences } from './app'

// Re-export types for convenience
export type { 
  User, 
  AuthState, 
  PaginationParams 
} from '@/types/auth'

export type { 
  NotificationType, 
  Notification 
} from './app'