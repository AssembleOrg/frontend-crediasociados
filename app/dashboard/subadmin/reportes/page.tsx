'use client'

import React from 'react'
import { Box, Alert, CircularProgress, Typography } from '@mui/material'
import { People } from '@mui/icons-material'
import { useSubadminReportsWithFilters } from '@/hooks/useSubadminReportsWithFilters'
import { useAuth } from '@/hooks/useAuth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import StatsGrid from '@/components/ui/StatsGrid'
import ManagerStatsTable from '@/components/analytics/ManagerStatsTable'
import SubadminFiltersAndExport from '@/components/charts/SubadminFiltersAndExport'
import { exportService } from '@/services/export.service'
import type { SubadminReportsData } from '@/types/export'

export default function SubadminAnalyticsPage() {
  const { user } = useAuth()
  const {
    analytics,
    isLoading,
    isInitialized,
    error,
    clearError,
    refreshAnalytics,
    filteredManagers,
    filteredTotals,
    selectedManager,
    setSelectedManager,
    managerOptions,
    exportDetailedData,
    timeFilter,
    dateRange,
    setTimeFilter,
    setCustomDateRange,
    hasManagers
  } = useSubadminReportsWithFilters()

  const handlePdfExport = async () => {
    if (!analytics || !user) {
      alert('No hay datos disponibles para exportar')
      return
    }

    try {
      const managersForExport = selectedManager
        ? analytics.managers.filter(m => m.managerId === selectedManager)
        : analytics.managers

      const reportsData: SubadminReportsData = {
        totalManagers: managersForExport.length,
        totalClients: managersForExport.reduce((sum, m) => sum + m.totalClients, 0),
        totalLoans: managersForExport.reduce((sum, m) => sum + m.totalLoans, 0),
        totalAmountLent: managersForExport.reduce((sum, m) => sum + m.totalAmountLent, 0),
        managers: managersForExport.map(manager => ({
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
      link.download = `subadmin-reportes${selectedManager ? '-filtrado' : ''}-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
    }
  }

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
      <PageHeader
        title="Reportes"
        subtitle="Panel de métricas de tus managers"
      />

      {hasManagers && (
        <SubadminFiltersAndExport
          currentFilter={timeFilter}
          dateRange={dateRange}
          onFilterChange={setTimeFilter}
          onCustomDateChange={setCustomDateRange}
          selectedManager={selectedManager}
          managerOptions={managerOptions}
          onManagerChange={setSelectedManager}
          onExportExcel={exportDetailedData}
          onExportPdf={handlePdfExport}
          isLoading={isLoading}
          dataCount={{
            totalManagers: filteredTotals.totalManagers,
            totalClients: filteredTotals.totalClients
          }}
        />
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

      <StatsGrid columns={{ xs: 2, sm: 2, lg: filteredTotals.totalLoans > 0 ? 4 : 2 }}>
        <StatsCard
          title="Cobradores"
          value={filteredTotals.totalManagers}
          subtitle={`${filteredTotals.totalManagers === 1 ? 'cobrador' : 'cobradores'}`}
          icon={<People />}
          color="primary"
        />

        <StatsCard
          title="Clientes"
          value={filteredTotals.totalClients}
          subtitle={`${filteredTotals.totalClients === 1 ? 'cliente' : 'clientes'}`}
          icon={<People />}
          color="primary"
        />

        {filteredTotals.totalLoans > 0 && (
          <>
            <StatsCard
              title="Préstamos"
              value={filteredTotals.totalLoans}
              subtitle={`${filteredTotals.totalLoans === 1 ? 'préstamo' : 'préstamos'}`}
              icon={<People />}
              color="success"
            />

            <StatsCard
              title="Dinero Prestado"
              value={`$${filteredTotals.totalAmountLent.toLocaleString()}`}
              subtitle="monto total prestado"
              icon={<People />}
              color="success"
            />
          </>
        )}
      </StatsGrid>


      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Lista de Cobradores
        </Typography>
        <ManagerStatsTable
          managers={filteredManagers}
          isLoading={isLoading}
        />
      </Box>

    </Box>
  )
}