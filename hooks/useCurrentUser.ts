'use client'

import { useAuthStore } from '@/stores/auth'
import { useEffect } from 'react'

/**
 * useCurrentUser Hook
 *
 * Returns the authenticated user from authStore (Single Source of Truth).
 * Data is persisted in localStorage and survives F5.
 *
 * Use this hook whenever you need to access the logged-in user's data:
 * - clientQuota, usedClientQuota, availableClientQuota
 * - wallet balance
 * - Any other user fields
 *
 * The hook automatically updates when the user data changes in authStore.
 */
export const useCurrentUser = () => {
  const currentUser = useAuthStore((state) => state.currentUser)
  
  return currentUser
}
