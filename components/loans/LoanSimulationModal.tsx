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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material'
import {
  CheckCircle,
  MonetizationOn,
  Close
} from '@mui/icons-material'
import type { components } from '@/types/api-generated'
import { useLoans } from '@/hooks/useLoans'
import { SimulationExportButtons } from '@/components/loans/SimulationExportButtons'
import { getFrequencyLabel, unformatAmount } from '@/lib/formatters'

type CreateLoanDto = components['schemas']['CreateLoanDto']

interface SubLoan {
  paymentNumber: number
  amount: number
  totalAmount: number
  dueDate: Date
}

interface LoanSimulationModalProps {
  open: boolean
  onClose: () => void
  onLoanCreated?: () => void
  simulatedLoans: SubLoan[]
  formData: {
    clientId: string
    amount: string
    baseInterestRate: string
    penaltyInterestRate: string
    currency: 'ARS'
    paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    paymentDay: string
    totalPayments: string
    firstDueDate: Date | null
    description: string
  }
  clientName?: string
}

export function LoanSimulationModal({
  open,
  onClose,
  onLoanCreated,
  simulatedLoans,
  formData,
  clientName = 'Cliente seleccionado'
}: LoanSimulationModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loanTrackingNumber, setLoanTrackingNumber] = useState<string | null>(null)
  const { createLoan } = useLoans()

  const handleConfirmLoan = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const createLoanData: CreateLoanDto = {
        clientId: formData.clientId,
        amount: parseFloat(unformatAmount(formData.amount)), // Desformatear el monto primero
        baseInterestRate: parseFloat(formData.baseInterestRate) / 100, // Convertir % a decimal: 5 → 0.05
        penaltyInterestRate: (parseFloat(formData.penaltyInterestRate) || 0) / 100, // Convertir % a decimal
        currency: formData.currency,
        paymentFrequency: formData.paymentFrequency,
        paymentDay:
          formData.paymentFrequency === 'DAILY'
            ? undefined
            : (['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].includes(formData.paymentDay as string)
                ? (formData.paymentDay as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY')
                : undefined),
        totalPayments: parseInt(formData.totalPayments),
        firstDueDate: formData.firstDueDate?.toISOString(),
        description: formData.description || undefined,
        notes: undefined, // Optional field - backend will handle if needed
        loanTrack: undefined // Optional field - backend will auto-generate
      }

      console.log('=== CREANDO PRÉSTAMO ===')
      console.log('Datos del préstamo:', {
        cliente: clientName,
        monto: `$${parseFloat(formData.amount).toLocaleString()}`,
        cuotas: formData.totalPayments,
        frecuencia: formData.paymentFrequency
      })
      
      const loan = await createLoan(createLoanData);
      setLoanTrackingNumber(loan.loanTrack)
      
      console.log('✅ Préstamo creado exitosamente:', loan.loanTrack)
      
      // ✅ First close the parent CreateLoanModal (blue background)
      
      // ✅ Then show success modal on top
      setSuccess(true)
      // onLoanCreated?.()


    } catch (err: unknown) {
      setError((err as Error).message || 'Error al crear el préstamo')
    } finally {
      setIsCreating(false)
    }
  }

  const totalWithInterest = simulatedLoans.reduce((sum, loan) => sum + loan.totalAmount, 0)
  const totalPrincipal = simulatedLoans.reduce((sum, loan) => sum + loan.amount, 0)
  const totalInterest = totalWithInterest - totalPrincipal

  const getDayText = (day: string) => {
    switch (day) {
      case 'MONDAY':
        return 'Lunes'
      case 'TUESDAY':
        return 'Martes'
      case 'WEDNESDAY':
        return 'Miércoles'
      case 'THURSDAY':
        return 'Jueves'
      case 'FRIDAY':
        return 'Viernes'
      case 'SATURDAY':
        return 'Sábado'
      case 'SUNDAY':
        return 'Domingo'
      default:
        return day
    }
  }


  if (success) {
    return (
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ position: 'relative', textAlign: 'right', pb: 0 }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500'
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom color="success.main">
            ¡Préstamo Creado Exitosamente!
          </Typography>
          
          <Box sx={{ my: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Número de Seguimiento
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: 'monospace', 
                color: 'primary.main',
                fontWeight: 'bold',
                letterSpacing: 2
              }}
            >
              {loanTrackingNumber}
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Información importante:
            </Typography>
            <Typography variant="body2">
              • Guarda este número de seguimiento<br />
              • El cliente puede usarlo junto con su DNI para consultar el préstamo<br />
              • Cliente: <strong>{clientName}</strong><br />
              • Monto: <strong>${parseFloat(formData.amount).toLocaleString()}</strong>
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            Puedes usar este número para probar la consulta pública
          </Typography>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MonetizationOn color="primary" />
          <Box>
            <Typography variant="h5" component="div">
              Simulación de Préstamo
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {clientName} • {getFrequencyLabel(formData.paymentFrequency)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 4 }}>
          {/* Resumen Financiero y Detalles Combinados */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4 }}>
              {/* Columna Izquierda: Resumen Financiero */}
              <Box>
                <Typography variant="h6" gutterBottom color="primary.main">
                  Resumen Financiero
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Principal:</Typography>
                    <Typography variant="h6">${parseFloat(formData.amount).toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Interés:</Typography>
                    <Typography variant="h6" color="warning.main">${totalInterest.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total a Cobrar:</Typography>
                    <Typography variant="h6" color="primary.main">${totalWithInterest.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Monto por Cuota:</Typography>
                    <Typography variant="h6">${simulatedLoans[0]?.totalAmount.toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Columna Derecha: Detalles del Préstamo */}
              <Box>
                <Typography variant="h6" gutterBottom color="primary.main">
                  Detalles del Préstamo
                </Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Tasa base:</strong> {formData.baseInterestRate}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Penalización:</strong> 0% (por defecto)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Frecuencia:</strong> {getFrequencyLabel(formData.paymentFrequency)}
                    {formData.paymentFrequency !== 'DAILY' && ` (${getDayText(formData.paymentDay)})`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total cuotas:</strong> {simulatedLoans.length}
                  </Typography>
                  {formData.description && (
                    <Typography variant="body2">
                      <strong>Descripción:</strong> {formData.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Export Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary.main">
              Exportar Presupuesto
            </Typography>
            <SimulationExportButtons 
              simulatedLoans={simulatedLoans}
              formData={formData}
              clientName={clientName}
              variant="default"
              showLabels={true}
            />
          </Box>

          {/* Tabla de Cuotas */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Plan de Pagos ({simulatedLoans.length} cuotas)
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cuota</strong></TableCell>
                  <TableCell align="right"><strong>Fecha Venc.</strong></TableCell>
                  <TableCell align="right"><strong>Principal</strong></TableCell>
                  <TableCell align="right"><strong>Interés</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {simulatedLoans.map((loan) => {
                  const interestAmount = loan.totalAmount - loan.amount
                  return (
                    <TableRow 
                      key={loan.paymentNumber}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Chip 
                          label={`#${loan.paymentNumber}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {loan.dueDate.toLocaleDateString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ${loan.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          ${interestAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${loan.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label="Pendiente" 
                          size="small" 
                          color="warning" 
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>


          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={isCreating}
        >
          Cancelar
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isCreating}
        >
          Modificar
        </Button>
        <Button
          onClick={handleConfirmLoan}
          variant="contained"
          disabled={isCreating}
          sx={{ minWidth: 150 }}
        >
          {isCreating ? 'Creando...' : 'Confirmar Préstamo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
