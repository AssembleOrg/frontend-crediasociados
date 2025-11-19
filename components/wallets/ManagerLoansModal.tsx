'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material'
import { Close, ExpandMore, AccountBalance, Person, Phone, Email, LocationOn } from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'
// Helper functions for formatting
const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

interface ManagerLoansModalProps {
  open: boolean
  onClose: () => void
  managerId: string | null
  managerName?: string
}

export default function ManagerLoansModal({ 
  open, 
  onClose, 
  managerId,
  managerName = 'Cobrador'
}: ManagerLoansModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [managerDetail, setManagerDetail] = useState<{
    manager: {
      id: string
      fullName: string
      email: string
      clientQuota: number
      usedClientQuota: number
      availableClientQuota: number
    }
    dineroEnCalle: number
    totalLoans: number
    loans: Array<{
      id: string
      loanTrack: string
      amount: number
      originalAmount: number
      currency: string
      status: string
      baseInterestRate: number
      penaltyInterestRate: number
      paymentFrequency: string
      totalPayments: number
      description: string | null
      createdAt: string
      client: {
        id: string
        fullName: string
        dni: string | null
        phone: string | null
        email: string | null
        address: string | null
      }
      subLoans: Array<{
        id: string
        paymentNumber: number
        amount: number
        totalAmount: number
        status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
        dueDate: string
        paidDate: string | null
        paidAmount: number
        daysOverdue: number
        createdAt: string
        pendingAmount: number
        isFullyPaid: boolean
      }>
      stats: {
        totalSubLoans: number
        paidSubLoans: number
        pendingSubLoans: number
        overdueSubLoans: number
        partialSubLoans: number
        totalPaid: number
        totalPending: number
      }
    }>
  } | null>(null)

  useEffect(() => {
    if (open && managerId) {
      loadManagerDetail()
    } else {
      setManagerDetail(null)
      setError(null)
    }
  }, [open, managerId])

  const loadManagerDetail = async () => {
    if (!managerId) return

    setLoading(true)
    setError(null)
    try {
      const data = await collectorWalletService.getManagerDetail(managerId)
      setManagerDetail(data)
    } catch (err: any) {
      console.error('Error loading manager detail:', err)
      setError(err.response?.data?.message || 'Error al cargar información del manager')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'OVERDUE':
        return 'error'
      case 'PARTIAL':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'Pagado'
      case 'PENDING':
        return 'Pendiente'
      case 'OVERDUE':
        return 'Vencido'
      case 'PARTIAL':
        return 'Parcial'
      default:
        return status
    }
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
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '90vh',
          m: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 3 }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        pt: 3,
        px: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalance sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Dinero en Calle - {managerName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              Préstamos activos y cuotas pendientes
            </Typography>
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

      <DialogContent sx={{ p: { xs: 2, sm: 3, mt: 2 }, bgcolor: 'background.default' }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando información...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Manager Info Summary */}
        {managerDetail && !loading && (
          <>
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 2 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Dinero en Calle
                </Typography>
                <Typography variant="h5" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                  {formatCurrency(managerDetail.dineroEnCalle)}
                </Typography>
              </Paper>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Total de Préstamos Activos
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                  {managerDetail.totalLoans}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Loans List */}
            {managerDetail.loans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <AccountBalance sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No hay préstamos activos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Este cobrador no tiene préstamos activos en este momento
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Préstamos Activos
                </Typography>
                {managerDetail.loans.map((loan) => (
                  <Accordion key={loan.id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {loan.loanTrack}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {loan.client.fullName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Chip
                            label={formatCurrency(loan.amount)}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={`${loan.stats.paidSubLoans}/${loan.stats.totalSubLoans} pagadas`}
                            size="small"
                            color={loan.stats.paidSubLoans === loan.stats.totalSubLoans ? 'success' : 'warning'}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* Client Info */}
                      <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Información del Cliente
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">{loan.client.fullName}</Typography>
                          </Box>
                          {loan.client.dni && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">DNI:</Typography>
                              <Typography variant="body2">{loan.client.dni}</Typography>
                            </Box>
                          )}
                          {loan.client.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">{loan.client.phone}</Typography>
                            </Box>
                          )}
                          {loan.client.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Email fontSize="small" color="action" />
                              <Typography variant="body2">{loan.client.email}</Typography>
                            </Box>
                          )}
                          {loan.client.address && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2">{loan.client.address}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Loan Stats */}
                      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Total Pagado</Typography>
                          <Typography variant="body1" fontWeight={600} color="success.main">
                            {formatCurrency(loan.stats.totalPaid)}
                          </Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.08), borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Total Pendiente</Typography>
                          <Typography variant="body1" fontWeight={600} color="warning.main">
                            {formatCurrency(loan.stats.totalPending)}
                          </Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.08), borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Cuotas Vencidas</Typography>
                          <Typography variant="body1" fontWeight={600} color="error.main">
                            {loan.stats.overdueSubLoans}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* SubLoans Table */}
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Cuotas ({loan.subLoans.length})
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Vencimiento</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Pagado</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Pendiente</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loan.subLoans.map((subLoan) => (
                              <TableRow key={subLoan.id} hover>
                                <TableCell>{subLoan.paymentNumber}</TableCell>
                                <TableCell align="right">{formatCurrency(subLoan.totalAmount)}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={getStatusLabel(subLoan.status)}
                                    size="small"
                                    color={getStatusColor(subLoan.status)}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {formatDate(subLoan.dueDate)}
                                  </Typography>
                                  {subLoan.daysOverdue > 0 && (
                                    <Typography variant="caption" color="error.main">
                                      ({subLoan.daysOverdue} días)
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="success.main">
                                    {formatCurrency(subLoan.paidAmount)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="warning.main" fontWeight={600}>
                                    {formatCurrency(subLoan.pendingAmount)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

