'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useClientesStore } from '@/stores/clientes'
import type { Cliente } from '@/types/prestamo'

/**
 * THE CHEF/CONTROLLER - useClientes Hook
 * The brain of the clients management operation.
 * - Calls the Service (when available)
 * - Handles loading and error states
 * - Gives simple orders to the Store to update data
 * - Returns everything the UI needs
 * - PREVENTS race conditions with proper initialization patterns
 */
export const useClientes = () => {
  const clientesStore = useClientesStore()
  
  // Local state for loading and errors - NOT in the store
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs to prevent race conditions
  const initializationRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * SAFE INITIALIZATION PATTERN
   * This prevents the race condition problem with useEffect dependencies
   */
  const initializeClientes = useCallback(async (): Promise<void> => {
    // Prevent double initialization
    if (initializationRef.current) return
    initializationRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      // TODO: Replace with actual API service call
      // const response = await clientesService.getClientes({ 
      //   ...clientesStore.filters 
      // }, { signal: abortControllerRef.current.signal })
      
      // Mock data for now - remove when connecting to real API
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
      
      const mockClientes: Cliente[] = [
        {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          dni: '12345678',
          telefono: '+5491123456789',
          email: 'juan.perez@email.com',
          direccion: 'Av. Corrientes 1234',
          fechaRegistro: new Date('2024-01-15'),
          estado: 'activo',
          creditScore: 750,
          ingresosDeclardos: 50000
        },
        {
          id: '2', 
          nombre: 'María',
          apellido: 'González',
          dni: '87654321',
          telefono: '+5491187654321',
          email: 'maria.gonzalez@email.com',
          direccion: 'Calle Florida 5678',
          fechaRegistro: new Date('2024-02-20'),
          estado: 'activo',
          creditScore: 680,
          ingresosDeclardos: 45000
        }
      ]

      // Update store with simple synchronous actions
      clientesStore.setClientes(mockClientes)
      
      // Update pagination mock
      clientesStore.setPagination({
        page: 1,
        limit: 10,
        total: mockClientes.length,
        totalPages: 1
      })
      
      setIsInitialized(true)

    } catch (err: any) {
      // Don't set error if request was aborted
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load clientes')
      }
      
    } finally {
      setIsLoading(false)
    }
  }, [clientesStore]) // Safe dependency - store is stable

  const fetchClientes = useCallback(async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Merge with current filters
      const filters = { ...clientesStore.filters, ...params }
      
      // TODO: Replace with actual API service call
      // const response = await clientesService.getClientes(filters, { 
      //   signal: abortControllerRef.current.signal 
      // })
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Apply filters to mock data
      let filteredClientes = clientesStore.clientes
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredClientes = filteredClientes.filter(c => 
          c.nombre.toLowerCase().includes(search) ||
          c.apellido.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search)
        )
      }
      
      // Update the store
      clientesStore.setClientes(filteredClientes)
      clientesStore.setFilters(filters)
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch clientes')
      }
      
    } finally {
      setIsLoading(false)
    }
  }, [clientesStore])

  const createCliente = useCallback(async (
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API service call
      // const newCliente = await clientesService.createCliente(clienteData)
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newCliente: Cliente = {
        id: `cliente-${Date.now()}`,
        fechaRegistro: new Date(),
        ...clienteData
      }
      
      // Update the store with simple action
      clientesStore.addCliente(newCliente)
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to create cliente')
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [clientesStore])

  const updateCliente = useCallback(async (
    id: string,
    clienteData: Partial<Cliente>
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API service call
      // const updatedCliente = await clientesService.updateCliente(id, clienteData)
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Update the store
      clientesStore.updateCliente(id, clienteData)
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to update cliente')
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [clientesStore])

  const deleteCliente = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API service call
      // await clientesService.deleteCliente(id)
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Update the store
      clientesStore.removeCliente(id)
      
      return true
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete cliente')
      return false
      
    } finally {
      setIsLoading(false)
    }
  }, [clientesStore])

  /**
   * SAFE INITIALIZATION EFFECT
   * Only runs once on mount, no problematic dependencies
   */
  useEffect(() => {
    initializeClientes()
    
    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Empty deps array is safe here - initializeClientes handles everything

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Clear selected cliente
  const clearSelectedCliente = useCallback(() => {
    clientesStore.setClienteSeleccionado(null)
  }, [clientesStore])

  // Refresh data (safe re-fetch)
  const refreshClientes = useCallback(() => {
    return fetchClientes(clientesStore.filters)
  }, [fetchClientes, clientesStore.filters])

  return {
    // State from store (single source of truth)
    clientes: clientesStore.clientes,
    clienteSeleccionado: clientesStore.clienteSeleccionado,
    pagination: clientesStore.pagination,
    filters: clientesStore.filters,
    
    // Computed values from store
    clientesFiltrados: clientesStore.getClientesByFilter(),
    totalClientes: clientesStore.getTotalClientes(),
    clientesActivos: clientesStore.getClientesActivos(),
    
    // Local state (not persisted)
    isLoading,
    error,
    isInitialized,
    
    // Actions
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    clearSelectedCliente,
    clearError,
    refreshClientes
  }
}

/**
 * USAGE PATTERNS TO PREVENT RACE CONDITIONS:
 * 
 * ❌ AVOID:
 * useEffect(() => {
 *   agregarCliente(newClient) // This creates race conditions
 * }, [agregarCliente]) // agregarCliente changes on every render
 * 
 * ✅ CORRECT:
 * const { createCliente } = useClientes()
 * 
 * const handleSubmit = async (clientData) => {
 *   const success = await createCliente(clientData)
 *   if (success) {
 *     // Handle success
 *   }
 * }
 */