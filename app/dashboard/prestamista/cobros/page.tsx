'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Paper,
  Typography,
  TablePagination,
  Alert,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material'
import { Payment, Clear } from '@mui/icons-material'

import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import type { CobrosClient } from '@/services/sub-loans.service'
import { useCobrosFilters } from '@/hooks/useCobrosFilters'
import { getUrgencyColor } from '@/lib/cobros/urgencyHelpers'

// Extracted components
import CobrosHeader from '@/components/cobros/CobrosHeader'
import ClientSummaryCard from '@/components/cobros/ClientSummaryCard'

// Lazy load heavy modals
const PaymentModal = dynamic(() => import('@/components/loans/PaymentModal'), { ssr: false })
const ClientTimelineModal = dynamic(() => import('@/components/cobros/modals/ClientTimelineModal'), { ssr: false })

// Adapt CobrosClient to ClientSummary shape for existing components
function toClientSummary(c: CobrosClient) {
  return {
    clientId: c.client.id,
    clientName: c.client.fullName,
    subLoans: c.subLoans.map(sl => ({
      id: sl.id,
      loanId: sl.loanId,
      paymentNumber: sl.paymentNumber,
      amount: sl.amount,
      totalAmount: sl.totalAmount,
      paidAmount: sl.paidAmount,
      status: sl.status,
      dueDate: sl.dueDate,
      paidDate: sl.paidDate,
      loanTrack: sl.loanTrack,
      clientId: c.client.id,
      clientName: c.client.fullName,
      payments: sl.payments,
    })) as SubLoanWithClientInfo[],
    urgencyLevel: c.urgencyLevel,
    stats: c.stats,
  }
}

export default function CobrosPage() {
  const {
    clients,
    globalStats,
    isLoading,
    error,
    page,
    limit,
    totalClients,
    setPage,
    setLimit,
    filters,
    hasActiveFilters,
    statusFilterOptions,
    updateFilter,
    clearAllFilters,
    refresh,
  } = useCobrosFilters()

  // Modal states
  const [selectedClientData, setSelectedClientData] = useState<CobrosClient | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentModalMode, setPaymentModalMode] = useState<'single' | 'selector'>('single')
  const [selectedPaymentSubloan, setSelectedPaymentSubloan] = useState<SubLoanWithClientInfo | null>(null)

  const handleViewClientDetails = (c: CobrosClient) => {
    setSelectedClientData(c)
    setDetailsModalOpen(true)
  }

  const handlePaymentClick = (subloan: SubLoanWithClientInfo) => {
    setSelectedPaymentSubloan(subloan)
    setPaymentModalMode('single')
    setPaymentModalOpen(true)
  }

  const handleRegisterPaymentClick = () => {
    if (!selectedClientData) return
    setPaymentModalMode('selector')
    setPaymentModalOpen(true)
  }

  const currentClientSummary = selectedClientData ? toClientSummary(selectedClientData) : null

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Stats chips */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {statusFilterOptions.map(opt => {
          const isSelected = (filters.urgency || 'all') === opt.key
          return (
            <Chip
              key={opt.key}
              label={`${opt.label} (${opt.count})`}
              size="small"
              onClick={() => updateFilter('urgency', opt.key)}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: isSelected ? opt.color : 'transparent',
                color: isSelected ? 'white' : opt.color,
                border: `1.5px solid ${opt.color}`,
                '&:hover': { bgcolor: isSelected ? opt.color : `${opt.color}15` },
              }}
            />
          )
        })}
        {hasActiveFilters && (
          <Chip
            label="Limpiar"
            size="small"
            icon={<Clear sx={{ fontSize: 14 }} />}
            onClick={clearAllFilters}
            variant="outlined"
          />
        )}
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Content */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mx: { xs: -1, sm: 0 }, borderRadius: { xs: 0, sm: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: { xs: 0.5, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Cobros
            </Typography>
            {isLoading && <CircularProgress size={16} />}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {totalClients} clientes
          </Typography>
        </Box>

        {/* Client Cards */}
        {!isLoading && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Payment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {hasActiveFilters ? 'No hay resultados para estos filtros' : 'No hay cobros pendientes'}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
          {clients.map(c => (
            <ClientSummaryCard
              key={c.client.id}
              client={toClientSummary(c)}
              isNotified={false}
              onViewDetails={() => handleViewClientDetails(c)}
              onToggleNotification={() => {}}
            />
          ))}
        </Box>

        {/* Pagination */}
        {totalClients > 0 && (
          <TablePagination
            component="div"
            count={totalClients}
            page={page - 1}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1) }}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Por pag:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              mt: 1,
              '& .MuiTablePagination-toolbar': {
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 },
                minHeight: { xs: 'auto', sm: 52 },
                py: { xs: 1, sm: 0 },
              },
              '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'flex' } },
            }}
          />
        )}
      </Paper>

      {/* Timeline Modal */}
      <ClientTimelineModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        clientSummary={currentClientSummary}
        onPaymentClick={handlePaymentClick}
        onRegisterPaymentClick={handleRegisterPaymentClick}
        onDateUpdated={refresh}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subloan={paymentModalMode === 'single' ? selectedPaymentSubloan : null}
        subloans={paymentModalMode === 'selector' && currentClientSummary
          ? currentClientSummary.subLoans.filter(s => s.status !== 'PAID')
          : []}
        clientName={
          paymentModalMode === 'single' && selectedPaymentSubloan
            ? selectedPaymentSubloan.clientName || 'Cliente'
            : currentClientSummary?.clientName || 'Cliente'
        }
        mode={paymentModalMode}
        onPaymentSuccess={refresh}
      />
    </Box>
  )
}
