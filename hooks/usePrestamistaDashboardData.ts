'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useClients } from '@/hooks/useClients'
import { loansService } from '@/services/loans.service'

export const usePrestamistaDashboardData = () => {
  const { clients, isLoading: clientsLoading } = useClients()

  const [loansEvolution, setLoansEvolution] = useState<Array<{ date: string; loans: number }>>([])
  const [paymentsDistribution, setPaymentsDistribution] = useState<Array<{ status: string; count: number }>>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadStats = async () => {
      try {
        const stats = await loansService.getDashboardStats()
        setLoansEvolution(stats.loansEvolution || [])
        setPaymentsDistribution(stats.paymentsDistribution || [])
      } catch {
        // Graceful degradation
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [])

  const refreshData = useCallback(async () => {
    hasFetched.current = false
    setStatsLoading(true)
    try {
      const stats = await loansService.getDashboardStats()
      setLoansEvolution(stats.loansEvolution || [])
      setPaymentsDistribution(stats.paymentsDistribution || [])
    } catch {
      // Graceful degradation
    } finally {
      setStatsLoading(false)
    }
  }, [])

  return {
    clients,
    loansEvolution,
    paymentsDistribution,
    isLoading: clientsLoading || statsLoading,
    refreshData
  }
}
