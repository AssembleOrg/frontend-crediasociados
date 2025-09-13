'use client'

import React from 'react'
import { Box, Paper, Button, Alert } from '@mui/material'
import { People, AccountBalance } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useClients } from '@/hooks/useClients'
import { useSubLoans } from '@/hooks/useSubLoans'
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'

export default function PrestamistaDashboard() {
  const router = useRouter()
  const { getTotalClients, isLoading } = useClients()
  const { 
    getTotalDueToday,
    getOverdueCount,
    isLoading: subLoansLoading,
    error: subLoansError 
  } = useSubLoans()

  const clientsCount = getTotalClients()
  const dueToday = getTotalDueToday()
  const overdueCount = getOverdueCount()

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Dashboard Prestamista"
        subtitle="Gestión de clientes y préstamos de tu cartera"
      />

      {/* Stats Grid */}
      <StatsGrid columns={{ xs: 1, sm: 2, lg: 3 }}>
        <StatsCard
          title="Clientes Activos"
          value={clientsCount}
          subtitle={`cliente${clientsCount !== 1 ? 's' : ''} en tu cartera`}
          icon={<People />}
          color="primary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Vencimientos Hoy"
          value={dueToday}
          subtitle="préstamos que vencen hoy"
          icon={<AccountBalance />}
          color="warning"
          isLoading={subLoansLoading}
        />
      </StatsGrid>

      {/* Error de SubLoans */}
      {subLoansError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Box sx={{ typography: 'subtitle2' }}>Error al cargar vencimientos:</Box>
          <Box sx={{ typography: 'body2' }}>{subLoansError}</Box>
        </Alert>
      )}

      {/* Acceso Rápido a Cobros */}
      {dueToday > 0 && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'warning.light' }}>
          <Box sx={{ typography: 'h6', mb: 1 }}>
            ⚠️ Tienes {dueToday} pagos que vencen hoy
          </Box>
          <Box sx={{ typography: 'body2', mb: 2 }}>
            {overdueCount > 0 && `${overdueCount} están vencidos y requieren atención inmediata.`}
          </Box>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => router.push('/dashboard/prestamista/cobros')}
          >
            Ir a Gestión de Cobros
          </Button>
        </Paper>
      )}

      {/* Simulator */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ typography: 'h6', mb: 2 }}>
          Simulador de Préstamos
        </Box>
        <StandaloneLoanSimulator />
      </Paper>
    </Box>
  )
}