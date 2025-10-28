'use client'

import { Card, CardContent, Typography, Box, Skeleton, Stack } from '@mui/material'
import { AccountBalanceWallet, TrendingUp, Payment, ShowChart, Lock } from '@mui/icons-material'
import type { ManagerDashboardData } from '@/services/manager.service'

interface ManagerDashboardCardsProps {
  data: ManagerDashboardData | null
  isLoading: boolean
}

interface StatCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: string
  isLoading: boolean
}

function StatCard({ title, value, subtitle, icon, color, isLoading }: StatCardProps) {
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
              ${value.toLocaleString('es-AR')}
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

export function ManagerDashboardCards({ data, isLoading }: ManagerDashboardCardsProps) {
  // Calculate locked amount: Valor de Cartera - Capital Disponible
  const lockedAmount = (data?.valorCartera || 0) - (data?.capitalDisponible || 0)

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 3,
        }}
      >
        <StatCard
          title="Capital Disponible"
          value={data?.capitalDisponible || 0}
          subtitle="disponible para prestar"
          icon={<AccountBalanceWallet sx={{ fontSize: 28 }} />}
          color="#4caf50"
          isLoading={isLoading}
        />

        <StatCard
          title="Capital Asignado"
          value={data?.capitalAsignado || 0}
          subtitle="total asignado"
          icon={<Payment sx={{ fontSize: 28 }} />}
          color="#2196f3"
          isLoading={isLoading}
        />

        <StatCard
          title="Dinero Bloqueado"
          value={lockedAmount}
          subtitle="en préstamos activos"
          icon={<Lock sx={{ fontSize: 28 }} />}
          color="#f44336"
          isLoading={isLoading}
        />

        <StatCard
          title="Recaudado Este Mes"
          value={data?.recaudadoEsteMes || 0}
          subtitle="pagos recibidos"
          icon={<TrendingUp sx={{ fontSize: 28 }} />}
          color="#ff9800"
          isLoading={isLoading}
        />

        <StatCard
          title="Valor de Cartera"
          value={data?.valorCartera || 0}
          subtitle="valor total"
          icon={<ShowChart sx={{ fontSize: 28 }} />}
          color="#9c27b0"
          isLoading={isLoading}
        />
      </Stack>
    </Box>
  )
}

