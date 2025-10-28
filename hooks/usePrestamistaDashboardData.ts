'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClients } from '@/hooks/useClients'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'

export const usePrestamistaDashboardData = () => {
  const { clients, isLoading: clientsLoading } = useClients()
  const { loans, isLoading: loansLoading } = useLoans()
  const { allSubLoansWithClient, isLoading: subLoansLoading } = useSubLoans()

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!clientsLoading && !loansLoading && !subLoansLoading) {
      setIsInitialized(true)
    }
  }, [clientsLoading, loansLoading, subLoansLoading])

  const refreshData = useCallback(async () => {
    // Triggers re-fetch by hooks
    setIsInitialized(false)
  }, [])

  return {
    clients,
    loans,
    subLoans: allSubLoansWithClient,
    isLoading: clientsLoading || loansLoading || subLoansLoading,
    isInitialized,
    refreshData
  }
}