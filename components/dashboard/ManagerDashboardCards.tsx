'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Box, Skeleton, Stack, Alert } from '@mui/material'
import { TrendingUp, TrendingDown, Receipt, AccountBalance } from '@mui/icons-material'
import { dailySummaryService, type DailySummaryResponse } from '@/services/daily-summary.service'

interface StatCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: string
  isLoading: boolean
}

function StatCard({ title, value, subtitle, icon, color, isLoading }: StatCardProps) {
  const isNegative = value < 0
  const displayValue = Math.abs(value)

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
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

  useEffect(() => {
    const loadDailySummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await dailySummaryService.getOwnDailySummary()
        setDailySummary(data)
      } catch (err: any) {
        console.error('Error loading daily summary:', err)
        setError(err.response?.data?.message || 'Error al cargar el resumen diario')
      } finally {
        setIsLoading(false)
      }
    }

    loadDailySummary()
  }, [])

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
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        <StatCard
          title="Cobrado Hoy"
          value={dailySummary?.collected?.total || 0}
          subtitle={`${dailySummary?.collected?.count || 0} cobros realizados`}
          icon={<TrendingUp sx={{ fontSize: 28 }} />}
          color="#4caf50"
          isLoading={isLoading}
        />

        <StatCard
          title="Prestado Hoy"
          value={dailySummary?.loaned?.total || 0}
          subtitle={`${dailySummary?.loaned?.count || 0} préstamos otorgados`}
          icon={<AccountBalance sx={{ fontSize: 28 }} />}
          color="#2196f3"
          isLoading={isLoading}
        />

        <StatCard
          title="Gastos Hoy"
          value={dailySummary?.expenses?.total || 0}
          subtitle={`${dailySummary?.expenses?.count || 0} gastos registrados`}
          icon={<Receipt sx={{ fontSize: 28 }} />}
          color="#ff9800"
          isLoading={isLoading}
        />

        <StatCard
          title="Balance Neto"
          value={dailySummary?.summary?.netBalance || 0}
          subtitle="del día"
          icon={<TrendingDown sx={{ fontSize: 28 }} />}
          color={dailySummary?.summary?.netBalance && dailySummary.summary.netBalance >= 0 ? "#4caf50" : "#f44336"}
          isLoading={isLoading}
        />
      </Stack>
    </Box>
  )
}
