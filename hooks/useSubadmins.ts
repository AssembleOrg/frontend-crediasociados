'use client'

import { useMemo } from 'react'
import { useUsers } from './useUsers'
import type { User } from '@/types/auth'

/**
 * Hook especializado para gestión de Sub-Administradores
 * Simplifica la interfaz y evita confusión arquitectural
 */
export const useSubadmins = () => {
  const { 
    users, 
    isLoading, 
    error, 
    createUser, 
    updateUser, 
    deleteUser,
    clearError 
  } = useUsers()

  // Filtrar solo sub-administradores
  const subadmins = useMemo(() => 
    users.filter(user => user.role === 'subadmin'), 
    [users]
  )

  // Función específica para crear sub-administradores
  const createSubadmin = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'> & { password: string }) => {
    return createUser({
      ...userData,
      role: 'subadmin'
    })
  }

  return {
    subadmins,
    isLoading,
    error,
    createSubadmin,
    updateSubadmin: updateUser,
    deleteSubadmin: deleteUser,
    clearError,
    totalSubadmins: subadmins.length
  }
}