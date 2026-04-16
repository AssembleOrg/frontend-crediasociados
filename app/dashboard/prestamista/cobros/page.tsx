'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Paper,
  Typography,
  TablePagination,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  InputBase,
  Divider,
  alpha,
  Snackbar,
} from '@mui/material'
import { Payment, Clear, Search, Warning, CheckCircle } from '@mui/icons-material'

import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import type { CobrosClient, OverdueClientEntry } from '@/services/sub-loans.service'
import { subLoansService } from '@/services/sub-loans.service'
import { useCobrosFilters } from '@/hooks/useCobrosFilters'
import { getUrgencyColor } from '@/lib/cobros/urgencyHelpers'
import { iosColors } from '@/lib/theme'

import ClientSummaryCard from '@/components/cobros/ClientSummaryCard'

// Lazy load heavy modals
const PaymentModal       = dynamic(() => import('@/components/loans/PaymentModal'),                      { ssr: false })
const ClientTimelineModal = dynamic(() => import('@/components/cobros/modals/ClientTimelineModal'),       { ssr: false })

// Adapt CobrosClient → ClientSummary shape
function toClientSummary(c: CobrosClient) {
  return {
    clientId:     c.client.id,
    clientName:   c.client.fullName,
    subLoans:     c.subLoans.map(sl => ({
      id:            sl.id,
      loanId:        sl.loanId,
      paymentNumber: sl.paymentNumber,
      amount:        sl.amount,
      totalAmount:   sl.totalAmount,
      paidAmount:    sl.paidAmount,
      status:        sl.status,
      dueDate:       sl.dueDate,
      paidDate:      sl.paidDate,
      loanTrack:     sl.loanTrack,
      clientId:      c.client.id,
      clientName:    c.client.fullName,
      payments:      sl.payments,
    })) as SubLoanWithClientInfo[],
    urgencyLevel: c.urgencyLevel,
    stats:        c.stats,
  }
}

const fmt = (n: number) =>
  `$${new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`

// ─── Morosos tab ──────────────────────────────────────────────────────────────

