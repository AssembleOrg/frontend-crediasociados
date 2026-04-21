'use client'

import React, { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Box, CircularProgress, Typography, Alert, Grid, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton } from '@mui/material'
import { ExpandMore, ExpandLess, Calculate, PersonOff, AccountBalance, VerifiedUser, Warning, Block, ChevronRight, Close } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useSubadminStore } from '@/stores/subadmin'
import { useSubadminDashboardData } from '@/hooks/useSubadminDashboardData'
import { useSubadminCharts } from '@/hooks/useSubadminCharts'
import { ChartSkeleton, BarChartSkeleton } from '@/components/ui/ChartSkeleton'
import { StandaloneLoanSimulator } from '@/components/loans/StandaloneLoanSimulator'
import type { ManagerAnalytics } from '@/services/analytics.service'
import { clientsService } from '@/services/clients.service'

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
  const setPendingModal = useSubadminStore((s) => s.setPendingModal)
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
  const [unverifiedClientsCount, setUnverifiedClientsCount] = useState<number | null>(null)

  // Fix hydration: use useMemo to calculate createdAt only on client
  const managersForChart: ManagerAnalytics[] = useMemo(() => {
    // Use a fixed timestamp to avoid hydration mismatch
    const now = typeof window !== 'undefined' ? new Date().toISOString() : ''
    return detailedManagers.map(manager => ({
      managerId: manager.id,
      managerName: manager.fullName,
      managerEmail: manager.email,
      totalClients: manager.totalClients,
      totalLoans: manager.totalLoans,
      totalAmountLent: manager.totalAmount,
      totalAmountPending: 0,
      collectionRate: 0,
      createdAt: now
    }))
  }, [detailedManagers])

  // Load unverified clients count
  useEffect(() => {
    const loadUnverifiedCount = async () => {
      try {
        const data = await clientsService.getUnverifiedClients()
        setUnverifiedClientsCount(data.total || 0)
      } catch (error) {
        // Error loading unverified clients count
        setUnverifiedClientsCount(0)
      }
    }
    loadUnverifiedCount()
  }, [])


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
          title="Dashboard Subadmin"
          subtitle="Gestión de cobradores y managers"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const hasUnverified = unverifiedClientsCount !== null && unverifiedClientsCount > 0

  const actionItems = [
    {
      icon: (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <VerifiedUser sx={{ fontSize: 20 }} />
          {hasUnverified && (
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.5,
              }}
            >
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {unverifiedClientsCount! > 99 ? '99+' : unverifiedClientsCount}
              </Typography>
            </Box>
          )}
        </Box>
      ),
      label: 'Clientes No Verificados',
      color: 'warning.main' as const,
      onClick: () => setPendingModal('unverified'),
    },
    {
      icon: <PersonOff sx={{ fontSize: 20 }} />,
      label: 'Clientes Inactivos',
      color: 'text.disabled' as const,
      onClick: () => setPendingModal('inactive'),
    },
    {
      icon: <Warning sx={{ fontSize: 20 }} />,
      label: 'Clientes con Cuotas Vencidas',
      color: 'error.main' as const,
      onClick: () => setPendingModal('overdue'),
    },
    // commented by july
    // {
    //   icon: <Block sx={{ fontSize: 20 }} />,
    //   label: 'Lista Negra',
    //   color: 'text.secondary' as const,
    //   onClick: () => setPendingModal('blacklist'),
    // },
    {
      icon: <AccountBalance sx={{ fontSize: 20 }} />,
      label: 'Clientes con Préstamos Activos',
      color: 'primary.main' as const,
      onClick: () => setPendingModal('activeloans'),
    },
  ]

  return (
    <Box sx={{ p: 3, bgcolor: '#F2F2F7', minHeight: '100vh' }}>
      <PageHeader
        title="Dashboard Subadmin"
        subtitle="Gestión de cobradores y managers"
      />

      {/* Simulator Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Calculate />}
          onClick={() => setSimulatorOpen(true)}
        >
          Abrir Simulador de Préstamos
        </Button>
      </Box>

      {/* Quick Actions - Grouped List */}
      <Paper sx={{ mb: 4, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <List disablePadding>
          {actionItems.map((item, index, array) => (
            <React.Fragment key={item.label}>
              <ListItem
                component='div'
                onClick={item.onClick}
                sx={{
                  py: 1.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.2s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: 20 }} />
              </ListItem>
              {index < array.length - 1 && <Divider component='li' />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

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
            borderRadius: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
            m: { xs: 1, sm: 2 },
            mt: { xs: 'auto', sm: 2 },
            width: { xs: '100%', sm: 'auto' },
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Calculate sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={600}>Simulador de Préstamos</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSimulatorOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <StandaloneLoanSimulator />
          </Box>
        </DialogContent>
      </Dialog>

    </Box>
  )
}