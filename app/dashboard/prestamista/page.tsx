'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Grid, CircularProgress, Typography, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent } from '@mui/material'
import { ExpandMore, ExpandLess, Calculate, PersonOff, AccountBalance } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { ManagerDashboardCards } from '@/components/dashboard/ManagerDashboardCards'
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
    loans,
    subLoans,
    isLoading
  } = usePrestamistaDashboardData()

  const chartData = usePrestamistaCharts(clients, loans, subLoans)

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
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard Prestamista"
        subtitle="Gestión de clientes y préstamos de tu cartera"
      />

      {/* Wallet Balance Section */}
      {/* <Box sx={{ mb: 4 }}>
        <WalletBalanceCard
          wallet={wallet}
          isLoading={walletIsLoading}
          onRefresh={refetchWallet}
          showDetails={true}
        />
      </Box> */}

      {/* Manager Dashboard Cards */}
      <ManagerDashboardCards />

      {/* Inactive Clients Card */}
      <Card
        sx={{
          mb: 3,
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: 'linear-gradient(135deg, #85220D 0%, #A03015 100%)',
          color: 'white',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(133, 34, 13, 0.3)',
          },
        }}
        onClick={() => setInactiveClientsModalOpen(true)}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            >
              <PersonOff sx={{ fontSize: 32 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Clientes Inactivos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Consulta tus clientes sin préstamos activos
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Active Loans Clients Card */}
      <Card
        sx={{
          mb: 3,
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(25, 118, 210, 0.3)',
          },
        }}
        onClick={() => setActiveLoansClientsModalOpen(true)}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            >
              <AccountBalance sx={{ fontSize: 32 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Clientes con Préstamos Activos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Consulta tus clientes con préstamos activos
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Simulator Button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Calculate />}
          onClick={() => setSimulatorOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #3d8bfe 100%)',
            },
          }}
        >
          Abrir Simulador de Préstamos
        </Button>
      </Box>

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
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          Simulador de Préstamos
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <StandaloneLoanSimulator />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setSimulatorOpen(false)}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
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