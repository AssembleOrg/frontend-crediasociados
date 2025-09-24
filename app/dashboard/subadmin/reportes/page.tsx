'use client'

import React, { useEffect } from 'react'
import { Box, Alert, CircularProgress, Typography, Paper, Button, ButtonGroup } from '@mui/material'
import {
  People,
  FileDownload,
  PictureAsPdf
} from '@mui/icons-material'
import { useSubadminAnalytics } from '@/hooks/useSubadminAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'
import ManagerStatsTable from '@/components/analytics/ManagerStatsTable'
import { exportService } from '@/services/export.service'
import type { SubadminReportsData } from '@/types/export'

export default function SubadminAnalyticsPage() {
  const { user } = useAuth()
  const {
    analytics,
    isLoading,
    isInitialized,
    error,
    initializeAnalytics,
    refreshAnalytics,
    clearError
  } = useSubadminAnalytics()

  // Export service instance (already instantiated)
  // const exportService is imported

  // Excel Export function
  const handleExcelExport = () => {
    if (!analytics) {
      alert('No hay datos disponibles para exportar')
      return
    }

    // Create CSV content
    const csvRows = []

    // Headers
    csvRows.push('Manager,Email,Clientes,Prestamos,Monto Total,Fecha Registro')

    // Data rows
    analytics.managers.forEach(manager => {
      csvRows.push([
        manager.managerName,
        manager.managerEmail,
        manager.totalClients,
        manager.totalLoans,
        manager.totalAmountLent,
        new Date(manager.createdAt).toLocaleDateString('es-AR')
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subadmin-reportes-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // PDF Export function
  const handlePdfExport = async () => {
    if (!analytics || !user) {
      alert('No hay datos disponibles para exportar')
      return
    }

    try {
      // Transform data to match SubadminReportsData format
      const reportsData: SubadminReportsData = {
        totalManagers: analytics.totalManagers,
        totalClients: analytics.totalClients,
        totalLoans: analytics.totalLoans,
        totalAmountLent: analytics.totalAmountLent,
        managers: analytics.managers.map(manager => ({
          id: manager.managerId,
          name: manager.managerName,
          email: manager.managerEmail,
          totalClients: manager.totalClients,
          totalLoans: manager.totalLoans,
          totalAmountLent: manager.totalAmountLent,
          createdAt: manager.createdAt
        }))
      }

      const pdfBlob = await exportService.generateSubadminReportsPDF(reportsData, user.fullName || user.email)

      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `subadmin-reportes-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
    }
  }

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

      {/* Export Section */}
      {analytics && analytics.managers.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Exportación de Datos
            </Typography>
            <ButtonGroup variant="contained">
              <Button
                onClick={handleExcelExport}
                startIcon={<FileDownload />}
                disabled={isLoading}
                sx={{ minWidth: 120 }}
              >
                Excel
              </Button>
              <Button
                onClick={handlePdfExport}
                startIcon={<PictureAsPdf />}
                color="secondary"
                disabled={isLoading}
                sx={{ minWidth: 120 }}
              >
                PDF
              </Button>
            </ButtonGroup>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Exporta los datos de tus {analytics.managers.length} {analytics.managers.length === 1 ? 'prestamista' : 'prestamistas'}
          </Typography>
        </Paper>
      )}

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
      <StatsGrid columns={{ xs: 1, sm: 2, lg: analytics.totalLoans > 0 ? 4 : 2 }}>
        <StatsCard
          title="Total Prestamistas"
          value={analytics.totalManagers}
          subtitle={`${analytics.totalManagers === 1 ? 'prestamista' : 'prestamistas'} bajo tu gestión`}
          icon={<People />}
          color="primary"
        />

        <StatsCard
          title="Total Clientes"
          value={analytics.totalClients}
          subtitle={`${analytics.totalClients === 1 ? 'cliente activo' : 'clientes activos'}`}
          icon={<People />}
          color="primary"
        />

        {/* Show additional metrics if there's real loan data */}
        {analytics.totalLoans > 0 && (
          <>
            <StatsCard
              title="Total Préstamos"
              value={analytics.totalLoans}
              subtitle={`${analytics.totalLoans === 1 ? 'préstamo activo' : 'préstamos activos'}`}
              icon={<People />}
              color="success"
            />

            <StatsCard
              title="Dinero Prestado"
              value={`$${analytics.totalAmountLent.toLocaleString()}`}
              subtitle="monto total prestado"
              icon={<People />}
              color="success"
            />
          </>
        )}
      </StatsGrid>

      {/* Status Info */}
      {analytics.totalLoans > 0 && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            ✅ <strong>Datos disponibles:</strong> Se muestran tus prestamistas creados y préstamos activos.
          </Typography>
        </Alert>
      )}


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