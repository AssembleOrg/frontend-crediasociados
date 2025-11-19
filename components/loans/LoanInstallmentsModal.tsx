'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Divider,
  LinearProgress,
} from '@mui/material'
import { Schedule, CheckCircle, RadioButtonUnchecked, Error } from '@mui/icons-material'
import { useClients } from '@/hooks/useClients'
import type { Loan } from '@/types/auth'
import { 
  calculateInstallments, 
  calculateLoanProgress,
  formatCurrency, 
  getInstallmentStatusColor,
  translateLoanStatus,
  getLoanStatusColor
} from '@/lib/loan-utils'

interface LoanInstallmentsModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
}

export function LoanInstallmentsModal({ 
  open, 
  onClose, 
  loan
}: LoanInstallmentsModalProps) {
  const { clients } = useClients()
  
  if (!loan) return null

  const client = clients.find(c => c.id === loan.clientId)
  const installments = calculateInstallments(loan)
  const progress = calculateLoanProgress(loan)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
      case 'EN_PROCESO':
        return <RadioButtonUnchecked sx={{ color: 'warning.main', fontSize: 20 }} />
      case 'ATRASADO':
        return <Error sx={{ color: 'error.main', fontSize: 20 }} />
      case 'PENDIENTE':
        return <Schedule sx={{ color: 'info.main', fontSize: 20 }} />
      default:
        return <Schedule sx={{ color: 'info.main', fontSize: 20 }} />
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return 'success.50'
      case 'EN_PROCESO':
        return 'warning.50'
      case 'ATRASADO':
        return 'error.50'
      case 'PENDIENTE':
        return 'info.50'
      default:
        return 'grey.50'
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return 'success.200'
      case 'EN_PROCESO':
        return 'warning.200'
      case 'ATRASADO':
        return 'error.200'
      case 'PENDIENTE':
        return 'info.200'
      default:
        return 'grey.200'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Schedule color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              Calendario de Cuotas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loan.loanTrack} • {client?.fullName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Resumen del Préstamo */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50', borderColor: 'primary.200', border: 1 }}>
          <CardContent>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
              gap: 2, 
              alignItems: 'center' 
            }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Monto Total
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(loan.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Progreso
                </Typography>
                <Typography variant="h6">
                  {progress.paidPayments}/{progress.totalPayments}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.percentageComplete} 
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Monto por Cuota
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(loan.amount / loan.totalPayments)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  label={translateLoanStatus(loan.status)}
                  color={getLoanStatusColor(loan.status)}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Lista de Cuotas */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule />
          Detalle de Cuotas
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
          gap: 2 
        }}>
          {installments.map((installment) => (
            <Box key={installment.number}>
              <Card
                sx={{
                  border: 2,
                  borderColor: getStatusBorderColor(installment.status),
                  bgcolor: getStatusBgColor(installment.status),
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      Cuota #{installment.number}
                    </Typography>
                    {getStatusIcon(installment.status)}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Monto
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(installment.amount)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Vencimiento
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {installment.dueDate.toLocaleDateString('es-AR', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={installment.status.replace('_', ' ')}
                      color={getInstallmentStatusColor(installment.status)}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                    {installment.daysSinceDue && installment.daysSinceDue > 0 && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'error.main', fontWeight: 500 }}>
                        {installment.daysSinceDue} día{installment.daysSinceDue !== 1 ? 's' : ''} de atraso
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Leyenda */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Leyenda de Estados
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
            gap: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption">Pagado</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RadioButtonUnchecked sx={{ color: 'warning.main', fontSize: 16 }} />
              <Typography variant="caption">En Proceso</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Error sx={{ color: 'error.main', fontSize: 16 }} />
              <Typography variant="caption">Atrasado</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule sx={{ color: 'info.main', fontSize: 16 }} />
              <Typography variant="caption">Pendiente</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}