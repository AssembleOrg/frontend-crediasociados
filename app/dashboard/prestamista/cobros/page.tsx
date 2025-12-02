'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useSubLoans } from '@/hooks/useSubLoans'
import {
  Box,
  Paper,
  Typography,
  TablePagination,
  Alert
} from '@mui/material'
import { Payment } from '@mui/icons-material'

import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { CobrosFilterPanel } from '@/components/filters/CobrosFilterPanel'
import { useCobrosFilters } from '@/hooks/useCobrosFilters'

// Extracted components
import CobrosHeader from '@/components/cobros/CobrosHeader'
import StatsCards from '@/components/cobros/StatsCards'
import UrgencyLegend from '@/components/cobros/UrgencyLegend'
import ClientSummaryCard from '@/components/cobros/ClientSummaryCard'

// Lazy load heavy modals (only load when needed)
const PaymentModal = dynamic(() => import('@/components/loans/PaymentModal'), { ssr: false })
const EditPaymentModal = dynamic(() => import('@/components/cobros/modals/EditPaymentModal'), { ssr: false })
const OverduePaymentsModal = dynamic(() => import('@/components/cobros/modals/OverduePaymentsModal'), { ssr: false })
const ClientTimelineModal = dynamic(() => import('@/components/cobros/modals/ClientTimelineModal'), { ssr: false })

// Extracted utilities
import { getUrgencyLevel } from '@/lib/cobros/urgencyHelpers'
import { getClientsSummary, getStatusStats, type ClientSummary } from '@/lib/cobros/clientSummaryHelpers'

// Type guard to check if stats is filtered stats or legacy stats
interface FilteredStats {
  total: number
  totalAmount: number
  byStatus: {
    overdue: number
    today: number
    soon: number
    upcoming: number
    paid: number
  }
  notifiedCount: number
}

interface LegacyStats {
  total: number
  completed: number
  partial: number
  pending: number
  overdue: number
  canceled: number
  totalExpected: number
  totalCollected: number
}

function isFilteredStats(stats: FilteredStats | LegacyStats): stats is FilteredStats {
  return 'byStatus' in stats && 'notifiedCount' in stats
}

