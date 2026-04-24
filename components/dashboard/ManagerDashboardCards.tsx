'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Typography, Box, Skeleton, Alert, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { TrendingUp, TrendingDown, Receipt, AccountBalance, AccountBalanceWallet } from '@mui/icons-material'
import { dailySummaryService, type DailySummaryResponse } from '@/services/daily-summary.service'
import { loansService } from '@/services/loans.service'
import { collectorWalletService } from '@/services/collector-wallet.service'
import collectionRoutesService, { type ExpenseCategory } from '@/services/collection-routes.service'
import { requestDeduplicator } from '@/lib/request-deduplicator'

// Dynamic imports to avoid SSR issues and chunk loading conflicts
const TodayLoansModal = dynamic(
  () => import('@/components/loans/TodayLoansModal'),
  { ssr: false }
)

const TodayCollectionsModal = dynamic(
  () => import('@/components/wallets/TodayCollectionsModal'),
  { ssr: false }
)

const TodayExpensesModal = dynamic(
  () => import('@/components/routes/TodayExpensesModal'),
  { ssr: false }
)

const formatCurrencyCompact = (amount: number) => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(abs)}`
}

export function ManagerDashboardCards() {
  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Today loans modal
  const [todayLoansModalOpen, setTodayLoansModalOpen] = useState(false)
  const [todayLoansData, setTodayLoansData] = useState<{
    date: string
    total: number
    totalAmount: number
    loans: Array<{
      montoTotalPrestado: number
      montoTotalADevolver: number
      nombrecliente: string
    }>
  } | null>(null)
  const [loadingTodayLoans, setLoadingTodayLoans] = useState(false)

  // Today collections modal
  const [todayCollectionsModalOpen, setTodayCollectionsModalOpen] = useState(false)
  const [todayCollectionsData, setTodayCollectionsData] = useState<{
    date: string | { requested?: string; start?: string; end?: string }
    collected: {
      total: number
      grossTotal: number
      count: number
      transactions: Array<{
        id: string
        amount: number
        description: string
        subLoanId: string
        createdAt: string
        payments?: Array<{
          id: string
          description: string
          amount: number
          paymentDate: string
          createdAt: string
        }>
      }>
    }
    resets: {
      total: number
      count: number
      transactions: Array<{
        id: string
        amount: number
        description: string
        subLoanId: string
        createdAt: string
      }>
    }
    user: {
      id: string
      fullName: string
      email: string
      role: string
    }
  } | null>(null)
  const [loadingTodayCollections, setLoadingTodayCollections] = useState(false)

  // Today expenses modal
  const [todayExpensesModalOpen, setTodayExpensesModalOpen] = useState(false)
  const [todayExpensesData, setTodayExpensesData] = useState<{
    date: string
    total: number
    totalAmount: number
    expenses: Array<{
      monto: number
      categoria: ExpenseCategory
      descripcion: string
      nombreManager: string
      emailManager: string
      fechaGasto: string
    }>
  } | null>(null)
  const [loadingTodayExpenses, setLoadingTodayExpenses] = useState(false)

  // Ref para prevenir llamadas duplicadas
  const hasFetchedRef = useRef(false)
  
  useEffect(() => {
    // Prevenir llamadas duplicadas
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    
    const loadDailySummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Usar deduplicador con caché de 30 segundos
        const data = await requestDeduplicator.dedupe(
          'manager:daily-summary',
          () => dailySummaryService.getOwnDailySummary(),
          { ttl: 30000 }
        )
        setDailySummary(data)
      } catch (err: any) {
        // Error loading daily summary
        setError(err.response?.data?.message || 'Error al cargar el resumen diario')
      } finally {
        setIsLoading(false)
      }
    }

    loadDailySummary()
  }, [])

  const handleOpenTodayLoans = async () => {
    setTodayLoansModalOpen(true)
    if (!todayLoansData) {
      setLoadingTodayLoans(true)
      try {
        const data = await loansService.getTodayLoans()
        setTodayLoansData(data)
      } catch (err) {
        // Error loading today loans
      } finally {
        setLoadingTodayLoans(false)
      }
    }
  }

  const handleCloseTodayLoans = () => {
    setTodayLoansModalOpen(false)
  }

  const handleOpenTodayCollections = async () => {
    setTodayCollectionsModalOpen(true)
    // Use dailySummary data directly since it already has all the collection data
    if (dailySummary) {
      // Transform dailySummary into the format expected by TodayCollectionsModal
      const collectionsData = {
        date: dailySummary.date || new Date().toISOString(),
        collected: dailySummary.collected || { total: 0, grossTotal: 0, count: 0, transactions: [] },
        resets: dailySummary.resets || { total: 0, count: 0, transactions: [] },
        user: dailySummary.user || { id: '', fullName: 'N/A', email: '', role: '' }
      }
      setTodayCollectionsData(collectionsData as any)
    }
  }

  const handleCloseTodayCollections = () => {
    setTodayCollectionsModalOpen(false)
  }

  const handleOpenTodayExpenses = async () => {
    setTodayExpensesModalOpen(true)
    if (!todayExpensesData) {
      setLoadingTodayExpenses(true)
      try {
        const data = await collectionRoutesService.getTodayExpenses()
        setTodayExpensesData(data)
      } catch (err) {
        // Error loading today expenses
      } finally {
        setLoadingTodayExpenses(false)
      }
    }
  }

  const handleCloseTodayExpenses = () => {
    setTodayExpensesModalOpen(false)
  }

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const neto = dailySummary?.neto !== undefined
    ? dailySummary.neto - (dailySummary?.ajusteCaja || 0)
    : (dailySummary?.summary?.netBalance || 0) - (dailySummary?.ajusteCaja || 0)

  const items = [
    {
      icon: <TrendingUp sx={{ fontSize: 20 }} />,
      label: 'Cobrado Hoy',
      value: dailySummary?.cobrado || dailySummary?.collected?.total || 0,
      subtitle: `${dailySummary?.collected?.count || 0} cobros`,
      color: 'success.main',
      onClick: handleOpenTodayCollections,
    },
    {
      icon: <AccountBalance sx={{ fontSize: 20 }} />,
      label: 'Prestado Hoy',
      value: dailySummary?.prestado || dailySummary?.loaned?.total || 0,
      subtitle: `${dailySummary?.loaned?.count || 0} préstamos`,
      color: 'primary.main',
      onClick: handleOpenTodayLoans,
    },
    {
      icon: <Receipt sx={{ fontSize: 20 }} />,
      label: 'Gastos Hoy',
      value: dailySummary?.gastado || dailySummary?.expenses?.total || 0,
      subtitle: `${dailySummary?.expenses?.count || 0} gastos`,
      color: 'warning.main',
      onClick: handleOpenTodayExpenses,
    },
    {
      icon: <AccountBalanceWallet sx={{ fontSize: 20 }} />,
      label: 'Retirado Hoy',
      value: dailySummary?.retirado || 0,
      subtitle: 'retiros del día',
      color: 'text.secondary',
      onClick: undefined,
    },
    {
      icon: <TrendingDown sx={{ fontSize: 20 }} />,
      label: 'Balance Neto',
      value: neto,
      subtitle: 'del día',
      color: neto >= 0 ? 'success.main' : 'error.main',
      onClick: undefined,
    },
  ]

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        Resumen de Hoy
      </Typography>
      <Paper sx={{ bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <List disablePadding>
          {items.map((item, i) => (
            <React.Fragment key={item.label}>
              <ListItem
                component="div"
                onClick={item.onClick}
                sx={{
                  py: 1.25,
                  px: 2,
                  cursor: item.onClick ? 'pointer' : 'default',
                  '&:hover': item.onClick ? { bgcolor: 'action.hover' } : {},
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={isLoading ? undefined : item.subtitle}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {isLoading ? (
                  <Skeleton variant="text" width={60} height={24} />
                ) : (
                  <Typography variant="body1" fontWeight={700} color={item.color}>
                    {formatCurrencyCompact(item.value)}
                  </Typography>
                )}
              </ListItem>
              {i < items.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Today Loans Modal */}
      <TodayLoansModal
        open={todayLoansModalOpen}
        onClose={handleCloseTodayLoans}
        data={todayLoansData}
      />

      {/* Today Collections Modal */}
      <TodayCollectionsModal
        open={todayCollectionsModalOpen}
        onClose={handleCloseTodayCollections}
        data={todayCollectionsData}
      />

      {/* Today Expenses Modal */}
      <TodayExpensesModal
        open={todayExpensesModalOpen}
        onClose={handleCloseTodayExpenses}
        data={todayExpensesData}
      />
    </Box>
  )
}
