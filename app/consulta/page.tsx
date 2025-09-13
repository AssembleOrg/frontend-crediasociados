'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider
} from '@mui/material'
import {
  Search,
  AccountBalance,
  CalendarToday,
  MonetizationOn,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { getFrequencyLabel, getStatusLabel, getPaymentStatusLabel } from '@/lib/formatters'

interface LoanDetails {
  id: string
  loanTrack: string
  amount: number
  baseInterestRate: number
  penaltyInterestRate: number
  paymentFrequency: string
  totalPayments: number
  remainingPayments: number
  nextDueDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
  client: {
    fullName: string
    dni: string
  }
  subLoans: Array<{
    paymentNumber: number
    amount: number
    dueDate: string
    status: 'PENDING' | 'PAID' | 'OVERDUE'
    paidDate?: string
  }>
}

export default function ConsultaPublicaPage() {
  const [dni, setDni] = useState('')
  const [loanTrack, setLoanTrack] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dni.trim() || !loanTrack.trim()) {
      setError('Por favor, completa todos los campos')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoanDetails(null)

    try {
      // Usar el service que ya existe - pero por ahora mockup
      // const response = await loansService.getLoanByTracking(dni, loanTrack)
      
      // MOCKUP: Simular delay de consulta
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // MOCKUP: Generar datos realistas basados en tracking number
      // const trackingYear = loanTrack.includes('-2025-') ? '2025' : '2024'
      const isValidTracking = /^LN-\d{4}-\d{4}$/i.test(loanTrack)
      
      if (!isValidTracking) {
        throw new Error('Formato de código de seguimiento inválido. Use formato: LN-YYYY-NNNN')
      }
      
      const mockLoanDetails: LoanDetails = {
        id: loanTrack.toLowerCase(),
        loanTrack: loanTrack.toUpperCase(),
        amount: 100000, // Monto base mockup
        baseInterestRate: 0.25, // 25% anual mockup
        penaltyInterestRate: 0.05,
        paymentFrequency: 'WEEKLY',
        totalPayments: 12,
        remainingPayments: 8,
        nextDueDate: '2025-08-30',
        status: 'ACTIVE',
        client: {
          fullName: 'Cliente de Prueba',
          dni: dni
        },
        subLoans: [
          { paymentNumber: 1, amount: 5750, dueDate: '2025-07-01', status: 'PAID', paidDate: '2025-06-30' },
          { paymentNumber: 2, amount: 5750, dueDate: '2025-07-08', status: 'PAID', paidDate: '2025-07-07' },
          { paymentNumber: 3, amount: 5750, dueDate: '2025-07-15', status: 'PAID', paidDate: '2025-07-14' },
          { paymentNumber: 4, amount: 5750, dueDate: '2025-07-22', status: 'PAID', paidDate: '2025-07-20' },
          { paymentNumber: 5, amount: 5750, dueDate: '2025-07-29', status: 'OVERDUE' },
          { paymentNumber: 6, amount: 5750, dueDate: '2025-08-05', status: 'PENDING' },
          { paymentNumber: 7, amount: 5750, dueDate: '2025-08-12', status: 'PENDING' },
          { paymentNumber: 8, amount: 5750, dueDate: '2025-08-19', status: 'PENDING' },
          { paymentNumber: 9, amount: 5750, dueDate: '2025-08-26', status: 'PENDING' },
          { paymentNumber: 10, amount: 5750, dueDate: '2025-09-02', status: 'PENDING' }
        ]
      }
      
      setLoanDetails(mockLoanDetails)
    } catch (err: unknown) {
      setError((err as Error).message || 'No se encontró el préstamo. Verifica los datos ingresados.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentStatusChip = (status: string) => {
    const label = getPaymentStatusLabel(status)
    
    switch (status) {
      case 'PAID':
        return <Chip label={label} color="success" size="small" />
      case 'OVERDUE':
        return <Chip label={label} color="error" size="small" />
      case 'PENDING':
        return <Chip label={label} color="warning" size="small" />
      default:
        return <Chip label={label} size="small" />
    }
  }


  return (
    <>
      <Navbar />
      
      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <AccountBalance 
            sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} 
          />
          <Typography variant="h3" component="h1" gutterBottom>
            Consulta tu Préstamo
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Ingresa tu DNI y código de seguimiento para consultar el estado de tu préstamo
          </Typography>
        </Box>

        {/* Formulario de Consulta */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                label="DNI"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                fullWidth
                required
                helperText="Solo números, sin puntos ni espacios"
                disabled={isLoading}
              />
              
              <TextField
                label="Código de Seguimiento"
                placeholder="Ej: LN-2024-001"
                value={loanTrack}
                onChange={(e) => setLoanTrack(e.target.value.toUpperCase())}
                fullWidth
                required
                helperText="Código proporcionado al momento del préstamo"
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Consultando...' : 'Consultar Préstamo'}
              </Button>
            </Box>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Paper>

        {/* Resultados de la Consulta */}
        {loanDetails && (
          <Box>
            {/* Información General del Préstamo */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Información del Préstamo
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
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
                        Monto Original
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary.main">
                      ${loanDetails.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interés: {(loanDetails.baseInterestRate * 100).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Frecuencia
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {getFrequencyLabel(loanDetails.paymentFrequency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loanDetails.totalPayments} cuotas totales
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Progreso
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="success.main">
                      {loanDetails.totalPayments - loanDetails.remainingPayments}/{loanDetails.totalPayments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loanDetails.remainingPayments} cuotas restantes
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Estado del préstamo */}
              <Alert 
                severity={loanDetails.status === 'ACTIVE' ? 'info' : loanDetails.status === 'OVERDUE' ? 'warning' : 'success'}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Estado del Préstamo: {getStatusLabel(loanDetails.status)}
                </Typography>
                <Typography variant="body2">
                  {loanDetails.status === 'ACTIVE' 
                    ? `Próximo pago: ${new Date(loanDetails.nextDueDate).toLocaleDateString('es-AR')}`
                    : loanDetails.status === 'OVERDUE'
                    ? 'Tienes pagos vencidos. Contacta a tu prestamista.'
                    : 'Préstamo completado exitosamente.'
                  }
                </Typography>
              </Alert>
            </Paper>

            {/* Detalle de Cuotas */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Detalle de Cuotas
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Cuota</strong></TableCell>
                      <TableCell align="right"><strong>Monto</strong></TableCell>
                      <TableCell align="center"><strong>Fecha Venc.</strong></TableCell>
                      <TableCell align="center"><strong>Estado</strong></TableCell>
                      <TableCell align="center"><strong>Fecha Pago</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loanDetails.subLoans.map((payment) => (
                      <TableRow 
                        key={payment.paymentNumber}
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          backgroundColor: payment.status === 'OVERDUE' ? 'error.light' : undefined
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={`Cuota ${payment.paymentNumber}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ${payment.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {new Date(payment.dueDate).toLocaleDateString('es-AR')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getPaymentStatusChip(payment.status)}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {payment.paidDate 
                              ? new Date(payment.paidDate).toLocaleDateString('es-AR')
                              : '-'
                            }
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
                Si tienes dudas sobre tu préstamo o necesitas asistencia, contacta directamente con tu prestamista.
                <br />
                Código de seguimiento: <strong>{loanDetails.loanTrack}</strong>
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Información de Ayuda */}
        {!loanDetails && (
          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              ¿No tienes tu código de seguimiento?
            </Typography>
            <Typography variant="body2">
              El código de seguimiento te fue proporcionado al momento de generar el préstamo. 
              Si no lo tienes, contacta con tu prestamista para obtenerlo.
            </Typography>
          </Alert>
        )}
      </Container>

      <Footer />
    </>
  )
}