function MorososTab() {
  const [data, setData]       = useState<OverdueClientEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    subLoansService
      .getOverdueClients()
      .then((res) => setData(res.clients))
      .catch(() => setError('No se pudo cargar clientes con deuda'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((e) => e.client.fullName.toLowerCase().includes(q))
  }, [data, search])

  const totalAmount = data.reduce((s, e) => s + e.totalOverdueAmount, 0)

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  )

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>

  return (
    <Box>
      {/* Summary banner */}
      <Box
        sx={{
          display:      'flex',
          gap:          2,
          p:            2,
          mb:           2,
          bgcolor:      alpha(iosColors.red, 0.06),
          borderRadius: 2,
          border:       `1px solid ${alpha(iosColors.red, 0.2)}`,
          flexWrap:     'wrap',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">Clientes morosos</Typography>
          <Typography variant="h6" fontWeight={700} color="error.main">{data.length}</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" color="text.secondary">Deuda total acumulada</Typography>
          <Typography variant="h6" fontWeight={700} color="error.main">{fmt(totalAmount)}</Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box
        sx={{
          display:      'flex',
          alignItems:   'center',
          gap:          1,
          px:           1.5,
          py:           0.75,
          mb:           2,
          bgcolor:      'background.paper',
          borderRadius: 3,
          border:       `0.5px solid ${iosColors.gray4}`,
        }}
      >
        <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
        <InputBase
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente moroso..."
          fullWidth
          sx={{ fontSize: '0.9375rem' }}
        />
        {search && (
          <Box
            component="button"
            onClick={() => setSearch('')}
            sx={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'text.disabled', display: 'flex', alignItems: 'center' }}
          >
            <Clear sx={{ fontSize: 16 }} />
          </Box>
        )}
      </Box>

      {/* List */}
      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Warning sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {search ? 'No hay resultados para tu búsqueda' : 'No hay clientes con deuda vencida'}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filtered.map((entry) => (
          <Paper
            key={entry.client.id}
            elevation={0}
            sx={{
              borderRadius: 2,
              border:       `0.5px solid ${iosColors.red}`,
              borderLeft:   `4px solid ${iosColors.red}`,
              bgcolor:      alpha(iosColors.red, 0.03),
              overflow:     'hidden',
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              {/* Client name + total debt */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                <Box>
                  <Typography variant="body2" fontWeight={700} fontSize="0.9375rem">
                    {entry.client.fullName}
                  </Typography>
                  {entry.client.phone && (
                    <Typography
                      component="a"
                      href={`tel:${entry.client.phone}`}
                      variant="caption"
                      sx={{ color: iosColors.blue, textDecoration: 'none' }}
                    >
                      {entry.client.phone}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Deuda total</Typography>
                  <Typography variant="body2" fontWeight={700} color="error.main" fontSize="1rem">
                    {fmt(entry.totalOverdueAmount)}
                  </Typography>
                </Box>
              </Box>

              {/* Per-loan overdue installments */}
              {entry.loans.map((loan) => (
                <Box
                  key={loan.id}
                  sx={{
                    mt:           1,
                    p:            1.25,
                    bgcolor:      'background.paper',
                    borderRadius: 1.5,
                    border:       `0.5px solid ${iosColors.gray4}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {loan.loanTrack}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {loan.overdueInstallments.length} cuota{loan.overdueInstallments.length > 1 ? 's' : ''} vencida{loan.overdueInstallments.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  {loan.overdueInstallments.map((inst, i) => (
                    <Box
                      key={inst.id}
                      sx={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        alignItems:     'center',
                        py:             0.5,
                        borderTop:      i > 0 ? `0.5px solid ${iosColors.gray5}` : 'none',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Cuota #{inst.paymentNumber}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="error.main">
                        {fmt(inst.pendingAmount)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  // Tabs: 0 = cobros, 1 = morosos
  const [activeTab, setActiveTab] = useState(0)

  // Client-side name search (applied on top of server filter)
  const [nameSearch, setNameSearch] = useState('')

  // Modal states
  const [selectedClientData, setSelectedClientData]     = useState<CobrosClient | null>(null)
  const [detailsModalOpen, setDetailsModalOpen]         = useState(false)
  const [paymentModalOpen, setPaymentModalOpen]         = useState(false)
  const [paymentModalMode, setPaymentModalMode]         = useState<'single' | 'selector'>('single')
  const [selectedPaymentSubloan, setSelectedPaymentSubloan] = useState<SubLoanWithClientInfo | null>(null)
  const [successSnack, setSuccessSnack]                 = useState<string | null>(null)

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

  // Client-side name filter on top of server results
  const displayedClients = useMemo(() => {
    if (!nameSearch.trim()) return clients
    const q = nameSearch.toLowerCase()
    return clients.filter((c) => c.client.fullName.toLowerCase().includes(q))
  }, [clients, nameSearch])

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh' }}>

      {/* ── Tabs ── */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb:           2,
          minHeight:    44,
          '& .MuiTab-root': { minHeight: 44, fontWeight: 600, fontSize: '0.9375rem' },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
        }}
      >
        <Tab label="Cobros" />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              Morosos
              {globalStats.overdue > 0 && (
                <Chip
                  label={globalStats.overdue}
                  size="small"
                  sx={{ bgcolor: iosColors.red, color: 'white', height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              )}
            </Box>
          }
        />
      </Tabs>

      {/* ── TAB 0: Cobros ── */}
      {activeTab === 0 && (
        <>
          {/* Filter chips */}
          <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
            {statusFilterOptions.map(opt => {
              const isSelected = (filters.urgency || 'all') === opt.key
              return (
                <Chip
                  key={opt.key}
                  label={`${opt.label} (${opt.count})`}
                  size="small"
                  onClick={() => updateFilter('urgency', opt.key)}
                  sx={{
                    fontWeight:  600,
                    cursor:      'pointer',
                    minHeight:   32,
                    bgcolor:     isSelected ? opt.color : 'transparent',
                    color:       isSelected ? 'white' : opt.color,
                    border:      `1.5px solid ${opt.color}`,
                    '&:hover':   { bgcolor: isSelected ? opt.color : `${opt.color}15` },
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
                sx={{ minHeight: 32 }}
              />
            )}
          </Box>

          {/* Name search */}
          <Box
            sx={{
              display:      'flex',
              alignItems:   'center',
              gap:          1,
              px:           1.5,
              py:           0.75,
              mb:           1.5,
              bgcolor:      'background.paper',
              borderRadius: 3,
              border:       `0.5px solid ${iosColors.gray4}`,
            }}
          >
            <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
            <InputBase
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Buscar cliente..."
              fullWidth
              sx={{ fontSize: '0.9375rem' }}
            />
            {nameSearch && (
              <Box
                component="button"
                onClick={() => setNameSearch('')}
                sx={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'text.disabled', display: 'flex', alignItems: 'center' }}
              >
                <Clear sx={{ fontSize: 16 }} />
              </Box>
            )}
          </Box>

          {/* Error */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Content */}
          <Paper sx={{ p: { xs: 1, sm: 2 }, mx: { xs: -1, sm: 0 }, borderRadius: { xs: 2, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Cobros
                </Typography>
                {isLoading && <CircularProgress size={16} />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {nameSearch ? `${displayedClients.length} de ${totalClients}` : `${totalClients} clientes`}
              </Typography>
            </Box>

            {!isLoading && displayedClients.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Payment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  {hasActiveFilters || nameSearch
                    ? 'No hay resultados para estos filtros'
                    : 'No hay cobros pendientes'}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
              {displayedClients.map(c => (
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
            {totalClients > 0 && !nameSearch && (
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
                  borderTop: 1, borderColor: 'divider', mt: 1,
                  '& .MuiTablePagination-toolbar': {
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap:           { xs: 0.5, sm: 0 },
                    minHeight:     { xs: 'auto', sm: 52 },
                    py:            { xs: 1, sm: 0 },
                  },
                  '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'flex' } },
                }}
              />
            )}
          </Paper>
        </>
      )}

      {/* ── TAB 1: Morosos ── */}
      {activeTab === 1 && <MorososTab />}

      {/* ── Modals ── */}
      <ClientTimelineModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        clientSummary={currentClientSummary}
        onPaymentClick={handlePaymentClick}
        onRegisterPaymentClick={handleRegisterPaymentClick}
        onDateUpdated={refresh}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subloan={paymentModalMode === 'single' ? selectedPaymentSubloan : null}
        subloans={
          paymentModalMode === 'selector' && currentClientSummary
            ? currentClientSummary.subLoans.filter(s => s.status !== 'PAID')
            : []
        }
        clientName={
          paymentModalMode === 'single' && selectedPaymentSubloan
            ? selectedPaymentSubloan.clientName || 'Cliente'
            : currentClientSummary?.clientName || 'Cliente'
        }
        mode={paymentModalMode}
        onPaymentSuccess={() => {
          const name = paymentModalMode === 'single'
            ? selectedPaymentSubloan?.clientName
            : currentClientSummary?.clientName
          setSuccessSnack(`Pago registrado para ${name ?? 'cliente'}`)
          refresh()
        }}
      />

      {/* ── Success snackbar ── */}
      <Snackbar
        open={!!successSnack}
        autoHideDuration={4000}
        onClose={() => setSuccessSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 96, sm: 24 } }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 18, color: '#34C759' }} />
            {successSnack}
          </Box>
        }
      />
    </Box>
  )
}
