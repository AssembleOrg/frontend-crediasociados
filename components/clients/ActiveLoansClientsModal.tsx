'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Alert,
} from '@mui/material'
import {
  Close,
  AccountBalance,
  Search,
  PictureAsPdf,
  TrendingUp,
} from '@mui/icons-material'
import { Button } from '@mui/material'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ActiveLoansPDF } from './ActiveLoansPDF'
import { clientsService } from '@/services/clients.service'
import { collectorWalletService } from '@/services/collector-wallet.service'
import PhoneChip from '@/components/ui/PhoneChip'
import { requestDeduplicator } from '@/lib/request-deduplicator'
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
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'WITH_DEBT' | 'PAID_UP'>('WITH_DEBT')
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

  // Ref para prevenir llamadas duplicadas
  const loadingManagerRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (open && managerIdToUse) {
      // Prevenir llamadas duplicadas para el mismo manager
      if (loadingManagerRef.current === managerIdToUse) return
      loadManagerDetail()
    } else if (open && !managerIdToUse && isSubadmin) {
      setManagerDetail(null)
      setError(null)
      loadingManagerRef.current = null
    }
    // Reset search and debt filter when manager changes or modal opens
    if (open) {
      setSearchQuery('')
      setDebtFilter('WITH_DEBT')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, managerIdToUse, isSubadmin])

  const loadManagerDetail = async () => {
    if (!managerIdToUse) return

    loadingManagerRef.current = managerIdToUse
    setLoading(true)
    setError(null)
    try {
      // Usar deduplicador con caché de 30 segundos
      const data = await requestDeduplicator.dedupe(
        `manager:detail:${managerIdToUse}`,
        () => collectorWalletService.getManagerDetail(managerIdToUse),
        { ttl: 30000 }
      )
      setManagerDetail(data)
    } catch (err: any) {
      // Error loading manager detail
      setError(err.response?.data?.message || 'Error al cargar los préstamos activos')
      setManagerDetail(null)
    } finally {
      setLoading(false)
    }
  }

  // Filter loans based on search query AND debt filter
  const filteredLoans = useMemo(() => {
    if (!managerDetail || !managerDetail.loans) return []

    const byDebt = managerDetail.loans.filter((loan) => {
      if (debtFilter === 'WITH_DEBT') return loan.stats.totalPending > 0
      if (debtFilter === 'PAID_UP') return loan.stats.totalPending === 0
      return true
    })

    if (!searchQuery.trim()) return byDebt

    const query = searchQuery.toLowerCase().trim()
    return byDebt.filter(loan => {
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
  }, [managerDetail, searchQuery, debtFilter])

  // Counts por estado de deuda (sobre el total, no sobre el filtrado por search)
  const debtCounts = useMemo(() => {
    if (!managerDetail?.loans) return { all: 0, withDebt: 0, paidUp: 0, totalDebt: 0 }
    const withDebt = managerDetail.loans.filter((l) => l.stats.totalPending > 0)
    const paidUp = managerDetail.loans.filter((l) => l.stats.totalPending === 0)
    const totalDebt = withDebt.reduce((sum, l) => sum + l.stats.totalPending, 0)
    return {
      all: managerDetail.loans.length,
      withDebt: withDebt.length,
      paidUp: paidUp.length,
      totalDebt,
    }
  }, [managerDetail])

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

  const formatCurrencyCompact = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return `${sign}$${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(abs)}`;
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
          width: { xs: '100%', sm: 'auto' },
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
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalance sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Clientes con Préstamos Activos
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
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
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {option.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  )
                }}
                noOptionsText="No se encontraron managers"
              />
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Summary - Grouped List */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Paper sx={{ mb: 3, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
            <List disablePadding>
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>
                    <AccountBalance sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Préstamos Activos'
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
                <Typography variant='body1' fontWeight={700} color='primary.main'>
                  {searchQuery ? filteredLoans.length : managerDetail.totalLoans}
                  {searchQuery && ` de ${managerDetail.totalLoans}`}
                </Typography>
              </ListItem>
              <Divider component='li' />
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'success.main', display: 'flex' }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Dinero en Calle'
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
                <Typography variant='body1' fontWeight={700} color='success.main'>
                  {formatCurrencyCompact(managerDetail.dineroEnCalle)}
                </Typography>
              </ListItem>
              <Divider component='li' />
              <ListItem sx={{ py: 1.25, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ color: 'warning.main', display: 'flex' }}>
                    <AccountBalance sx={{ fontSize: 20 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='Total adeudado actual'
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondary={`${debtCounts.withDebt} con deuda · ${debtCounts.paidUp} al día`}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
                <Typography variant='body1' fontWeight={700} color='warning.main'>
                  {formatCurrencyCompact(debtCounts.totalDebt)}
                </Typography>
              </ListItem>
            </List>
          </Paper>
        )}

        {/* Search Input */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Box sx={{ mb: 2 }}>
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

        {/* Debt Filter Chips */}
        {managerIdToUse && !loading && !error && managerDetail && managerDetail.loans.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {([
              { value: 'ALL',       label: `Todos (${debtCounts.all})`,            color: '#1976d2' },
              { value: 'WITH_DEBT', label: `Deben (${debtCounts.withDebt})`,       color: '#ed6c02' },
              { value: 'PAID_UP',   label: `Al día (${debtCounts.paidUp})`,        color: '#2e7d32' },
            ] as const).map((opt) => {
              const isSelected = debtFilter === opt.value
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  onClick={() => setDebtFilter(opt.value)}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor: isSelected ? opt.color : 'transparent',
                    color: isSelected ? 'white' : opt.color,
                    border: `1.5px solid ${opt.color}`,
                    '&:hover': { bgcolor: isSelected ? opt.color : `${opt.color}15` },
                  }}
                />
              )
            })}
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
                      color="primary"
                      startIcon={<PictureAsPdf />}
                      disabled={pdfLoading}
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
                  {searchQuery
                    ? `No se encontraron préstamos que coincidan con "${searchQuery}"`
                    : debtFilter === 'WITH_DEBT'
                      ? 'No hay préstamos con deuda actual'
                      : debtFilter === 'PAID_UP'
                        ? 'No hay préstamos al día'
                        : 'No hay préstamos para mostrar'}
                </Typography>
              </Paper>
            ) : isMobile ? (
              /* Mobile: Cards */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredLoans.map((loan) => {
                  const intereses = loan.amount - (loan.originalAmount || 0)
                  return (
                    <Card
                      key={loan.id}
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        borderLeft: 3,
                        borderLeftColor: 'primary.main',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Header */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1.5,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {loan.client.fullName}
                            </Typography>
                            {loan.client.phone && (
                              <Box sx={{ mt: 0.25 }}>
                                <PhoneChip phone={loan.client.phone} size="small" />
                              </Box>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(loan.createdAt)}
                          </Typography>
                        </Box>
                        {/* Grid 2x2 */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Monto Original
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrencyCompact(loan.originalAmount || 0)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Intereses
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrencyCompact(intereses)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Pagado
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                            >
                              {formatCurrencyCompact(loan.stats.totalPaid)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Faltante
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="warning.main"
                            >
                              {formatCurrencyCompact(loan.stats.totalPending)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            ) : (
              /* Desktop: Table */
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
                            {loan.client.phone && (
                              <Box sx={{ mt: 0.25 }}>
                                <PhoneChip phone={loan.client.phone} size="small" />
                              </Box>
                            )}
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

