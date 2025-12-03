'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box, 
  Typography, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close, TrendingUp, CalendarToday } from '@mui/icons-material'

interface TodayLoansModalProps {
  open: boolean
  onClose: () => void
  data: {
    date: string
    total: number
    totalAmount: number
    loans: Array<{
      montoTotalPrestado: number
      montoTotalADevolver: number
      nombrecliente: string
    }>
  } | null
}

export default function TodayLoansModal({ open, onClose, data }: TodayLoansModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!data) return null

  // Use totalAmount from backend directly - no calculations needed
  const totalPrestado = data.totalAmount
  const totalADevolver = data.loans.reduce((sum, loan) => sum + loan.montoTotalADevolver, 0)
  const totalIntereses = totalADevolver - totalPrestado

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        pt: 2,
        px: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Préstamos Otorgados Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, opacity: 0.9 }} />
              <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'capitalize' }}>
                {formatDate(data.date)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Summary Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
          gap: 2,
          mb: 3,
          mt: 3
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total Prestado
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
              {formatCurrency(totalPrestado)}
            </Typography>
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              bgcolor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Cantidad de Préstamos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {data.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.total === 1 ? 'préstamo' : 'préstamos'}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Loans Table */}
        {data.loans.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Préstamos
            </Typography>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Monto Prestado</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {isMobile ? 'Total' : 'Total a Devolver'}
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Interés</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.loans.map((loan, index) => {
                    // Use montoTotalPrestado directly from backend
                    const montoPrestado = loan.montoTotalPrestado
                    const interes = loan.montoTotalADevolver - montoPrestado
                    const porcentajeInteres = montoPrestado > 0 
                      ? ((interes / montoPrestado) * 100).toFixed(1)
                      : '0.0'

                    return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.02) 
                          },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {loan.nombrecliente}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Prestado: {formatCurrency(montoPrestado)}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500} color="primary.main">
                              {formatCurrency(montoPrestado)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(loan.montoTotalADevolver)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="center">
                            <Chip 
                              label={`+${porcentajeInteres}%`}
                              size="small" 
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {formatCurrency(interes)}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Interest Summary */}
            {isMobile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Interés Total Generado
                </Typography>
                <Typography variant="h6" fontWeight={600} color="warning.main" sx={{ mt: 0.5 }}>
                  {formatCurrency(totalIntereses)}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay préstamos registrados para hoy
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

