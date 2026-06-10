'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Grid, CircularProgress, Typography, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { ExpandMore, ExpandLess, Calculate, PersonOff, AccountBalance, ChevronRight, Close } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { ManagerDashboardCards } from '@/components/dashboard/ManagerDashboardCards'
import { NetoAjusteCajaCard } from '@/components/dashboard/NetoAjusteCajaCard'
import { usePrestamistaDashboardData } from '@/hooks/usePrestamistaDashboardData'
import { usePrestamistaCharts } from '@/hooks/usePrestamistaCharts'
import { useWallet } from '@/hooks/useWallet'
import { useManagerDashboard } from '@/hooks/useManagerDashboard'
import { ChartSkeleton, BarChartSkeleton } from '@/components/ui/ChartSkeleton'
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator'

// Dynamic import for InactiveClientsModal
const InactiveClientsModal = dynamic(
  () => import('@/components/clients/InactiveClientsModal'),
  { ssr: false }
)

// Dynamic import for ActiveLoansClientsModal
const ActiveLoansClientsModal = dynamic(
  () => import('@/components/clients/ActiveLoansClientsModal'),
  { ssr: false }
)

// Lazy load charts to reduce initial bundle size
const ClientsEvolutionChart = dynamic(
  () => import('@/components/charts/ClientsEvolutionChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Clientes Nuevos por Semana" />
  }
)

const LoansEvolutionChart = dynamic(
  () => import('@/components/charts/LoansEvolutionChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Préstamos Nuevos por Semana" />
  }
)

const PaymentsDistributionChart = dynamic(
  () => import('@/components/charts/PaymentsDistributionChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Distribución de Pagos" />
  }
)

export default function PrestamistaDashboard() {
  const {
    clients,
    loansEvolution,
    paymentsDistribution,
    isLoading
  } = usePrestamistaDashboardData()

  const chartData = usePrestamistaCharts(clients, loansEvolution, paymentsDistribution)

  // Wallet management

  // Manager dashboard data (for cards)
  const { data: managerData, isLoading: managerDataLoading } = useManagerDashboard()

  // Responsive logic for mobile
  const isMobile = useMediaQuery('(max-width:600px)')
  const [showAllCharts, setShowAllCharts] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [inactiveClientsModalOpen, setInactiveClientsModalOpen] = useState(false)
  const [activeLoansClientsModalOpen, setActiveLoansClientsModalOpen] = useState(false)

  if (isLoading && clients.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Cargando dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Dashboard Prestamista"
        subtitle="Gestión de clientes y préstamos de tu cartera"
      />

      {/* Manager Dashboard Cards */}
      <ManagerDashboardCards />

      {/* Neto con Ajuste de Caja Card */}
      <Box sx={{ mb: 3 }}>
        <NetoAjusteCajaCard />
      </Box>

      {/* Acciones rápidas */}
      <Paper sx={{ mb: 3, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <List disablePadding>
          <ListItem
            component="div"
            onClick={() => setInactiveClientsModalOpen(true)}
            sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PersonOff sx={{ fontSize: 20, color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText
              primary="Clientes Inactivos"
              secondary="Sin préstamos activos"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <ChevronRight sx={{ color: 'text.disabled' }} />
          </ListItem>
          <Divider component="li" />
          <ListItem
            component="div"
            onClick={() => setActiveLoansClientsModalOpen(true)}
            sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AccountBalance sx={{ fontSize: 20, color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText
              primary="Clientes con Préstamos Activos"
              secondary="Consulta tu cartera activa"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <ChevronRight sx={{ color: 'text.disabled' }} />
          </ListItem>
          <Divider component="li" />
          <ListItem
            component="div"
            onClick={() => setSimulatorOpen(true)}
            sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Calculate sx={{ fontSize: 20, color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText
              primary="Simulador de Préstamos"
              secondary="Calculá cuotas e intereses"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <ChevronRight sx={{ color: 'text.disabled' }} />
          </ListItem>
        </List>
      </Paper>

      <Grid container spacing={4}>
        {/* Mobile: PaymentsDistribution first (always visible) */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <PaymentsDistributionChart
              data={chartData.paymentsDistribution}
              isLoading={isLoading}
            />
          </Grid>
        )}

        {/* Mobile: "Ver Más" button */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1,
              mb: 1
            }}>
              <Button
                variant={showAllCharts ? 'outlined' : 'contained'}
                onClick={() => setShowAllCharts(!showAllCharts)}
                startIcon={showAllCharts ? <ExpandLess /> : <ExpandMore />}
                fullWidth
                sx={{ maxWidth: 400 }}
              >
                {showAllCharts ? 'Ocultar Estadísticas' : 'Ver Más Estadísticas'}
              </Button>
            </Box>
          </Grid>
        )}

        {/* Desktop or Mobile with showAllCharts: ClientsEvolution and LoansEvolution */}
        {(!isMobile || showAllCharts) && (
          <>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ClientsEvolutionChart
                data={chartData.clientsEvolution}
                isLoading={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <LoansEvolutionChart
                data={chartData.loansEvolution}
                isLoading={isLoading}
              />
            </Grid>
          </>
        )}

        {/* Desktop: PaymentsDistribution last */}
        {!isMobile && (
          <Grid size={{ xs: 12 }}>
            <PaymentsDistributionChart
              data={chartData.paymentsDistribution}
              isLoading={isLoading}
            />
          </Grid>
        )}
      </Grid>

      {/* Simulator Modal */}
      <Dialog
        open={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
            m: { xs: 1, sm: 2 },
            mt: { xs: 'auto', sm: 2 },
            width: { xs: '100%', sm: 'auto' },
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2, pt: 3, px: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Calculate sx={{ fontSize: 24, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>Simulador de Préstamos</Typography>
          </Box>
          <Button onClick={() => setSimulatorOpen(false)} size="small" variant="outlined">
            Cerrar
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <StandaloneLoanSimulator />
        </DialogContent>
      </Dialog>

      {/* Inactive Clients Modal */}
      <InactiveClientsModal
        open={inactiveClientsModalOpen}
        onClose={() => setInactiveClientsModalOpen(false)}
      />

      {/* Active Loans Clients Modal */}
      <ActiveLoansClientsModal
        open={activeLoansClientsModalOpen}
        onClose={() => setActiveLoansClientsModalOpen(false)}
      />
    </Box>
  )
}