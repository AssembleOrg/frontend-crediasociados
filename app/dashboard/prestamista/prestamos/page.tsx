'use client'

import { useEffect, useState } from 'react'
import { Box, Button, Alert,  } from '@mui/material'
import { Add} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useLoans } from '@/hooks/useLoans'
import { useSubLoans } from '@/hooks/useSubLoans'
import { useManagerDashboard } from '@/hooks/useManagerDashboard'
import { LoansTable } from '@/components/loans/LoansTable'
import { ExportButtons } from '@/components/export/ExportButtons'
import { LoansFilterPanel } from '@/components/filters/LoansFilterPanel'
import { useLoansFilters } from '@/hooks/useLoansFilters'
import { ManagerDashboardCards } from '@/components/dashboard/ManagerDashboardCards'

// New reusable components
import PageHeader from '@/components/ui/PageHeader'
import LoanDetailsModal from '@/components/loans/modals/LoanDetailsModal'

// Utilities
import { calculateLoanStats } from '@/lib/loans/loanCalculations'

export default function PrestamosAnalyticsPage() {
  const router = useRouter()
  const { loans, error, fetchLoans } = useLoans()
  const { allSubLoansWithClient, isLoading: subLoansLoading, fetchAllSubLoansWithClientInfo } = useSubLoans()
  const { filteredLoans, filterStats, hasActiveFilters } = useLoansFilters()
  const { data: managerData, isLoading: managerDataLoading, refetch: refetchManagerData } = useManagerDashboard()

  // Ensure first-time entry loads latest loans (hook no longer auto-inits)
  useEffect(() => {
    if (loans.length === 0) {
      fetchLoans()
    }
  }, [fetchLoans, loans.length])

  // Modal states
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)

  // Use filtered data for display when filters are active
  const displayLoans = hasActiveFilters ? filteredLoans : loans
  const displayStats = hasActiveFilters ? filterStats : calculateLoanStats(loans)

  const handleCreateLoan = () => {
    router.push('/dashboard/prestamista/prestamos/nuevo')
  }

  const handleGoToCobros = () => {
    router.push('/dashboard/prestamista/cobros')
  }

  const handleViewDetails = (loanId: string) => {
    setSelectedLoanId(loanId)
    setTimelineModalOpen(true)
  }

  const handleGoToCobrosForClient = () => {
    setTimelineModalOpen(false)
    router.push('/dashboard/prestamista/cobros')
  }

  // Get current loan and its subloans for modal
  const selectedLoan = selectedLoanId ? loans.find(loan => loan.id === selectedLoanId) || null : null
  const selectedLoanSubLoans = selectedLoanId 
    ? allSubLoansWithClient.filter(subloan => subloan.loanId === selectedLoanId)
    : []

  return (
    <Box sx={{ p: 3 }}>
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
          },
          // {
          //   label: 'Ir a Cobros', 
          //   onClick: handleGoToCobros,
          //   variant: 'contained',
          //   color: 'primary',
          //   size: 'small'
          // }
        ]}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tu Cartera Stats - Manager Dashboard Cards */}
      <ManagerDashboardCards />

      {/* Filter Panel */}
      <Box sx={{ mb: 3 }}>
        <LoansFilterPanel variant="expanded" />
      </Box>

      {/* Loans Table */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ typography: 'h6' }}>Tu Cartera de Préstamos</Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ExportButtons 
              filteredLoans={hasActiveFilters ? filteredLoans : undefined}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateLoan}
            >
              Nuevo Préstamo
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <LoansTable
          loans={displayLoans}
          onViewDetails={handleViewDetails}
          onLoanDeleted={refetchManagerData}
        />

        {/* Quick Actions */}
        {displayStats.total > 0 && (
          <Box
            sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard/prestamista/cobros')}
            >
              Ver Cobros del Día
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard/prestamista/clientes')}
            >
              Gestionar Clientes
            </Button>
          </Box>
        )}
      </Box>

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