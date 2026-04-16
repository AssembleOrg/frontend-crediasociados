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
  Collapse,
  Divider,
} from '@mui/material'
import {
  Close,
  Warning,
  Search,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material'
import { subLoansService } from '@/services/sub-loans.service'
import type { OverdueClientEntry } from '@/services/sub-loans.service'
import { useUsers } from '@/hooks/useUsers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { DateTime } from 'luxon'
import { getFrequencyLabel } from '@/lib/formatters'

interface OverdueClientsModalProps {
  open: boolean
  onClose: () => void
}

export default function OverdueClientsModal({ open, onClose }: OverdueClientsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { users } = useUsers()
  const currentUser = useCurrentUser()

  const isManager = currentUser?.role === 'prestamista'
  const isSubadmin = currentUser?.role === 'subadmin'

  const [allData, setAllData] = useState<OverdueClientEntry[]>([])
  const [totalOverdueAmount, setTotalOverdueAmount] = useState(0)
  const [totalOverdueInstallments, setTotalOverdueInstallments] = useState(0)
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

  const managers = users.filter(user => user.role === 'prestamista')
  const selectedManagerData = managers.find(m => m.id === selectedManager)

  useEffect(() => {
    if (open) {
      loadData()
      setSearchQuery('')
      setExpandedClient(null)
      if (isManager && currentUser?.id) {
        setSelectedManager(currentUser.id)
      } else if (isSubadmin) {
        setSelectedManager(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await subLoansService.getOverdueClients()
      setAllData(response.clients)
      setTotalOverdueAmount(response.totalOverdueAmount)
      setTotalOverdueInstallments(response.totalOverdueInstallments)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar clientes con cuotas vencidas')
      setAllData([])
    } finally {
      setLoading(false)
    }
  }

  // Filter by selected manager, then by search query
  const managerFilteredData = useMemo(() => {
    if (!selectedManager) return allData
    return allData.filter(entry => entry.manager.id === selectedManager)
  }, [allData, selectedManager])

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return managerFilteredData
    const query = searchQuery.toLowerCase().trim()
    return managerFilteredData.filter(entry => {
      const clientName = entry.client.fullName?.toLowerCase() || ''
      const clientDni = entry.client.dni?.toLowerCase() || ''
      const clientPhone = entry.client.phone?.toLowerCase() || ''
      const loanTracks = entry.loans.map(l => l.loanTrack.toLowerCase()).join(' ')
      return clientName.includes(query) ||
        clientDni.includes(query) ||
        clientPhone.includes(query) ||
        loanTracks.includes(query)
    })
  }, [managerFilteredData, searchQuery])

  // Recalculate stats for current filter
  const filteredStats = useMemo(() => {
    const clients = managerFilteredData
    return {
      totalClients: clients.length,
      totalInstallments: clients.reduce((s, e) => s + e.totalOverdueInstallments, 0),
      totalAmount: clients.reduce((s, e) => s + e.totalOverdueAmount, 0),
    }
  }, [managerFilteredData])

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('dd/MM/yyyy')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const toggleClient = (clientId: string) => {
    setExpandedClient(prev => prev === clientId ? null : clientId)
  }

  const renderMobileCard = (entry: OverdueClientEntry) => {
    const isExpanded = expandedClient === entry.client.id
    return (
      <Paper
        key={entry.client.id}
        elevation={1}
        sx={{
          mb: 2,
          border: `1px solid ${alpha('#F44336', 0.3)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          onClick={() => toggleClient(entry.client.id)}
          sx={{
            p: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: alpha('#F44336', 0.04),
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {entry.client.fullName}
            </Typography>
            {!selectedManager && (
              <Typography variant="caption" color="text.secondary">
                Manager: {entry.manager.fullName}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={`${entry.totalOverdueInstallments} cuota${entry.totalOverdueInstallments > 1 ? 's' : ''}`}
                size="small"
                color="error"
                variant="outlined"
              />
              <Typography variant="body2" fontWeight={600} color="error.main">
                {formatCurrency(entry.totalOverdueAmount)}
              </Typography>
            </Box>
          </Box>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, pt: 0 }}>
            {entry.loans.map(loan => (
              <Box key={loan.id} sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {loan.loanTrack} - {getFrequencyLabel(loan.paymentFrequency)}
                </Typography>
                {loan.overdueInstallments.map(inst => (
                  <Box
                    key={inst.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        Cuota #{inst.paymentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Venc: {formatDate(inst.dueDate)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {formatCurrency(inst.pendingAmount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Collapse>
      </Paper>
    )
  }

  const renderDesktopTable = () => (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: alpha('#F44336', 0.06) }}>
            <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
            {!selectedManager && <TableCell sx={{ fontWeight: 600 }}>Manager</TableCell>}
            <TableCell sx={{ fontWeight: 600 }}>Prestamo</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Cuota</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Vencimiento</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Monto Cuota</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map(entry =>
            entry.loans.map((loan, loanIdx) =>
              loan.overdueInstallments.map((inst, instIdx) => {
                const isFirstOfClient = loanIdx === 0 && instIdx === 0
                const isFirstOfLoan = instIdx === 0
                const totalClientRows = entry.loans.reduce(
                  (sum, l) => sum + l.overdueInstallments.length, 0,
                )
                const totalLoanRows = loan.overdueInstallments.length

                return (
                  <TableRow key={inst.id} hover>
                    {isFirstOfClient && (
                      <>
                        <TableCell rowSpan={totalClientRows}>
                          <Typography variant="body2" fontWeight={500}>
                            {entry.client.fullName}
                          </Typography>
                          {entry.client.dni && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              DNI: {entry.client.dni}
                            </Typography>
                          )}
                        </TableCell>
                        {!selectedManager && (
                          <TableCell rowSpan={totalClientRows}>
                            <Typography variant="body2">
                              {entry.manager.fullName}
                            </Typography>
                          </TableCell>
                        )}
                      </>
                    )}
                    {isFirstOfLoan && (
                      <TableCell rowSpan={totalLoanRows}>
                        <Typography variant="body2" fontWeight={500}>
                          {loan.loanTrack}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getFrequencyLabel(loan.paymentFrequency)}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Chip
                        label={`#${inst.paymentNumber}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDate(inst.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(inst.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        {formatCurrency(inst.pendingAmount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              }),
            ),
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const hasData = !loading && !error && allData.length > 0
  const showContent = hasData || (!loading && !error && selectedManager)

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
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Warning sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Clientes con Cuotas Vencidas
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
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
                onChange={(_, newValue) => {
                  setSelectedManager(newValue?.id || null)
                  setSearchQuery('')
                  setExpandedClient(null)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar manager"
                    placeholder="Todos los managers"
                    variant="outlined"
                  />
                )}
                renderOption={({ key, ...props }, option) => (
                  <Box component="li" key={key} {...props}>
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

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando clientes con cuotas vencidas...
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty - no data at all */}
        {!loading && !error && allData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Warning sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sin cuotas vencidas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay clientes con cuotas vencidas en este momento
            </Typography>
          </Box>
        )}

        {/* Content */}
        {hasData && (
          <>
            {/* Summary */}
            <Box
              sx={{
                mb: 3,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#F44336', 0.05) }}>
                <Typography variant="caption" color="text.secondary">
                  Clientes con Vencimientos
                </Typography>
                <Typography variant="h5" fontWeight={600} color="error.main">
                  {filteredStats.totalClients}
                </Typography>
              </Paper>
              <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#F44336', 0.05) }}>
                <Typography variant="caption" color="text.secondary">
                  Cuotas Vencidas
                </Typography>
                <Typography variant="h5" fontWeight={600} color="error.main">
                  {filteredStats.totalInstallments}
                </Typography>
              </Paper>
              <Paper elevation={1} sx={{ p: 2, bgcolor: alpha('#F44336', 0.05) }}>
                <Typography variant="caption" color="text.secondary">
                  Monto Total Vencido
                </Typography>
                <Typography variant="h5" fontWeight={600} color="error.main">
                  {formatCurrency(filteredStats.totalAmount)}
                </Typography>
              </Paper>
            </Box>

            {/* Search */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar por cliente, DNI o numero de prestamo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Results */}
            {filteredData.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron resultados
                  {searchQuery && <> para &quot;{searchQuery}&quot;</>}
                  {selectedManager && !searchQuery && <> para este manager</>}
                </Typography>
              </Paper>
            ) : isMobile ? (
              filteredData.map(renderMobileCard)
            ) : (
              renderDesktopTable()
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
