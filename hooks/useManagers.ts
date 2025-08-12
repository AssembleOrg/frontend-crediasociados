'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useUsers } from './useUsers'

export function useManagers() {
  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    clearError
  } = useUsers()

  const managers = useMemo(() => 
    users.filter(user => user.role === 'prestamista'), 
    [users]
  )

  const createManager = useCallback(async (userData: any) => {
    return createUser({
      ...userData,
      role: 'prestamista' as const
    })
  }, [createUser])

  return {
    managers,
    totalManagers: managers.length, // Count only managers, not all users
    isLoading,
    error,
    createManager,
    updateUser,
    deleteUser,
    clearError
  }
}