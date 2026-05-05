'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Alert, CircularProgress } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'
import { useManagerDashboard } from '@/hooks/useManagerDashboard'
import { LoansTable } from '@/components/loans/LoansTable'
import { ExportButtons } from '@/components/export/ExportButtons'
import { LoansFilterPanel } from '@/components/filters/LoansFilterPanel'
import { useLoansFilters } from '@/hooks/useLoansFilters'
// New reusable components
import PageHeader from '@/components/ui/PageHeader'
import LoanDetailsModal from '@/components/loans/modals/LoanDetailsModal'


export default function PrestamosAnalyticsPage() {
  const router = useRouter()
  const { loans, error, isLoading, fetchLoans } = useLoans()
  const { allSubLoansWithClient, isLoading: subLoansLoading, fetchAllSubLoansWithClientInfo } = useSubLoans()
  const { filteredLoans, hasActiveFilters, isLoading: filtersLoading, error: filtersError } = useLoansFilters()
  const { refetch: refetchManagerData } = useManagerDashboard()
  
  // Load loans + subloans when this page mounts
  const hasFetched = useRef(false)
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchLoans()
    fetchAllSubLoansWithClientInfo()
  }, [])

  // Modal states
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)

  // Use filtered data for display when filters are active
  const displayLoans = hasActiveFilters ? filteredLoans : loans

  const handleCreateLoan = () => {
    router.push('/dashboard/prestamista/prestamos/nuevo')
  }

  const handleViewDetails = (loanId: string) => {
    setSelectedLoanId(loanId)
    setTimelineModalOpen(true)
    // Load subloans only when modal opens (lazy loading)
    fetchAllSubLoansWithClientInfo()
  }

  const handleGoToCobrosForClient = () => {
    setTimelineModalOpen(false)
    router.push('/dashboard/prestamista/cobros')
  }

  // Get current loan and its subloans for modal
  // Search in filtered loans if filters are active, otherwise in all loans
  const loansToSearch = hasActiveFilters ? filteredLoans : loans
  const selectedLoan = selectedLoanId ? loansToSearch.find(loan => loan.id === selectedLoanId) || null : null
  const selectedLoanSubLoans = selectedLoanId 
    ? allSubLoansWithClient.filter(subloan => subloan.loanId === selectedLoanId)
    : []

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <PageHeader
        title="Análisis de Cartera"
        subtitle="Dashboard analítico con reportes históricos y métricas de rendimiento"
        actions={[
          {
            label: 'Nuevo Préstamo',
            onClick: handleCreateLoan,
            variant: 'contained',
            color: 'secondary',
            startIcon: <Add />,
            size: 'small'
          }
        ]}
      />

      {/* Error Alert */}
      {(error || filtersError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || filtersError}
        </Alert>
      )}

      {/* Loading Indicator */}
      {(isLoading || filtersLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Filter Panel */}
      {!isLoading && (
        <Box sx={{ mb: 1.5 }}>
          <LoansFilterPanel variant="expanded" />
        </Box>
      )}

      {/* Loans Table */}
      {!isLoading && !filtersLoading && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <ExportButtons
              filteredLoans={hasActiveFilters ? filteredLoans : undefined}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <LoansTable
            loans={displayLoans}
            onViewDetails={handleViewDetails}
            onLoanDeleted={refetchManagerData}
          />
        </Box>
      )}

      {/* Loan Details Modal */}
      <LoanDetailsModal
        open={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        loan={selectedLoan}
        subLoans={selectedLoanSubLoans}
        isLoading={subLoansLoading}
        onGoToCobros={handleGoToCobrosForClient}
        onPaymentSuccess={() => {
          // Refrescar los datos después de un pago exitoso
          fetchAllSubLoansWithClientInfo()
          // Refrescar préstamos para mantener el resumen/estado actualizado
          fetchLoans()
        }}
      />
    </Box>
  )
}