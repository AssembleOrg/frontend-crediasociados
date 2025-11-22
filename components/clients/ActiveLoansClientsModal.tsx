'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  TextField,
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
} from '@mui/material'
import { 
  Close, 
  AccountBalance, 
  Search,
  PictureAsPdf
} from '@mui/icons-material'
import { Button } from '@mui/material'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ActiveLoansPDF } from './ActiveLoansPDF'
import { clientsService } from '@/services/clients.service'
import { collectorWalletService } from '@/services/collector-wallet.service'
import { useUsers } from '@/hooks/useUsers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { DateTime } from 'luxon'

interface ActiveLoansClientsModalProps {
  open: boolean
  onClose: () => void
}

export default function ActiveLoansClientsModal({ open, onClose }: ActiveLoansClientsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { users } = useUsers()
  const currentUser = useCurrentUser()
  
  // Determine if current user is a manager (prestamista)
  const isManager = currentUser?.role === 'prestamista'
  const isSubadmin = currentUser?.role === 'subadmin'
  
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
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
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter managers (prestamistas)
  const managers = users.filter(user => user.role === 'prestamista')
  const selectedManagerData = managers.find(m => m.id === selectedManager)
  
  // Auto-select current user if manager
  const managerIdToUse = isManager ? currentUser?.id : selectedManager

  useEffect(() => {
    // Auto-select current user if manager
    if (open && isManager && currentUser?.id) {
      setSelectedManager(currentUser.id)
    } else if (open && isSubadmin && !selectedManager) {
      setSelectedManager(null)
    }
  }, [open, isManager, isSubadmin, currentUser?.id])

  useEffect(() => {
    if (open && managerIdToUse) {
      loadManagerDetail()
    } else if (open && !managerIdToUse && isSubadmin) {
      setManagerDetail(null)
      setError(null)
    }
    // Reset search when manager changes or modal opens
    if (open) {
      setSearchQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, managerIdToUse, isSubadmin])

  const loadManagerDetail = async () => {
    if (!managerIdToUse) return

    setLoading(true)
    setError(null)
    try {
      const data = await collectorWalletService.getManagerDetail(managerIdToUse)
      setManagerDetail(data)
    } catch (err: any) {
      // Error loading manager detail
      setError(err.response?.data?.message || 'Error al cargar los préstamos activos')
      setManagerDetail(null)
    } finally {
      setLoading(false)
    }
  }

  // Filter loans based on search query
  const filteredLoans = useMemo(() => {
    if (!managerDetail || !managerDetail.loans) return []
    
    if (!searchQuery.trim()) return managerDetail.loans
    
    const query = searchQuery.toLowerCase().trim()
    return managerDetail.loans.filter(loan => {
      const clientName = loan.client.fullName?.toLowerCase() || ''
      const loanTrack = loan.loanTrack?.toLowerCase() || ''
      const clientDni = loan.client.dni?.toLowerCase() || ''
      const clientPhone = loan.client.phone?.toLowerCase() || ''
      const clientAddress = loan.client.address?.toLowerCase() || ''
      
      return clientName.includes(query) || 
             loanTrack.includes(query) ||
             clientDni.includes(query) ||
             clientPhone.includes(query) ||
             clientAddress.includes(query)
    })
  }, [managerDetail, searchQuery])

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString)
    return date.toFormat('dd/MM/yyyy')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'APPROVED':
        return 'info'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Activo'
      case 'APPROVED':
        return 'Aprobado'
      case 'PENDING':
        return 'Pendiente'
      default:
        return status
    }
  }

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // If it starts with +54, keep it
    // If it starts with 54, add +
    // If it starts with 0 or 9, add +54
    // Otherwise, assume it's a local number and add +54
    if (cleaned.startsWith('+54')) {
      return cleaned
    } else if (cleaned.startsWith('54')) {
      return '+' + cleaned
    } else if (cleaned.startsWith('0')) {
      return '+54' + cleaned.substring(1)
    } else if (cleaned.startsWith('9')) {
      return '+54' + cleaned
    } else {
      // Assume it's a local number without country code
      return '+54' + cleaned
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
        pt: 2,
        px: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalance sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Clientes con Préstamos Activos
          </Typography>
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
        {/* Manager Selector - Only for Subadmin */}
        {isSubadmin && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Selecciona un Manager
              </Typography>
              <Autocomplete
                options={managers}
                getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                value={selectedManagerData || null}
                onChange={(_, newValue) => setSelectedManager(newValue?.id || null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar manager"
                    placeholder="Escribe el nombre o email del manager"
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No se encontraron managers"
              />
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Manager Info - Only for Manager */}
        {isManager && currentUser && (
          <>
            <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#1976d2', 0.1), borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Tus Clientes con Préstamos Activos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.fullName} ({currentUser.email})
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Summary Cards */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total de Préstamos Activos
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {searchQuery ? filteredLoans.length : managerDetail.totalLoans}
                {searchQuery && ` de ${managerDetail.totalLoans}`}
              </Typography>
            </Paper>
            <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Dinero en Calle
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {formatCurrency(managerDetail.dineroEnCalle)}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Search Input */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, teléfono, dirección o número de préstamo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando clientes con préstamos activos...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State - No Manager Selected (Only for Subadmin) */}
        {isSubadmin && !managerIdToUse && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecciona un manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elige un manager del selector para ver sus clientes con préstamos activos
            </Typography>
          </Box>
        )}

        {/* Empty State - No Loans */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay préstamos activos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isManager 
                ? 'No tienes préstamos activos'
                : `${selectedManagerData?.fullName || 'Este manager'} no tiene préstamos activos`
              }
            </Typography>
          </Box>
        )}

        {/* Loans List */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Préstamos Activos
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {searchQuery && (
                  <Chip 
                    label={`${filteredLoans.length} de ${managerDetail.totalLoans}`}
                    color="info"
                    size="small"
                  />
                )}
                <PDFDownloadLink
                  document={<ActiveLoansPDF managerDetail={managerDetail} searchQuery={searchQuery || undefined} />}
                  fileName={`prestamos-activos-${managerDetail.manager.fullName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ loading: pdfLoading }) => (
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      disabled={pdfLoading}
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                        },
                      }}
                    >
                      {pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </Box>
            </Box>
            {filteredLoans.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron préstamos que coincidan con "{searchQuery}"
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#1976d2', 0.05) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>M.Ori.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Int.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Pagado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Faltante</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Fecha Sol.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLoans.map((loan) => {
                      const intereses = loan.amount - (loan.originalAmount || 0)
                      return (
                        <TableRow key={loan.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {loan.client.fullName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(loan.originalAmount || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(intereses)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="success.main" fontWeight={500}>
                              {formatCurrency(loan.stats.totalPaid)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              {formatCurrency(loan.stats.totalPending)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatDate(loan.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

