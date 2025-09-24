'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useAdminReportsWithFilters } from '@/hooks/useAdminReportsConsumer'
import BaseReportLayout from '@/components/reports/BaseReportLayout'
import BaseReportCard from '@/components/reports/BaseReportCard'
import AdminFiltersAndExport from '@/components/charts/AdminFiltersAndExport'

export default function AdminReportsPage() {
  const {
    // Reports data
    reports,
    reportsLoading,
    reportsError,
    refreshReports,
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

  // Provider auto-initializes data - no useEffect needed

  const getInfoMessage = () => {
    if (reports && reports.totalLoans > 0) {
      return "✅ Datos consolidados: Se muestran las métricas de tus subadministradores y prestamistas."
    }
    return "📊 Vista de gestión: Panel de control administrativo con métricas consolidadas."
  }


  // Calculate data counts for filters component
  const dataCount = {
    totalSubadmins: detailedData.length > 0 ? detailedData.length : basicData.length,
    totalManagers: (detailedData.length > 0 ? detailedData : basicData).reduce((sum, s) => sum + s.managersCount, 0),
    totalClients: detailedData.reduce((sum, s) => sum + (s.totalClients || 0), 0)
  }

  // Additional real data cards for admin reports
  const additionalCards = reports && reports.totalLoans > 0 ? (
    <>
      <BaseReportCard
        title="Promedio por Sub-Admin"
        value={`$${reports.totalUsers > 0 ? Math.round(reports.totalAmountLent / reports.totalUsers).toLocaleString() : 0}`}
        subtitle="monto promedio gestionado"
        color="info"
        isLoading={reportsLoading}
      />

      <BaseReportCard
        title="Dinero Pendiente"
        value={`$${reports.totalAmountPending.toLocaleString()}`}
        subtitle="monto por cobrar"
        color="warning"
        isLoading={reportsLoading}
      />
    </>
  ) : null

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reportes Administrativos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de gestión y exportación de datos de subadministradores
        </Typography>
      </Box>

      {/* Filters and Export */}
      <AdminFiltersAndExport
        currentFilter={timeFilter}
        dateRange={dateRange}
        onFilterChange={setTimeFilter}
        onCustomDateChange={setCustomDateRange}
        selectedSubadmin={selectedSubadmin}
        subadminOptions={subadminOptions}
        onSubadminChange={setSelectedSubadmin}
        onRefresh={refreshReports}
        onExport={exportDetailedData}
        isLoading={isAnyLoading}
        dataCount={isInitialized ? dataCount : undefined}
      />

      <BaseReportLayout
        title=""
        subtitle=""
        metrics={reports || undefined}
        users={reports?.subadmins || []}
        userTypeLabel="Subadmin"
        isLoading={reportsLoading}
        isInitialized={!!reports}
        error={reportsError}
        onRefresh={refreshReports}
        onClearError={clearReportsError}
        infoMessage={getInfoMessage()}
        successCondition={reports ? reports.totalLoans > 0 : false}
        additionalCards={additionalCards}
      />
    </Box>
  )
}