'use client'

import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material'
import { Payment } from '@mui/icons-material'
import LoanTimeline from '@/components/loans/LoanTimeline'
import { 
  calculateTotalRepaymentAmount,
  calculateInterestAmount,
  formatInterestRate,
  getLoanStatusInfo 
} from '@/lib/loans/loanCalculations'
import { getFrequencyLabel } from '@/lib/formatters'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import type { Loan } from '@/types/auth'

interface LoanDetailsModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
  subLoans: SubLoanWithClientInfo[]
  isLoading?: boolean
  onGoToCobros?: () => void
}

export default function LoanDetailsModal({
  open,
  onClose,
  loan,
  subLoans,
  isLoading = false,
  onGoToCobros
}: LoanDetailsModalProps) {
  if (!loan) return null

  const clientName = subLoans.length > 0 
    ? subLoans[0].clientName || `Cliente #${loan.clientId}`
    : `Cliente #${loan.clientId}`

  const totalAmount = calculateTotalRepaymentAmount(loan)
  const interestAmount = calculateInterestAmount(loan)
  const statusInfo = getLoanStatusInfo(loan.status)

  // Calculate remaining amount and payments
  const totalPaid = subLoans.reduce((sum, subloan) => sum + (subloan.paidAmount || 0), 0)
  const remainingAmount = totalAmount - totalPaid
  const remainingPayments = subLoans.filter(subloan => 
    subloan.status === 'PENDING' || subloan.status === 'OVERDUE'
  ).length

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: '95vw', sm: '95vw', md: '95vw' },
          height: { xs: '90vh', sm: 'auto' },
          maxWidth: '1800px',
          m: { xs: 1, sm: 2 },
          borderRadius: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Payment color="primary" />
          <Typography variant="h6">Detalles del Préstamo</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Cargando detalles del préstamo...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Loan Summary Header */}
            <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {clientName} - {loan.loanTrack}
              </Typography>

              {/* Remaining Summary - Highlighted */}
              {remainingPayments > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    Resta pagar ${remainingAmount.toLocaleString()} en {remainingPayments} {remainingPayments === 1 ? 'cuota' : 'cuotas'}
                  </Typography>
                </Box>
              )}

              {remainingPayments === 0 && (
                <Box sx={{ 
                  mt: 2, 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'success.main', 
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    ✓ Préstamo completado - Total pagado: ${totalPaid.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 3,
                  mt: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto del préstamo
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${loan.amount.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tasa de interés
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatInterestRate(loan)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total a devolver
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ${totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de intereses
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    ${interestAmount.toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color={`${statusInfo.color}.main`}>
                    {statusInfo.label}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total cuotas
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {loan.totalPayments}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Frecuencia
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {getFrequencyLabel(loan.paymentFrequency)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de creación
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {new Date(loan.createdAt).toLocaleDateString('es-AR')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Timeline Component */}
            <LoanTimeline
              clientName={clientName}
              subLoans={subLoans}
              compact={false}
            />

            {/* Actions Section */}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
        <Button onClick={onClose} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}