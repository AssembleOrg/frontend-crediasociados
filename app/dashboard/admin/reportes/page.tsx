'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useAdminReportsWithFilters } from '@/hooks/useAdminReportsWithFilters'
import BaseReportLayout from '@/components/reports/BaseReportLayout'
import AdminFiltersAndExport from '@/components/charts/AdminFiltersAndExport'
import { exportService } from '@/services/export.service'
import type { AdminReportsData } from '@/types/export'

export default function AdminReportsPage() {
  const {
    // Reports data
    reports,
    reportsLoading,
    reportsError,
    clearReportsError,

    // Progressive dashboard data for filtering
    basicData,
    detailedData,
    isInitialized,
    timeFilter,
    dateRange,
    setTimeFilter,
    setCustomDateRange,

    // Filter functionality
    selectedSubadmin,
    setSelectedSubadmin,
    subadminOptions,
    exportDetailedData,

    // Combined states
    isAnyLoading
  } = useAdminReportsWithFilters()

  const handlePdfExport = async () => {
    if (!reports) {
      alert('No hay datos disponibles para exportar')
      return
    }

    try {
      const dataToExport: AdminReportsData = selectedSubadmin
        ? {
            ...reports,
            subadmins: reports.subadmins.filter(subadmin => subadmin.userId === selectedSubadmin),
            totalUsers: 1,
            totalClients: reports.subadmins.find(s => s.userId === selectedSubadmin)?.totalClients || 0,
            totalLoans: reports.subadmins.find(s => s.userId === selectedSubadmin)?.totalLoans || 0,
            totalAmountLent: 0,
          }
        : reports

      const pdfBlob = await exportService.generateAdminReportsPDF(dataToExport)

      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `admin-reportes-${selectedSubadmin ? 'filtrado-' : ''}${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
    }
  }

  const dataCount = {
    totalSubadmins: detailedData.length > 0 ? detailedData.length : basicData.length,
    totalManagers: (detailedData.length > 0 ? detailedData : basicData).reduce((sum, s) => sum + s.managersCount, 0),
    totalClients: detailedData.reduce((sum, s) => sum + (s.totalClients || 0), 0)
  }

  const additionalCards = null

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reportes Administrativos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de gestión y exportación de datos de asociados
        </Typography>
      </Box>

      <AdminFiltersAndExport
        currentFilter={timeFilter}
        dateRange={dateRange}
        onFilterChange={setTimeFilter}
        onCustomDateChange={setCustomDateRange}
        selectedSubadmin={selectedSubadmin}
        subadminOptions={subadminOptions}
        onSubadminChange={setSelectedSubadmin}
        onExportExcel={exportDetailedData}
        onExportPdf={handlePdfExport}
        isLoading={isAnyLoading}
        dataCount={isInitialized ? dataCount : undefined}
      />

      <BaseReportLayout
        title=""
        subtitle=""
        metrics={reports || undefined}
        users={reports?.subadmins || []}
        userTypeLabel="Asociado"
        isLoading={reportsLoading}
        isInitialized={!!reports}
        error={reportsError}
        onClearError={clearReportsError}
        successCondition={reports ? reports.totalLoans > 0 : false}
        additionalCards={additionalCards}
        hideAmounts={true}
        showManagers={true}
      />
    </Box>
  )
}