export default function CobrosPage() {
  const pathname = usePathname()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const {
    allSubLoansWithClient,
    fetchAllSubLoansWithClientInfo,
  } = useSubLoans()

  // ✅ Refetch data when page mounts or route changes
  useEffect(() => {
    // Cobros page mounted/changed
    
    // Always fetch on mount to ensure fresh data
    // The hook itself will prevent duplicate calls if already loading
    // Fetching latest subloans data
    fetchAllSubLoansWithClientInfo()
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only depend on pathname to avoid infinite loops
  
  // Filtering system
  const { 
    filteredClientsSummary, 
    filterStats, 
    hasActiveFilters,
    markClientAsNotified,
    markClientAsPending,
    isClientNotified
  } = useCobrosFilters()

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentModalMode, setPaymentModalMode] = useState<'single' | 'selector'>('single')
  const [selectedPaymentSubloan, setSelectedPaymentSubloan] = useState<SubLoanWithClientInfo | null>(null)
  const [selectedPaymentClient, setSelectedPaymentClient] = useState<ClientSummary | null>(null)
  const [dayLocked, setDayLocked] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [overdueModalOpen, setOverdueModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Use filtered data when filters are active (memoized)
  const displayClientsSummary = useMemo(() =>
    hasActiveFilters ? filteredClientsSummary : getClientsSummary(allSubLoansWithClient),
    [hasActiveFilters, filteredClientsSummary, allSubLoansWithClient]
  )

  const paginatedClients = useMemo(() =>
    displayClientsSummary.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [displayClientsSummary, page, rowsPerPage]
  )

  const overduePayments = useMemo(() =>
    allSubLoansWithClient.filter(p => p.dueDate && getUrgencyLevel(p.dueDate) === 'overdue'),
    [allSubLoansWithClient]
  )

  // Use filtered stats when filters are active, otherwise use all data (memoized)
  const displayStats = useMemo(() =>
    hasActiveFilters ? filterStats : getStatusStats(allSubLoansWithClient),
    [hasActiveFilters, filterStats, allSubLoansWithClient]
  )

  // Event handlers
  const handleViewClientDetails = (clientSummary: ClientSummary) => {
    setSelectedClient(clientSummary.clientId)
    setDetailsModalOpen(true)
  }

  const handlePaymentClick = (subloan: SubLoanWithClientInfo) => {
    if (dayLocked) return
    
    setSelectedPaymentSubloan(subloan)
    setPaymentModalMode('single')
    setPaymentModalOpen(true)
  }

  const handleRegisterPaymentClick = (clientSummary: ClientSummary) => {
    if (dayLocked) return
    
    setSelectedPaymentClient(clientSummary)
    setPaymentModalMode('selector')
    setPaymentModalOpen(true)
  }

  const handleSavePayment = (paymentData: { id: string; paidAmount: number; status: string; notes: string }) => {
    // TODO: Implementar actualización real via API
    // Actualizando pago
  }

  const handleLockDay = () => {
    const confirmed = window.confirm(
      '¿Estás seguro de cerrar el día? Una vez cerrado no podrás modificar los cobros.'
    )
    if (confirmed) {
      setDayLocked(true)
    }
  }

  const handleToggleNotification = (clientId: string) => {
    if (isClientNotified(clientId)) {
      markClientAsPending(clientId)
    } else {
      markClientAsNotified(clientId)
    }
  }

  // Get current client summary for modals
  const getCurrentClientSummary = (): ClientSummary | null => {
    if (!selectedClient) return null
    return displayClientsSummary.find(c => c.clientId === selectedClient) || 
           getClientsSummary(allSubLoansWithClient).find(c => c.clientId === selectedClient) || 
           null
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <CobrosHeader
        overduePayments={overduePayments}
        totalClients={displayClientsSummary.length}
        selectedDate={selectedDate}
        dayLocked={dayLocked}
        onOverdueClick={() => setOverdueModalOpen(true)}
        onDateChange={setSelectedDate}
        onLockDay={handleLockDay}
      />

      {/* Estado del día */}
      {dayLocked && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Día cerrado exitosamente
          </Typography>
          <Typography variant="body2">
            Los cobros del {new Date(selectedDate).toLocaleDateString('es-AR')} han sido finalizados.
            No se pueden hacer más modificaciones.
          </Typography>
        </Alert>
      )}

      {/* Estadísticas del Día */}
      <StatsCards displayStats={displayStats} hasActiveFilters={hasActiveFilters} />

      {/* Filter Panel */}
      <Box sx={{ mb: 3 }}>
        <CobrosFilterPanel variant="expanded" />
      </Box>

      {/* Tabla de Cobros */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Payment color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6">
            Gestión de Cobros - Todas las Cuotas
          </Typography>
        </Box>

        {/* Legend for urgency colors */}
        <UrgencyLegend />

        {/* Client Summary Cards */}
        <Box sx={{ 
          display: 'grid',
          gap: 3,
          '& > *:not(:last-child)': { mb: 0 }
        }}>
          {paginatedClients.map((client) => (
            <ClientSummaryCard
              key={client.clientId}
              client={client}
              isNotified={isClientNotified(client.clientId)}
              onViewDetails={() => handleViewClientDetails(client)}
              onToggleNotification={() => handleToggleNotification(client.clientId)}
            />
          ))}
        </Box>

        <TablePagination
          component="div"
          count={displayClientsSummary.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': {
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
            },
            '& .MuiTablePagination-spacer': {
              display: { xs: 'none', sm: 'flex' }
            }
          }}
        />

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {isFilteredStats(displayStats) ? (
              <>
                Mostrando {displayStats.total} de {getStatusStats(allSubLoansWithClient).total} cuotas filtradas
                {isFilteredStats(displayStats) && displayStats.notifiedCount > 0 && ` • ${displayStats.notifiedCount} notificados`}
              </>
            ) : (
              `Progreso del día: ${displayStats.completed + displayStats.partial} de ${displayStats.total} cobros procesados`
            )}
          </Typography>
        </Box>
      </Paper>

      {/* Modals */}
      <EditPaymentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        selectedPayment={null}
        onSave={handleSavePayment}
      />

      <OverduePaymentsModal
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        overduePayments={overduePayments}
      />

      <ClientTimelineModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        clientSummary={getCurrentClientSummary()}
        onPaymentClick={handlePaymentClick}
        onRegisterPaymentClick={handleRegisterPaymentClick}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subloan={paymentModalMode === 'single' ? selectedPaymentSubloan : null}
        subloans={paymentModalMode === 'selector' && selectedPaymentClient ? 
          selectedPaymentClient.subLoans : []
        }
        clientName={
          paymentModalMode === 'single' && selectedPaymentSubloan 
            ? selectedPaymentSubloan.clientName || 'Cliente'
            : selectedPaymentClient?.clientName || 'Cliente'
        }
        mode={paymentModalMode}
        onPaymentSuccess={() => {
          // Payment registered successfully, refetching data
          fetchAllSubLoansWithClientInfo()
        }}
      />
    </Box>
  )
}