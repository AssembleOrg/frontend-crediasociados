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
          <Typography variant="h6">Detalles del Préstamo</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, sm: 4 }, overflow: 'auto' }}>
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
            {onGoToCobros && (
              <Box sx={{ mt: 4, p: 3, bgcolor: '#f3f4f6', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Gestiona los cobros y pagos de este préstamo
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onGoToCobros}
                >
                  Ir a Gestión de Cobros
                </Button>
              </Box>
            )}
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