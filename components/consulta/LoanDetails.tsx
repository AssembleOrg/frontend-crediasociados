'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material'
import {
  AccountBalance,
  MonetizationOn,
  Payment
} from '@mui/icons-material'
import { getFrequencyLabel, getStatusLabel } from '@/lib/formatters'
import { DateTime } from 'luxon'

interface LoanDetailsProps {
  loanDetails: {
    id: string
    loanTrack: string
    amount: number
    originalAmount?: number
    baseInterestRate: number
    penaltyInterestRate: number
    paymentFrequency: string
    totalPayments: number
    remainingPayments: number
    nextDueDate: string
    status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
    createdAt: string
    client: {
      id: string
      fullName: string
      dni: string
      phone?: string
      email?: string
      address?: string
    }
    subLoans: Array<{
      id: string
      paymentNumber: number
      amount: number
      totalAmount: number
      dueDate: string
      status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
      paidDate?: string
      paidAmount?: number
      daysOverdue?: number
    }>
  }
}

export default function LoanDetails({ loanDetails }: LoanDetailsProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`
  }

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString)
    return date.setLocale('es-AR').toFormat('dd/MM/yyyy')
  }

  const formatDateTime = (dateString: string) => {
    const date = DateTime.fromISO(dateString)
    return date.setLocale('es-AR').toFormat('dd/MM/yyyy HH:mm')
  }

  // Calculate totals
  const principalAmount = loanDetails.originalAmount ?? loanDetails.amount
  const totalInterest = loanDetails.amount - principalAmount
  const interestRate = principalAmount > 0 ? ((totalInterest / principalAmount) * 100) : 0

  const totalPaid = loanDetails.subLoans.reduce((sum, subloan) => sum + (subloan.paidAmount || 0), 0)
  const totalPending = loanDetails.subLoans.reduce((sum, subloan) => {
    if (subloan.status === 'PAID') return sum
    return sum + (subloan.totalAmount - (subloan.paidAmount || 0))
  }, 0)

  const paidCount = loanDetails.subLoans.filter(s => s.status === 'PAID').length
  const pendingCount = loanDetails.subLoans.filter(s => s.status === 'PENDING' || s.status === 'OVERDUE').length
  const overdueCount = loanDetails.subLoans.filter(s => s.status === 'OVERDUE').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'OVERDUE':
        return 'error'
      case 'PARTIAL':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pagada'
      case 'OVERDUE':
        return 'Vencida'
      case 'PARTIAL':
        return 'Parcial'
      default:
        return 'Pendiente'
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

  // Sort subLoans by payment number
  const sortedSubLoans = [...loanDetails.subLoans].sort((a, b) => a.paymentNumber - b.paymentNumber)

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
          {loanDetails.loanTrack}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Información completa del préstamo
        </Typography>
      </Box>

      {/* Status Alert */}
      <Alert severity={getAlertSeverity()} sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Estado del Préstamo: {getStatusLabel(loanDetails.status)}
        </Typography>
        <Typography variant="body2">
          {getStatusMessage()}
        </Typography>
      </Alert>

      {/* Loan Summary Cards - Centered */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.05), textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <AccountBalance color="primary" />
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                  Monto Prestado
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatCurrency(principalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%', bgcolor: alpha(theme.palette.success.main, 0.05), textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <MonetizationOn color="success" />
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                  Total a Devolver
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {formatCurrency(loanDetails.amount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%', bgcolor: alpha(theme.palette.warning.main, 0.05), textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Payment color="warning" />
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                  Total Pendiente
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {formatCurrency(totalPending)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {pendingCount} cuotas pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Installments Table */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
            <Payment color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Detalle de Cuotas
            </Typography>
          </Box>
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              maxHeight: isMobile ? '400px' : '600px',
              overflow: 'auto'
            }}
          >
            <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>A Pagar</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Vencimiento</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Pagado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Pendiente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedSubLoans.map((subloan) => {
                  const pendingAmount = subloan.totalAmount - (subloan.paidAmount || 0)
                  return (
                    <TableRow 
                      key={subloan.id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        bgcolor: subloan.status === 'PAID' ? alpha(theme.palette.success.main, 0.05) : 
                                 subloan.status === 'OVERDUE' ? alpha(theme.palette.error.main, 0.05) : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {subloan.paymentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(subloan.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatDate(subloan.dueDate)}
                        </Typography>
                        {subloan.daysOverdue > 0 && (
                          <Typography variant="caption" color="error.main" display="block">
                            {subloan.daysOverdue} días vencida
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(subloan.status)}
                          size="small"
                          color={getStatusColor(subloan.status) as any}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={subloan.paidAmount > 0 ? 'success.main' : 'text.secondary'}
                          fontWeight={subloan.paidAmount > 0 ? 600 : 400}
                        >
                          {formatCurrency(subloan.paidAmount || 0)}
                        </Typography>
                        {subloan.paidDate && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(subloan.paidDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={pendingAmount > 0 ? 'warning.main' : 'success.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(pendingAmount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
