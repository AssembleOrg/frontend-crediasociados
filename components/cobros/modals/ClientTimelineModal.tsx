'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Payment } from '@mui/icons-material'
import LoanTimeline from '@/components/loans/LoanTimeline'
import type { ClientSummary } from '@/lib/cobros/clientSummaryHelpers'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { getSubloanUrgencyLevel, isSubloanSettled } from '@/lib/cobros/urgencyHelpers'

interface ClientTimelineModalProps {
  open: boolean
  onClose: () => void
  clientSummary: ClientSummary | null
  onPaymentClick: (subloan: SubLoanWithClientInfo) => void
  onRegisterPaymentClick: (clientSummary: ClientSummary) => void
  onDateUpdated?: () => void
}

export default function ClientTimelineModal({
  open,
  onClose,
  clientSummary,
  onPaymentClick,
  onRegisterPaymentClick,
  onDateUpdated
}: ClientTimelineModalProps) {
  const [showClientInfo, setShowClientInfo] = useState<string | null>(null)

  const groupedByLoan = useMemo(() => {
    const groups = new Map<string, SubLoanWithClientInfo[]>()

    const sourceSubLoans = clientSummary?.subLoans || []
    sourceSubLoans.forEach((subloan) => {
      const loanKey = subloan.loanId || 'unknown-loan'
      if (!groups.has(loanKey)) {
        groups.set(loanKey, [])
      }
      groups.get(loanKey)!.push(subloan)
    })

    return Array.from(groups.entries()).map(([loanId, subLoans]) => {
      const first = subLoans[0]
      const loanLabel = first?.loanTrack || `PRÉSTAMO ${loanId.slice(0, 8)}`
      const sortedSubLoans = [...subLoans].sort(
        (a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0)
      )
      const overdueCount = sortedSubLoans.filter(s => getSubloanUrgencyLevel(s) === 'overdue').length
      const paidCount = sortedSubLoans.filter(s => isSubloanSettled(s)).length
      const pendingCount = sortedSubLoans.length - paidCount
      const summaryLabel =
        overdueCount > 0
          ? `${overdueCount} vencida${overdueCount === 1 ? '' : 's'}`
          : pendingCount > 0
          ? `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`
          : 'al día'

      return {
        loanId,
        loanLabel,
        subLoans: sortedSubLoans,
        totalInstallments: sortedSubLoans.length,
        summaryLabel,
        overdueCount,
      }
    })
  }, [clientSummary?.subLoans])

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!clientSummary) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: { sm: '90vw', md: '1400px' },
          maxWidth: 'none',
          m: { xs: 0, sm: 3 },
          borderRadius: { xs: 0, sm: 3 },
        },
      }}
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment color="primary" />
          <Typography variant="h6">Timeline de Cuotas</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 4 }, overflow: 'auto' }}>
        <Box>
          {/* Client Summary Header */}
          <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {clientSummary.clientName}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 3,
                mt: 2,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total cuotas
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {clientSummary.stats.total}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pagadas
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {clientSummary.stats.paid}
                </Typography>
              </Box>
              {clientSummary.stats.overdue > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Vencidas
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {clientSummary.stats.overdue}
                  </Typography>
                </Box>
              )}
              {clientSummary.stats.today > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Vencen hoy
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {clientSummary.stats.today}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Saldo pendiente
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ${(clientSummary.stats.totalAmount - clientSummary.stats.paidAmount).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Timeline Component (grouped by loan to avoid mixing installments) */}
          {groupedByLoan.map((loanGroup) => (
            <Box
              key={loanGroup.loanId}
              sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {`Préstamo ${loanGroup.loanLabel} (${loanGroup.totalInstallments} cuota${loanGroup.totalInstallments === 1 ? '' : 's'})`}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: loanGroup.overdueCount > 0 ? 'error.light' : 'success.light',
                    color: loanGroup.overdueCount > 0 ? 'error.dark' : 'success.dark',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loanGroup.summaryLabel}
                </Typography>
              </Box>
              <LoanTimeline
                clientName={`${clientSummary.clientName} - ${loanGroup.loanLabel}`}
                subLoans={loanGroup.subLoans}
                compact={false}
                onPaymentClick={onPaymentClick}
                onDateUpdated={onDateUpdated}
              />
            </Box>
          ))}

          {/* Urgent Actions */}
          {(clientSummary.stats.overdue > 0 || clientSummary.stats.today > 0 || clientSummary.stats.soon > 0) && (
            <Box
              sx={{
                mt: 4,
                p: { xs: 2, sm: 3 },
                bgcolor: clientSummary.urgencyLevel === 'overdue' ? '#ffebee'
                  : clientSummary.urgencyLevel === 'today' ? '#fff3e0'
                  : '#fff8e1',
                borderRadius: 2,
                border: 1,
                borderColor: clientSummary.urgencyLevel === 'overdue' ? 'error.main'
                  : clientSummary.urgencyLevel === 'today' ? 'warning.main'
                  : '#ffc107',
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                color={clientSummary.urgencyLevel === 'overdue' ? 'error.main'
                  : clientSummary.urgencyLevel === 'today' ? 'warning.main'
                  : '#ff6f00'}
                gutterBottom
              >
                {clientSummary.urgencyLevel === 'soon' ? 'Vence Pronto' : 'Atencion Requerida'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {clientSummary.urgencyLevel === 'overdue'
                  ? 'Este cliente requiere seguimiento inmediato por cuotas vencidas.'
                  : clientSummary.urgencyLevel === 'today'
                  ? 'Este cliente tiene cuotas que vencen hoy.'
                  : `Este cliente tiene ${clientSummary.stats.soon} cuota${clientSummary.stats.soon > 1 ? 's' : ''} por vencer pronto.`}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="outlined"
                  color={clientSummary.urgencyLevel === 'overdue' ? 'error' : 'warning'}
                  size="small"
                  onClick={() =>
                    setShowClientInfo(
                      showClientInfo === clientSummary.clientId ? null : clientSummary.clientId
                    )
                  }
                >
                  Contactar Cliente
                </Button>
                {clientSummary.urgencyLevel !== 'soon' && (
                  <Button
                    variant="outlined"
                    color={clientSummary.urgencyLevel === 'overdue' ? 'error' : 'warning'}
                    size="small"
                    onClick={() => onRegisterPaymentClick(clientSummary)}
                  >
                    Registrar Pago
                  </Button>
                )}
              </Box>

              {/* Client Contact Information - Collapsible */}
              {showClientInfo === clientSummary.clientId && (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'grey.300',
                  }}
                >
                  {(() => {
                    const clientData = clientSummary.subLoans[0]?.clientFullData

                    return (
                      <>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          Información de Contacto - {clientSummary.clientName}
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Teléfono:</strong> {clientData?.phone || 'Dato no ingresado'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Email:</strong> {clientData?.email || 'Dato no ingresado'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>DNI:</strong> {clientData?.dni || 'Dato no ingresado'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>CUIT:</strong> {clientData?.cuit || 'Dato no ingresado'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Préstamo creado:</strong>{' '}
                          {new Date(clientSummary.subLoans[0]?.dueDate || '').toLocaleDateString(
                            'es-AR'
                          )}
                        </Typography>
                      </>
                    )
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
        <Button onClick={onClose} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}