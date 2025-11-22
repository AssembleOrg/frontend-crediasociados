'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, Typography, Box, Skeleton, Stack, Alert } from '@mui/material'
import { TrendingUp, TrendingDown, Receipt, AccountBalance, AccountBalanceWallet } from '@mui/icons-material'
import { dailySummaryService, type DailySummaryResponse } from '@/services/daily-summary.service'
import { loansService } from '@/services/loans.service'
import { collectorWalletService } from '@/services/collector-wallet.service'
import collectionRoutesService, { type ExpenseCategory } from '@/services/collection-routes.service'

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

interface StatCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: string
  isLoading: boolean
  onClick?: () => void
  clickable?: boolean
}

function StatCard({ title, value, subtitle, icon, color, isLoading, onClick, clickable = false }: StatCardProps) {
  const isNegative = value < 0
  const displayValue = Math.abs(value)

  return (
    <Card
      onClick={clickable ? onClick : undefined}
      sx={{
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: clickable ? 'pointer' : 'default',
        '&:hover': {
          transform: clickable ? 'translateY(-4px)' : 'translateY(-2px)',
          boxShadow: clickable ? '0 12px 28px rgba(0,0,0,0.15)' : '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>

        {isLoading ? (
          <>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={24} />
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: 'text.primary',
              }}
            >
              {isNegative && '-'}${displayValue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
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
    date: string
    total: number
    totalAmount: number
    collections: Array<{
      monto: number
      nombreUsuario: string
      emailUsuario: string
      descripcion: string
      fechaCobro: string
    }>
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

  useEffect(() => {
    const loadDailySummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await dailySummaryService.getOwnDailySummary()
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
    if (!todayCollectionsData) {
      setLoadingTodayCollections(true)
      try {
        const data = await collectorWalletService.getTodayCollections()
        setTodayCollectionsData(data)
      } catch (err) {
        // Error loading today collections
      } finally {
        setLoadingTodayCollections(false)
      }
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
      <Box sx={{ mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Resumen de Hoy
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        <StatCard
          title="Cobrado Hoy"
          value={dailySummary?.cobrado || dailySummary?.collected?.total || 0}
          subtitle={`${dailySummary?.collected?.count || 0} cobros realizados`}
          icon={<TrendingUp sx={{ fontSize: 28 }} />}
          color="#4caf50"
          isLoading={isLoading}
          clickable={true}
          onClick={handleOpenTodayCollections}
        />

        <StatCard
          title="Prestado Hoy"
          value={dailySummary?.prestado || dailySummary?.loaned?.total || 0}
          subtitle={`${dailySummary?.loaned?.count || 0} préstamos otorgados`}
          icon={<AccountBalance sx={{ fontSize: 28 }} />}
          color="#2196f3"
          isLoading={isLoading}
          clickable={true}
          onClick={handleOpenTodayLoans}
        />

        <StatCard
          title="Gastos Hoy"
          value={dailySummary?.gastado || dailySummary?.expenses?.total || 0}
          subtitle={`${dailySummary?.expenses?.count || 0} gastos registrados`}
          icon={<Receipt sx={{ fontSize: 28 }} />}
          color="#ff9800"
          isLoading={isLoading}
          clickable={true}
          onClick={handleOpenTodayExpenses}
        />

        <StatCard
          title="Retirado Hoy"
          value={dailySummary?.retirado || 0}
          subtitle="retiros del día"
          icon={<AccountBalanceWallet sx={{ fontSize: 28 }} />}
          color="#9c27b0"
          isLoading={isLoading}
        />

        <StatCard
          title="Balance Neto"
          value={
            (dailySummary?.neto !== undefined 
              ? dailySummary.neto - (dailySummary?.ajusteCaja || 0)
              : (dailySummary?.summary?.netBalance || 0) - (dailySummary?.ajusteCaja || 0)
            )
          }
          subtitle="del día"
          icon={<TrendingDown sx={{ fontSize: 28 }} />}
          color={
            (dailySummary?.neto !== undefined 
              ? dailySummary.neto - (dailySummary?.ajusteCaja || 0)
              : (dailySummary?.summary?.netBalance || 0) - (dailySummary?.ajusteCaja || 0)
            ) >= 0 ? "#4caf50" : "#f44336"
          }
          isLoading={isLoading}
        />
      </Stack>

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
