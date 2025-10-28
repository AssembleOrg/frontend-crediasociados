'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider
} from '@mui/material'
import { Payment } from '@mui/icons-material'
import LoanTimeline from '@/components/loans/LoanTimeline'
import type { ClientSummary } from '@/lib/cobros/clientSummaryHelpers'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface ClientTimelineModalProps {
  open: boolean
  onClose: () => void
  clientSummary: ClientSummary | null
  onPaymentClick: (subloan: SubLoanWithClientInfo) => void
  onRegisterPaymentClick: (clientSummary: ClientSummary) => void
}

export default function ClientTimelineModal({
  open,
  onClose,
  clientSummary,
  onPaymentClick,
  onRegisterPaymentClick
}: ClientTimelineModalProps) {
  const [showClientInfo, setShowClientInfo] = useState<string | null>(null)

  if (!clientSummary) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: '95vw', sm: '90vw', md: '1400px' },
          height: { xs: '90vh', sm: 'auto' },
          maxWidth: 'none',
          m: { xs: 1, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle>
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

          {/* Timeline Component */}
          <LoanTimeline
            clientName={clientSummary.clientName}
            subLoans={clientSummary.subLoans}
            compact={false}
            onPaymentClick={onPaymentClick}
          />

          {/* Urgent Actions */}
          {(clientSummary.stats.overdue > 0 || clientSummary.stats.today > 0) && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                bgcolor: clientSummary.urgencyLevel === 'overdue' ? '#ffebee' : '#fff3e0',
                borderRadius: 2,
                border: 1,
                borderColor: clientSummary.urgencyLevel === 'overdue' ? 'error.main' : 'warning.main',
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                color={clientSummary.urgencyLevel === 'overdue' ? 'error.main' : 'warning.main'}
                gutterBottom
              >
                Atención Requerida
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Este cliente requiere seguimiento inmediato por cuotas{' '}
                {clientSummary.urgencyLevel === 'overdue' ? 'vencidas' : 'que vencen hoy'}.
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
                <Button
                  variant="outlined"
                  color={clientSummary.urgencyLevel === 'overdue' ? 'error' : 'warning'}
                  size="small"
                  onClick={() => onRegisterPaymentClick(clientSummary)}
                >
                  Registrar Pago
                </Button>
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