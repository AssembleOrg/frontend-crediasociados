'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'

/**
 * useCurrentUser Hook
 *
 * ALWAYS returns fresh user data from usersStore (Single Source of Truth).
 * Never uses stale authStore data.
 *
 * Use this hook whenever you need to access business data:
 * - clientQuota, usedClientQuota, availableClientQuota
 * - wallet balance
 * - Any other user fields that might be updated after login
 *
 * useAuth() should ONLY be used for:
 * - Authentication checks (isAuthenticated)
 * - Role-based routing (user.role)
 * - API tokens (token, refreshToken)
 * - Logout operations
 */
export const useCurrentUser = () => {
  const authStore = useAuthStore()
  const usersStore = useUsersStore()

  const currentUser = useMemo(() => {
    if (!authStore.userId) return null

    const user = usersStore.users.find((u) => u.id === authStore.userId)

    return user || null
  }, [usersStore.users, authStore.userId])

  return currentUser
}
