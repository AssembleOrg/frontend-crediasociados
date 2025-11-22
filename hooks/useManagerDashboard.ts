import { useState, useEffect, useCallback } from 'react'
import managerService, { type ManagerDashboardData } from '@/services/manager.service'

export function useManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const dashboardData = await managerService.getDashboardData()
      setData(dashboardData)
    } catch (err) {
      
      setError('Error al cargar los datos del dashboard')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
  }
}

