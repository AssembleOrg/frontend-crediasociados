'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, CircularProgress, Typography, Alert, Grid, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent } from '@mui/material'
import { ExpandMore, ExpandLess, Calculate, PersonOff } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useSubadminDashboardData } from '@/hooks/useSubadminDashboardData'
import { useSubadminCharts } from '@/hooks/useSubadminCharts'
import { ChartSkeleton, BarChartSkeleton } from '@/components/ui/ChartSkeleton'
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator'
import type { ManagerAnalytics } from '@/services/analytics.service'

// Dynamic import for InactiveClientsModal
const InactiveClientsModal = dynamic(
  () => import('@/components/clients/InactiveClientsModal'),
  { ssr: false }
)

// Lazy load charts to reduce initial bundle size
const ClientesPerAsociadoChart = dynamic(
  () => import('@/components/charts/ClientesPerAsociadoChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Clientes por Manager" />
  }
)

const ClientsEvolutionChart = dynamic(
  () => import('@/components/charts/ClientsEvolutionChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Clientes Nuevos por Semana" />
  }
)

const ManagerPerformanceChart = dynamic(
  () => import('@/components/charts/ManagerPerformanceChart'),
  {
    ssr: false,
    loading: () => <BarChartSkeleton title="Rendimiento por Manager" />
  }
)

export default function SubadminDashboard() {
  const {
    detailedManagers,
    isLoading,
    error
  } = useSubadminDashboardData()

  const chartData = useSubadminCharts()

  // Responsive logic for mobile
  const isMobile = useMediaQuery('(max-width:600px)')
  const [showAllCharts, setShowAllCharts] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [inactiveClientsModalOpen, setInactiveClientsModalOpen] = useState(false)

  const managersForChart: ManagerAnalytics[] = detailedManagers.map(manager => ({
    managerId: manager.id,
    managerName: manager.fullName,
    managerEmail: manager.email,
    totalClients: manager.totalClients,
    totalLoans: manager.totalLoans,
    totalAmountLent: manager.totalAmount,
    totalAmountPending: 0,
    collectionRate: 0,
    createdAt: new Date().toISOString()
  }))

  if (isLoading && detailedManagers.length === 0) {
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Dashboard de Cobrador"
          subtitle="Gestión de cobradores"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard de Cobrador"
        subtitle="Gestión de cobradores"
      />

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                Consulta los clientes sin préstamos activos de tus managers
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Mobile: ClientesPerAsociado first (always visible) */}
        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <ClientesPerAsociadoChart
              data={chartData.clientesPerManager}
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

        {/* Desktop or Mobile with showAllCharts: top row */}
        {(!isMobile || showAllCharts) && (
          <>
            {!isMobile && (
              <Grid size={{ xs: 12, lg: 6 }}>
                <ClientesPerAsociadoChart
                  data={chartData.clientesPerManager}
                  isLoading={isLoading}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, lg: 6 }}>
              <ClientsEvolutionChart
                data={chartData.clientsEvolution}
                isLoading={isLoading}
              />
            </Grid>
          </>
        )}

        {/* Desktop or Mobile with showAllCharts: ManagerPerformance */}
        {(!isMobile || showAllCharts) && (
          <Grid size={{ xs: 12 }}>
            <ManagerPerformanceChart
              managers={managersForChart}
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
    </Box>
  )
}