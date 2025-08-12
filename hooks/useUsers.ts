'use client'

import { useState, useCallback, useEffect } from 'react'
import { useUsersStore } from '@/stores/users'
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
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (params?: PaginationParams): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Merge with current filters
      const filters = { ...usersStore.filters, ...params }
      
      // Call the service
      const response = await usersService.getUsers(filters)
      
      // Transform API users to frontend users
      const users = response.data.map(apiUserToUser)
      
      // Update the store with simple actions
      usersStore.setUsers(users)
      usersStore.setPagination(response.meta)
      usersStore.setFilters(filters)
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch users')
      
    } finally {
      setIsLoading(false)
    }
  }, []) // ✅ Sin dependencias - usersStore es estable

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
      
      return true
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to create user')
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

  // Auto-fetch users when filters change
  useEffect(() => {
    fetchUsers()
  }, []) // Only on mount - fetchUsers handles filter updates

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSelectedUser = useCallback(() => {
    usersStore.setSelectedUser(null)
  }, [])

  const getCreatedUsers = useCallback(async (userId: string, params?: PaginationParams): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await usersService.getCreatedUsers(userId, params)
      const users = response.data.map(apiUserToUser)
      
      usersStore.setUsers(users)
      usersStore.setPagination(response.meta)
      
      return true
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch created users')
      return false
    } finally {
      setIsLoading(false)
    }
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
    getCreatedUsers,
    clearSelectedUser,
    clearError,
    
    getUsersByRole: usersStore.getUsersByRole,
    getTotalUsers: usersStore.getTotalUsers,
    getUsersWithPhone: usersStore.getUsersWithPhone,
    getAdminUsers: usersStore.getAdminUsers,
    getFilteredUsers: usersStore.getFilteredUsers
  }
}