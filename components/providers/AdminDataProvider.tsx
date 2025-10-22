'use client'

/**
 * AdminDataProvider - REFACTORED
 *
 * NOTE: This provider is now in "passthrough" mode.
 * The new useAdminDashboardData hook reads subadmins from usersStore
 * (single source of truth) instead of via this provider.
 *
 * This component is kept for backward compatibility but does minimal work.
 */

interface AdminDataProviderProps {
  children: React.ReactNode
}

export default function AdminDataProvider({ children }: AdminDataProviderProps) {
  // Passthrough provider - all data management now happens in useAdminDashboardData
  // which reads from usersStore (the canonical source of truth)
  return <>{children}</>
}