'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useUsersStore } from '@/stores/users'
import { useAdminStore } from '@/stores/admin'
import { useSubadminStore } from '@/stores/subadmin'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/users.service'
import { apiUserToUser, userToCreateDto, userToUpdateDto } from '@/types/transforms'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  ApiError
} from '@/types/auth'

/**
 * THE CHEF/CONTROLLER - useUsers Hook
 * The brain of the users management operation.
 * - Calls the Service
 * - Handles loading and error states
 * - Gives simple orders to the Store to update data
 * - Returns everything the UI needs
 */
export const useUsers = () => {
  const usersStore = useUsersStore()
  const adminStore = useAdminStore()
  const subadminStore = useSubadminStore()
  const { user: currentUser } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs to prevent race conditions and duplicate requests
  const isInFlightRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchUsers = useCallback(async (params?: PaginationParams): Promise<void> => {
    if (!currentUser) return

    // Prevent DUPLICATE in-flight requests, but allow refresh after completion
    if (isInFlightRef.current) return
    isInFlightRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      // Cancel previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const filters = { ...usersStore.filters, ...params }
      let response

      if (currentUser.role === 'superadmin') {
        // Only SUPERADMIN can see ALL users
        response = await usersService.getUsers(filters)
      } else {
        // ADMIN and SUBADMIN see only users they created (hierarchical access)
        // This enforces proper role-based security as documented in adminlogs.md
        response = await usersService.getCreatedUsers(currentUser.id, filters)
      }

      const users = response.data.map(apiUserToUser)

      // DEBUG: Log first subadmin's clientQuota to trace data flow
      const firstSubadmin = users.find(u => u.role === 'subadmin')
      if (firstSubadmin) {
        console.log('🔍 [useUsers] First subadmin:', {
          id: firstSubadmin.id,
          fullName: firstSubadmin.fullName,
          clientQuota: firstSubadmin.clientQuota,
          usedClientQuota: firstSubadmin.usedClientQuota,
          availableClientQuota: firstSubadmin.availableClientQuota
        })
      }

      // Use upsertUsers to preserve rich data from backend incomplete responses
      // This ensures clientQuota, usedClientQuota, etc. are preserved even if
      // backend endpoint doesn't include them in the response
      usersStore.upsertUsers(users)
      usersStore.setPagination(response.meta)
      usersStore.setFilters(filters)

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const apiError = err as ApiError
        setError(apiError.message || 'Failed to fetch users')
      }
    } finally {
      setIsLoading(false)
      isInFlightRef.current = false
    }
  }, [currentUser, usersStore])

  const createUser = useCallback(async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Transform to API format
      const createDto = userToCreateDto(userData)
      
      // Call the service
      const apiUser = await usersService.createUser(createDto)
      
      // Transform back to frontend format
      const newUser = apiUserToUser(apiUser)

      // Update the store
      usersStore.addUser(newUser)

      // Refresh the user list to get updated quota data from backend
      // (e.g., when subadmin creates a manager, subadmin's usedClientQuota changes)
      await fetchUsers()

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()

      return true
      
    } catch (err) {
      const apiError = err as ApiError
      let errorMessage = apiError.message || 'Error al crear usuario'

      // Translate common backend error messages
      if (errorMessage.includes('You have reached the maximum limit')) {
        const match = errorMessage.match(/maximum limit of (\d+) SUBADMIN/)
        if (match) {
          const limit = match[1]
          const countMatch = errorMessage.match(/Current count: (\d+)/)
          const count = countMatch ? countMatch[1] : limit
          errorMessage = `Has alcanzado el límite máximo de ${limit} cuentas de SUB-ADMIN. Cantidad actual: ${count}`
        }
      }

      setError(errorMessage)
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (
    id: string, 
    userData: Partial<User> & { password?: string }
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Transform to API format
      const updateDto = userToUpdateDto(userData)
      
      // Call the service
      const apiUser = await usersService.updateUser(id, updateDto)
      
      // Transform back to frontend format
      const updatedUser = apiUserToUser(apiUser)

      // Update the store
      usersStore.updateUser(updatedUser)

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()

      return true
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update user')
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the service
      await usersService.deleteUser(id)

      // Update the store
      usersStore.removeUser(id)

      // Invalidate related caches to ensure other views refresh
      adminStore.invalidateCache()
      subadminStore.invalidateCache()

      return true
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to delete user')
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getUserById = useCallback(async (id: string): Promise<User | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the service
      const apiUser = await usersService.getUserById(id)
      
      // Transform to frontend format
      const user = apiUserToUser(apiUser)
      
      // Update selected user in store
      usersStore.setSelectedUser(user)
      
      return user
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch user')
      return null
      
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentUser])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSelectedUser = useCallback(() => {
    usersStore.setSelectedUser(null)
  }, [])


  return {
    users: usersStore.users,
    selectedUser: usersStore.selectedUser,
    pagination: usersStore.pagination,
    filters: usersStore.filters,
    
    isLoading,
    error,
    
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    clearSelectedUser,
    clearError,
    
    getUsersByRole: usersStore.getUsersByRole,
    getTotalUsers: usersStore.getTotalUsers,
    getUsersWithPhone: usersStore.getUsersWithPhone,
    getAdminUsers: usersStore.getAdminUsers,
    getFilteredUsers: usersStore.getFilteredUsers
  }
}