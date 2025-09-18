'use client'

import React, { useEffect } from 'react'
import { Box, Alert, CircularProgress, Typography } from '@mui/material'
import {
  People
} from '@mui/icons-material'
import { useSubadminAnalytics } from '@/hooks/useSubadminAnalytics'
import { StatsCard } from '@/components/dashboard/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'
import ManagerStatsTable from '@/components/analytics/ManagerStatsTable'

export default function SubadminAnalyticsPage() {
  const {
    analytics,
    isLoading,
    isInitialized,
    error,
    initializeAnalytics,
    refreshAnalytics,
    clearError
  } = useSubadminAnalytics()

  // Auto-initialize analytics on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeAnalytics()
    }
  }, [isInitialized, initializeAnalytics])

  if (isLoading && !isInitialized) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Cargando datos de reportes...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Reportes"
          subtitle="Panel de métricas de tus managers"
        />
        <Alert
          severity="error"
          onClose={clearError}
          action={
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={refreshAnalytics}
            >
              Reintentar
            </Typography>
          }
        >
          {error}
        </Alert>
      </Box>
    )
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Reportes"
          subtitle="Panel de métricas de tus managers"
        />
        <Alert severity="info">
          No hay datos de reportes disponibles.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader
        title="Reportes"
        subtitle="Panel de métricas de tus managers"
      />

      {/* Loading overlay for refresh */}
      {isLoading && isInitialized && (
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'background.paper',
              opacity: 0.8,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CircularProgress size={24} />
          </Box>
        </Box>
      )}

      {/* Overview Stats */}
      <StatsGrid columns={{ xs: 1, sm: 1, lg: 1 }}>
        <StatsCard
          title="Total Prestamistas"
          value={analytics.totalManagers}
          subtitle={`${analytics.totalManagers === 1 ? 'prestamista' : 'prestamistas'} bajo tu gestión`}
          icon={<People />}
          color="primary"
        />
      </StatsGrid>

      {/* Info about data limitations */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          📊 <strong>Datos disponibles:</strong> Esta vista muestra los prestamistas que has creado.
          Los datos detallados de clientes y préstamos por prestamista estarán disponibles en futuras versiones.
        </Typography>
      </Alert>


      {/* Managers Detail Table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Lista de Prestamistas
        </Typography>
        <ManagerStatsTable
          managers={analytics.managers}
          isLoading={isLoading}
        />
      </Box>

      {/* Refresh Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Los datos se actualizan automáticamente.
          <Typography
            component="span"
            variant="caption"
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              ml: 1,
              color: 'primary.main'
            }}
            onClick={refreshAnalytics}
          >
            Actualizar ahora
          </Typography>
        </Typography>
      </Box>
    </Box>
  )
}