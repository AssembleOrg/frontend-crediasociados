'use client'

import React from 'react'
import { Box, Alert, CircularProgress, Typography } from '@mui/material'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'
import BaseReportCard from './BaseReportCard'
import BaseReportTable from './BaseReportTable'
import type { BaseReportMetrics, UserReportData } from '@/services/reports.service'

interface BaseReportLayoutProps {
  // Header props
  title: string
  subtitle: string

  // Data props
  metrics?: BaseReportMetrics
  users: UserReportData[]
  userTypeLabel: string // "Subadmin" or "Prestamista"

  // State props
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  onRefresh?: () => void
  onClearError: () => void

  // Optional customization
  additionalCards?: React.ReactNode
  infoMessage?: string
  successCondition?: boolean
}

/**
 * Base Report Layout Component
 * Reusable layout for admin and subadmin reports
 */
export default function BaseReportLayout({
  title,
  subtitle,
  metrics,
  users,
  userTypeLabel,
  isLoading,
  isInitialized,
  error,
  onRefresh,
  onClearError,
  additionalCards,
  infoMessage,
  successCondition = false
}: BaseReportLayoutProps) {

  // Loading state
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

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title={title} subtitle={subtitle} />
        <Alert
          severity="error"
          onClose={onClearError}
          action={
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onRefresh}
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

  // No data state
  if (!metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title={title} subtitle={subtitle} />
        <Alert severity="info">
          No hay datos de reportes disponibles.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeader title={title} subtitle={subtitle} />

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

      {/* Main Stats */}
      <StatsGrid columns={{ xs: 1, sm: 2, lg: metrics.totalLoans > 0 ? 3 : 2 }}>
        <BaseReportCard
          title={`Total ${userTypeLabel}s`}
          value={metrics.totalUsers}
          subtitle={`${metrics.totalUsers === 1 ? userTypeLabel.toLowerCase() : userTypeLabel.toLowerCase() + 's'} bajo gestión`}
          color="primary"
          isLoading={isLoading}
        />

        <BaseReportCard
          title="Préstamos Activos"
          value={metrics.totalLoans}
          subtitle={`${metrics.totalLoans === 1 ? 'préstamo activo' : metrics.totalLoans === 0 ? 'sin préstamos' : 'préstamos activos'}`}
          color={metrics.totalLoans > 0 ? "success" : "primary"}
          isLoading={isLoading}
        />

        {/* Show additional financial metrics only if there's loan data */}
        {metrics.totalLoans > 0 && (
          <BaseReportCard
            title="Dinero Prestado"
            value={`$${metrics.totalAmountLent.toLocaleString()}`}
            subtitle="monto total prestado"
            color="success"
            isLoading={isLoading}
          />
        )}

        {/* Additional custom cards */}
        {additionalCards}
      </StatsGrid>

      {/* Info Message */}
      {infoMessage && (
        <Alert severity={successCondition ? "success" : "info"} sx={{ mt: 3 }}>
          <Typography variant="body2">
            {infoMessage}
          </Typography>
        </Alert>
      )}

      {/* Users Table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Detalle por {userTypeLabel}
        </Typography>
        <BaseReportTable
          users={users}
          userTypeLabel={userTypeLabel}
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
            onClick={onRefresh}
          >
            Actualizar ahora
          </Typography>
        </Typography>
      </Box>
    </Box>
  )
}