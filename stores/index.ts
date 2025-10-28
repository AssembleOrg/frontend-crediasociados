// Core domain stores
export { useAuthStore } from './auth'
export { useUsersStore } from './users'
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