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
  IconButton,
  useMediaQuery,
  useTheme,
  Divider
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loanTrackingNumber, setLoanTrackingNumber] = useState<string | null>(null)
  const { createLoan } = useLoans()

  // Handle closing after success - reset everything and notify parent
  const handleCloseAfterSuccess = () => {
    setSuccess(false)
    setLoanTrackingNumber(null)
    setError(null)
    onClose()
    onLoanCreated?.() // This will close parent and trigger form reset
  }

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

      // Creating loan
      const loan = await createLoan(createLoanData);
      setLoanTrackingNumber(loan.loanTrack)
      
      // Show success modal
      setSuccess(true)


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
      <Dialog 
        open={open} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ position: 'relative', textAlign: 'right', pb: 0 }}>
          <IconButton
            onClick={handleCloseAfterSuccess}
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
        <DialogContent sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
          <CheckCircle sx={{ fontSize: { xs: 60, sm: 80 }, color: 'success.main', mb: 3 }} />
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom color="success.main">
            ¡Préstamo Creado Exitosamente!
          </Typography>
          
          <Box sx={{ my: 4, p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Número de Seguimiento
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontFamily: 'monospace', 
                color: 'primary.main',
                fontWeight: 'bold',
                letterSpacing: { xs: 1, sm: 2 },
                wordBreak: 'break-word'
              }}
            >
              {loanTrackingNumber}
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
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
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: isMobile ? '100vh' : '80vh',
          m: isMobile ? 0 : 2,
          mt: isMobile ? 0 : 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, pr: 4 }}>
          <MonetizationOn color="primary" sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant={isMobile ? "h6" : "h5"} component="div" noWrap>
              Simulación de Préstamo
            </Typography>
            <Typography 
              variant={isMobile ? "body2" : "subtitle1"} 
              color="text.secondary"
              noWrap
            >
              {clientName}
            </Typography>
          </Box>
        </Box>
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

      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 4 }}>
          {/* Resumen Financiero y Detalles Combinados */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, 
              gap: { xs: 3, sm: 4 } 
            }}>
              {/* Columna Izquierda: Resumen Financiero */}
              <Box>
                <Typography variant="h6" gutterBottom color="primary.main" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                  Resumen Financiero
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Principal:</Typography>
                    <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                      ${parseFloat(formData.amount).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total a Cobrar:</Typography>
                    <Typography variant="h6" color="primary.main" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                      ${totalWithInterest.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Monto por Cuota:</Typography>
                    <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                      ${simulatedLoans[0]?.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Columna Derecha: Detalles del Préstamo */}
              <Box>
                {isMobile && <Divider sx={{ mb: 2 }} />}
                <Typography variant="h6" gutterBottom color="primary.main" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                  Detalles del Préstamo
                </Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="body2" fontSize={{ xs: '0.875rem' }}>
                    <strong>Tasa base:</strong> {formData.baseInterestRate}%
                  </Typography>
                  <Typography variant="body2" fontSize={{ xs: '0.875rem' }}>
                    <strong>Frecuencia:</strong> {getFrequencyLabel(formData.paymentFrequency)}
                    {formData.paymentFrequency !== 'DAILY' && ` (${getDayText(formData.paymentDay)})`}
                  </Typography>
                  <Typography variant="body2" fontSize={{ xs: '0.875rem' }}>
                    <strong>Total cuotas:</strong> {simulatedLoans.length}
                  </Typography>
                  {formData.description && (
                    <Typography variant="body2" fontSize={{ xs: '0.875rem' }} sx={{ wordBreak: 'break-word' }}>
                      <strong>Descripción:</strong> {formData.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Export Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary.main" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
              Exportar Presupuesto
            </Typography>
            <Box sx={{ 
              '& button': { 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 },
                px: { xs: 1.5, sm: 2 }
              } 
            }}>
              <SimulationExportButtons 
                simulatedLoans={simulatedLoans}
                formData={formData}
                clientName={clientName}
                variant="default"
                showLabels={!isMobile}
              />
            </Box>
          </Box>

          {/* Tabla de Cuotas */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }} fontSize={{ xs: '1rem', sm: '1.25rem' }}>
            Plan de Pagos ({simulatedLoans.length} cuotas)
          </Typography>
          
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: { xs: 300, sm: 400 },
              overflowX: 'auto'
            }}
          >
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: { xs: 60, sm: 80 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Cuota</strong>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: { xs: 80, sm: 100 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Fecha</strong>
                  </TableCell>
                  {/* {!isMobile && (
                    <TableCell align="right" sx={{ minWidth: 100, fontSize: '0.875rem' }}>
                      <strong>Principal</strong>
                    </TableCell>
                  )} */}
                  <TableCell align="right" sx={{ minWidth: { xs: 80, sm: 100 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Total a Pagar</strong>
                  </TableCell>
                  {!isMobile && (
                    <TableCell align="center" sx={{ minWidth: 100, fontSize: '0.875rem' }}>
                      <strong>Estado</strong>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {simulatedLoans.map((loan) => {
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
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
                          {loan.dueDate.toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: isMobile ? '2-digit' : 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      {/* {!isMobile && (
                        <TableCell align="right">
                          <Typography variant="body2" fontSize="0.875rem">
                            ${loan.amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                      )} */}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
                          ${loan.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="center">
                          <Chip 
                            label="Pendiente" 
                            size="small" 
                            color="warning"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                      )}
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

      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        gap: { xs: 1, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        '& > button': {
          width: { xs: '100%', sm: 'auto' },
          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
          py: { xs: 1, sm: 0.75 }
        }
      }}>
        <Button
          onClick={onClose}
          disabled={isCreating}
          fullWidth={isMobile}
          sx={{ order: { xs: 3, sm: 1 } }}
        >
          Cancelar
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isCreating}
          fullWidth={isMobile}
          sx={{ order: { xs: 2, sm: 2 } }}
        >
          Modificar
        </Button>
        <Button
          onClick={handleConfirmLoan}
          variant="contained"
          disabled={isCreating}
          fullWidth={isMobile}
          sx={{ 
            minWidth: { sm: 150 },
            order: { xs: 1, sm: 3 }
          }}
        >
          {isCreating ? 'Creando...' : 'Confirmar Préstamo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
