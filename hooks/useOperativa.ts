/**
 * THE CHEF/CONTROLLER - useOperativa Hook
 *
 * Business logic orchestration for unified transaction system (Operativa)
 * Handles both ingresos (income) and egresos (expenses) in a single ledger
 *
 * Following architecture:
 * - Initialization handled by OperativaProvider (NOT auto-init here)
 * - CRUD operations with store updates
 * - Automatic integration with finanzas store
 * - NO store methods in useCallback dependencies
 */

'use client'

import { useState, useCallback } from 'react'
import { useOperativaStore } from '@/stores/operativa'
import { useFinanzasStore } from '@/stores/finanzas'
import { useAuth } from '@/hooks/useAuth'
import { operativaService } from '@/services/operativa.service'
import type {
  Transaccion,
  CreateIngresoDto,
  CreateEgresoDto,
  UpdateTransaccionDto,
  TransaccionFilters,
  TransaccionSummary
} from '@/types/operativa'

export const useOperativa = () => {
  const { user } = useAuth()
  const operativaStore = useOperativaStore()
  const finanzasStore = useFinanzasStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create new ingreso
   * Automatically updates finanzas metrics
   */
  const createIngreso = useCallback(
    async (data: CreateIngresoDto): Promise<Transaccion | null> => {
      if (!user) return null

      setIsLoading(true)
      setError(null)

      try {
        const newIngreso = await operativaService.createIngreso(user?.id || '', data)
        operativaStore.addTransaccion(newIngreso)

        // Sync with finanzas
        finanzasStore.applyTransaccion(newIngreso)

        return newIngreso
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error creando ingreso'
        setError(errorMessage)
        console.error('Error creating ingreso:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, operativaStore, finanzasStore]
  )

  /**
   * Create new egreso
   * Automatically updates finanzas metrics
   */
  const createEgreso = useCallback(
    async (data: CreateEgresoDto): Promise<Transaccion | null> => {
      if (!user) return null

      setIsLoading(true)
      setError(null)

      try {
        const newEgreso = await operativaService.createEgreso(user?.id || '', data)
        operativaStore.addTransaccion(newEgreso)

        // Sync with finanzas
        finanzasStore.applyTransaccion(newEgreso)

        return newEgreso
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error creando egreso'
        setError(errorMessage)
        console.error('Error creating egreso:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, operativaStore, finanzasStore]
  )

  /**
   * Special method: Create ingreso from cuota payment
   * Called automatically when payment is registered in timeline
   */
  const createIngresoFromPago = useCallback(
    async (
      subloanId: string,
      amount: number,
      clientName: string,
      cuotaNumber: number,
      fecha: Date = new Date()
    ): Promise<Transaccion | null> => {
      if (!user) return null

      setIsLoading(true)
      setError(null)

      try {
        const newIngreso = await operativaService.createIngresoFromPago(
          user?.id || '',
          subloanId,
          amount,
          clientName,
          cuotaNumber,
          fecha
        )

        operativaStore.addTransaccion(newIngreso)

        // Sync with finanzas
        finanzasStore.applyTransaccion(newIngreso)

        console.log('✅ Pago registrado como ingreso:', newIngreso)

        return newIngreso
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error creando ingreso desde pago'
        setError(errorMessage)
        console.error('Error creating ingreso from pago:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, operativaStore, finanzasStore]
  )

  /**
   * Update existing transaccion
   */
  const updateTransaccion = useCallback(
    async (id: string, data: UpdateTransaccionDto): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const updated = await operativaService.updateTransaccion(id, data)
        if (updated) {
          operativaStore.updateTransaccion(id, updated)
          return true
        }
        return false
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error actualizando transacción'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [operativaStore]
  )

  /**
   * Delete transaccion
   * NOTE: This should probably NOT update finanzas (avoid negative amounts)
   * Consider soft-delete or admin-only in production
   */
  const deleteTransaccion = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        await operativaService.deleteTransaccion(id)
        operativaStore.removeTransaccion(id)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error eliminando transacción'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [operativaStore]
  )

  /**
   * Refresh transacciones with filters
   */
  const refreshTransacciones = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const transacciones = await operativaService.getTransacciones(user?.id || '')
      operativaStore.setTransacciones(transacciones)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando transacciones'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, operativaStore])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Get summary (computed on the fly)
   */
  const getSummary = (): TransaccionSummary => {
    return operativaStore.getSummary()
  }

  return {
    // Transacciones data
    transacciones: operativaStore.transacciones,

    // Store getters
    getTransaccionesByTipo: operativaStore.getTransaccionesByTipo,
    getIngresos: operativaStore.getIngresos,
    getEgresos: operativaStore.getEgresos,
    getSummary,
    getFiltered: operativaStore.getFiltered,
    getTotalIngresos: operativaStore.getTotalIngresos,
    getTotalEgresos: operativaStore.getTotalEgresos,
    getBalance: operativaStore.getBalance,

    // State
    isLoading,
    error,

    // Actions
    createIngreso,
    createEgreso,
    createIngresoFromPago, // ⭐ Special method for payment integration
    updateTransaccion,
    deleteTransaccion,
    refreshTransacciones,
    clearError
  }
}
