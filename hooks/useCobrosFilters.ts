import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { subLoansService } from '@/services/sub-loans.service'
import type { CobrosClient, CobrosGlobalStats, CobrosResponse } from '@/services/sub-loans.service'

export interface CobrosFilters {
  urgency?: 'overdue' | 'today' | 'soon' | 'future' | 'all'
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  clientId?: string
}

export function useCobrosFilters() {
  const [filters, setFilters] = useState<CobrosFilters>({})
  const [clients, setClients] = useState<CobrosClient[]>([])
  const [allClients, setAllClients] = useState<CobrosClient[]>([]) // full list for client-side search
  const [globalStats, setGlobalStats] = useState<CobrosGlobalStats>({ overdue: 0, today: 0, soon: 0, future: 0, paid: 0, total: 0 })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [totalClients, setTotalClients] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameSearch, setNameSearch] = useState('')

  const totalClientsRef = useRef(0)

  const fetchCobros = useCallback(async (currentFilters: CobrosFilters, currentPage: number, currentLimit: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response: CobrosResponse = await subLoansService.getCobros({
        ...currentFilters,
        page: currentPage,
        limit: currentLimit,
      })
      setClients(response.clients)
      setGlobalStats(response.globalStats)
      setTotalClients(response.meta.total)
      setTotalPages(response.meta.totalPages)
      totalClientsRef.current = response.meta.total
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar cobros')
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Separate fetch that loads all records for client-side name filtering
  const fetchAllForSearch = useCallback(async (currentFilters: CobrosFilters) => {
    setIsSearchLoading(true)
    try {
      const fetchAll = totalClientsRef.current > 0 ? totalClientsRef.current : 500
      const response: CobrosResponse = await subLoansService.getCobros({
        ...currentFilters,
        page: 1,
        limit: fetchAll,
      })
      setAllClients(response.clients)
      totalClientsRef.current = response.meta.total
    } catch {
      setAllClients([])
    } finally {
      setIsSearchLoading(false)
    }
  }, [])

  // Stable key to detect actual filter changes
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  // Paginated fetch — only when not searching
  useEffect(() => {
    if (nameSearch.trim().length >= 2) return
    fetchCobros(filters, page, limit)
    setAllClients([]) // clear search cache when filters/page change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, limit])

  // Search fetch — debounced, gate at 2 chars, mirrors CobrosFilterPanel pattern
  useEffect(() => {
    const trimmed = nameSearch.trim()
    if (trimmed.length < 2) {
      setAllClients([])
      return
    }
    const timer = setTimeout(() => {
      fetchAllForSearch(filters)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSearch, filtersKey])

  // Client-side filter over the full list
  const displayedClients = useMemo(() => {
    const trimmed = nameSearch.trim()
    if (trimmed.length >= 2 && allClients.length > 0) {
      const q = trimmed.toLowerCase()
      return allClients.filter(c => c.client.fullName.toLowerCase().includes(q))
    }
    return clients
  }, [nameSearch, allClients, clients])

  const updateFilter = useCallback(<K extends keyof CobrosFilters>(key: K, value: CobrosFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to page 1 on filter change
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== undefined && v !== null && v !== '' && v !== 'all')
  }, [filters])

  const refresh = useCallback(() => {
    fetchCobros(filters, page, limit)
  }, [fetchCobros, filters, page, limit])

  // Status filter options with global counts
  const statusFilterOptions = useMemo(() => [
    { key: 'overdue' as const, label: 'Vencidos', color: '#f44336', count: globalStats.overdue },
    { key: 'today' as const, label: 'Hoy', color: '#ff9800', count: globalStats.today },
    { key: 'soon' as const, label: 'Pronto', color: '#ffc107', count: globalStats.soon },
    { key: 'all' as const, label: 'Todos', color: '#1976d2', count: globalStats.total - globalStats.paid },
  ], [globalStats])

  return {
    // Data
    clients,
    displayedClients,
    globalStats,
    isLoading,
    isSearchLoading,
    error,

    // Pagination
    page,
    limit,
    totalClients,
    totalPages,
    setPage,
    setLimit,

    // Filters
    filters,
    hasActiveFilters,
    statusFilterOptions,
    updateFilter,
    clearAllFilters,

    // Search
    nameSearch,
    setNameSearch,

    // Actions
    refresh,
  }
}
