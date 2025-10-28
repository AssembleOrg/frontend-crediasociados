'use client'

/**
 * SubadminDataProvider - REFACTORED
 *
 * NOTE: This provider is now in "passthrough" mode.
 * The new useSubadminDashboardData hook reads managers from usersStore
 * (single source of truth) instead of via this provider.
 *
 * This component is kept for backward compatibility but does minimal work.
 */

interface SubadminDataProviderProps {
  children: React.ReactNode
}

export default function SubadminDataProvider({ children }: SubadminDataProviderProps) {
  // Passthrough provider - all data management now happens in useSubadminDashboardData
  // which reads from usersStore (the canonical source of truth)
  return <>{children}</>
}