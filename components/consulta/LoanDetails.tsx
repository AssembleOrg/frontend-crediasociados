'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material'
import {
  Info,
  MonetizationOn,
  CalendarToday,
  CheckCircle
} from '@mui/icons-material'
import { getFrequencyLabel, getStatusLabel } from '@/lib/formatters'

interface LoanDetailsProps {
  loanDetails: {
    id: string
    loanTrack: string
    amount: number
    baseInterestRate: number
    totalPayments: number
    remainingPayments: number
    nextDueDate: string
    status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
    paymentFrequency: string
    client: {
      fullName: string
      dni: string
    }
  }
}

export default function LoanDetails({ loanDetails }: LoanDetailsProps) {
  const formatCurrency = (amount: number) => {
    // Formato genérico sin especificar país o moneda
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const getStatusMessage = () => {
    switch (loanDetails.status) {
      case 'ACTIVE':
        return `Próximo pago: ${formatDate(loanDetails.nextDueDate)}`
      case 'OVERDUE':
        return 'Tienes pagos vencidos. Contacta a tu cobrador.'
      case 'COMPLETED':
        return 'Préstamo completado exitosamente.'
      default:
        return 'Estado del préstamo actualizado'
    }
  }

  const getAlertSeverity = () => {
    switch (loanDetails.status) {
      case 'ACTIVE':
        return 'info'
      case 'OVERDUE':
        return 'warning'
      case 'COMPLETED':
        return 'success'
      default:
        return 'info'
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
        Información del Préstamo
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 3,
        mb: 4
      }}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Info color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Cliente
              </Typography>
            </Box>
            <Typography variant="h6">{loanDetails.client.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              DNI: {loanDetails.client.dni}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MonetizationOn color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Total a Pagar
              </Typography>
            </Box>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(loanDetails.amount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Incluye capital + intereses
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarToday color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Valor de Cuota
              </Typography>
            </Box>
            <Typography variant="h6" color="success.main">
              {formatCurrency(loanDetails.amount / loanDetails.totalPayments)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getFrequencyLabel(loanDetails.paymentFrequency)}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Total de Cuotas
              </Typography>
            </Box>
            <Typography variant="h6" color="info.main">
              {loanDetails.totalPayments} cuotas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loanDetails.totalPayments - loanDetails.remainingPayments} pagadas, {loanDetails.remainingPayments} restantes
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Alert severity={getAlertSeverity()} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Estado del Préstamo: {getStatusLabel(loanDetails.status)}
        </Typography>
        <Typography variant="body2">
          {getStatusMessage()}
        </Typography>
      </Alert>
    </Box>
  )
}