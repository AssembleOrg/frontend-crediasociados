'use client'

import { useState, useCallback } from 'react'
import { loansService } from '@/services/loans.service'
import { mapLoanTrackingResponse } from '@/lib/consulta/dataMappers'
import type { LoanTrackingResponseDto } from '@/types/auth'

interface PublicLoanQuery {
  dni: string
  loanTrack: string
}

interface LocalLoanDetails {
  id: string
  loanTrack: string
  amount: number
  originalAmount?: number
  baseInterestRate: number
  penaltyInterestRate: number
  paymentFrequency: string
  totalPayments: number
  remainingPayments: number
  nextDueDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
  createdAt: string
  client: {
    id: string
    fullName: string
    dni: string
    phone?: string
    email?: string
    address?: string
  }
  subLoans: Array<{
    id: string
    paymentNumber: number
    amount: number
    totalAmount: number
    dueDate: string
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
    paidDate?: string
    paidAmount?: number
    daysOverdue?: number
  }>
}

interface QueryState {
  isLoading: boolean
  error: string | null
  loanDetails: LocalLoanDetails | null
}

export const usePublicLoanQuery = () => {
  const [state, setState] = useState<QueryState>({
    isLoading: false,
    error: null,
    loanDetails: null
  })

  const queryLoan = useCallback(async (queryData: PublicLoanQuery): Promise<boolean> => {
    if (!queryData.dni.trim() || !queryData.loanTrack.trim()) {
      setState(prev => ({ ...prev, error: 'Por favor, completa todos los campos' }))
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, loanDetails: null }))

    try {
      // Get loan data with included subLoans from tracking endpoint
      const loanResponse = await loansService.getLoanByTracking(queryData.dni, queryData.loanTrack)

      // Use subLoans directly from the tracking response (no need for separate lookup)
      const mappedData = mapLoanTrackingResponse(loanResponse)
      setState(prev => ({ ...prev, loanDetails: mappedData, isLoading: false }))
      return true
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'No se encontró el préstamo. Verifica los datos ingresados.'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      return false
    }
  }, [])

  const clearQuery = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      loanDetails: null
    })
  }, [])

  return {
    ...state,
    queryLoan,
    clearQuery
  }
}