'use client'

import { useState, useEffect, useMemo } from 'react'
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
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material'
import { Close, History, TrendingUp, TrendingDown, SwapHoriz, Receipt, AccountBalance } from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'
import { useUsers } from '@/hooks/useUsers'

interface WalletHistoryModalProps {
  open: boolean
  onClose: () => void
}

type TransactionType = 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT' | 'ALL'

export default function WalletHistoryModal({ open, onClose }: WalletHistoryModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { users } = useUsers()
  
  // Filter managers (prestamistas) created by current subadmin
  const managers = useMemo(() => {
    return users.filter((user) => user.role === 'prestamista')
  }, [users])
  
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [transactions, setTransactions] = useState<Array<{
    id: string
    type: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT'
    amount: number
    currency: string
    description: string
    balanceBefore: number
    balanceAfter: number
    subLoanId?: string | null
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0) // MUI TablePagination uses 0-based indexing
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<TransactionType>('ALL')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentBalance, setCurrentBalance] = useState(0)

  useEffect(() => {
    if (open) {
      // Reset manager selection when modal opens
      setSelectedManagerId('')
      setTransactions([])
      setError(null)
      setPage(0)
      setFilterType('ALL')
      setStartDate('')
      setEndDate('')
      setCurrentBalance(0)
    } else {
      setTransactions([])
      setError(null)
      setPage(0)
      setFilterType('ALL')
      setStartDate('')
      setEndDate('')
      setSelectedManagerId('')
      setCurrentBalance(0)
    }
  }, [open])

  // Load wallet history only when manager is selected and dependencies change
  useEffect(() => {
    if (open && selectedManagerId) {
      loadWalletHistory()
    }
  }, [open, selectedManagerId, page, rowsPerPage, filterType, startDate, endDate])

  const loadWalletHistory = async () => {
    if (!selectedManagerId) {
      return // Don't load if no manager is selected
    }

    setLoading(true)
    setError(null)
    try {
      // MUI TablePagination uses 0-based indexing, but API uses 1-based
      const params: { 
        managerId: string; // Required
        page?: number; 
        limit?: number; 
        type?: 'COLLECTION' | 'WITHDRAWAL' | 'ROUTE_EXPENSE' | 'LOAN_DISBURSEMENT' | 'CASH_ADJUSTMENT';
        startDate?: string; 
        endDate?: string 
      } = {
        managerId: selectedManagerId, // Always required
        page: page + 1, // Convert 0-based to 1-based for API
        limit: rowsPerPage
      }
      
      if (filterType !== 'ALL') {
        params.type = filterType
      }
      
      if (startDate) {
        params.startDate = startDate
      }
      
      if (endDate) {
        params.endDate = endDate
      }

      const data = await collectorWalletService.getCompleteHistory(params)
      setTransactions(data.transactions || [])
      setTotal(data.pagination?.total || 0)
      setCurrentBalance(data.wallet?.balance || 0)
    } catch (err: any) {
      // Error loading wallet history
      setError(err.response?.data?.message || 'Error al cargar el historial de wallet')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0) // Reset to first page when changing rows per page
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper functions para determinar el estilo según el tipo de transacción
  const getTransactionLabel = (type: string): string => {
    switch (type) {
      case 'COLLECTION':
        return 'Cobro'
      case 'WITHDRAWAL':
        return 'Retiro'
      case 'ROUTE_EXPENSE':
        return 'Gasto de Ruta'
      case 'LOAN_DISBURSEMENT':
        return 'Desembolso'
      case 'CASH_ADJUSTMENT':
        return 'Ajuste de Caja'
      default:
        return 'Transacción'
    }
  }

  const getTransactionColor = (type: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (type) {
      case 'COLLECTION':
        return 'success'
      case 'WITHDRAWAL':
        return 'warning'
      case 'ROUTE_EXPENSE':
        return 'error'
      case 'LOAN_DISBURSEMENT':
        return 'error'
      case 'CASH_ADJUSTMENT':
        return 'info'
      default:
        return 'default'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COLLECTION':
        return <TrendingUp />
      case 'WITHDRAWAL':
        return <TrendingDown />
      case 'ROUTE_EXPENSE':
        return <Receipt />
      case 'LOAN_DISBURSEMENT':
        return <AccountBalance />
      case 'CASH_ADJUSTMENT':
        return <SwapHoriz />
      default:
        return <History />
    }
  }

  const getTransactionSign = (type: string): string => {
    // CASH_ADJUSTMENT y COLLECTION son positivos (ingresos)
    if (type === 'CASH_ADJUSTMENT' || type === 'COLLECTION') {
      return '+'
    }
    // WITHDRAWAL, ROUTE_EXPENSE, LOAN_DISBURSEMENT son negativos (egresos)
    return '-'
  }

  const isPositiveTransaction = (type: string): boolean => {
    return type === 'CASH_ADJUSTMENT' || type === 'COLLECTION'
  }

  const getAmountColor = (type: string): string => {
    if (type === 'CASH_ADJUSTMENT') {
      return 'info.main'
    }
    if (type === 'COLLECTION') {
      return 'success.main'
    }
    // WITHDRAWAL, ROUTE_EXPENSE, LOAN_DISBURSEMENT son negativos
    return 'error.main'
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
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <History sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Historial de Wallet de Cobros
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              Todos los movimientos de la wallet de cobros
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

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3, mt: 2 }, 
        bgcolor: 'background.default',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Manager Selector - Required */}
        <Box sx={{ mb: 3, mt: 2 }}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Seleccionar Cobrador *</InputLabel>
            <Select
              value={selectedManagerId}
              label="Seleccionar Cobrador *"
              onChange={(e) => {
                setSelectedManagerId(e.target.value)
                setPage(0) // Reset to first page when changing manager
                setTransactions([]) // Clear transactions when changing manager
                setTotal(0)
                setCurrentBalance(0)
              }}
              required
            >
              {managers.length === 0 ? (
                <MenuItem value="" disabled>
                  No hay cobradores disponibles
                </MenuItem>
              ) : (
                managers.map((manager) => (
                  <MenuItem key={manager.id} value={manager.id}>
                    {manager.fullName} ({manager.email})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          {!selectedManagerId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selecciona un cobrador para ver su historial de transacciones
            </Typography>
          )}
        </Box>

        {/* Filters - Only enabled when manager is selected */}
        {selectedManagerId && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tipo de Transacción</InputLabel>
              <Select
                value={filterType}
                label="Tipo de Transacción"
                onChange={(e) => {
                  setFilterType(e.target.value as TransactionType)
                  setPage(0) // Reset to first page when changing filter
                }}
              >
                <MenuItem value="ALL">Todas</MenuItem>
                <MenuItem value="COLLECTION">Cobros</MenuItem>
                <MenuItem value="WITHDRAWAL">Retiros</MenuItem>
                <MenuItem value="ROUTE_EXPENSE">Gastos de Ruta</MenuItem>
                <MenuItem value="LOAN_DISBURSEMENT">Desembolsos</MenuItem>
                <MenuItem value="CASH_ADJUSTMENT">Ajustes de Caja</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Fecha Desde"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0) // Reset to first page when changing date
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            
            <TextField
              label="Fecha Hasta"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0) // Reset to first page when changing date
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </Box>
        )}

        {!selectedManagerId && (
          <Divider sx={{ mb: 3 }} />
        )}

        {/* Summary - Only show when manager is selected */}
        {selectedManagerId && !loading && !error && (
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
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
                Total de Transacciones
              </Typography>
              <Typography variant="h5" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                {total}
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
                Balance Actual
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                {formatCurrency(currentBalance)}
              </Typography>
            </Paper>
          </Box>
        )}

        {selectedManagerId && <Divider sx={{ mb: 3 }} />}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando historial...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!selectedManagerId && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecciona un cobrador
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elige un cobrador de la lista para ver su historial de transacciones
            </Typography>
          </Box>
        )}

        {selectedManagerId && !loading && !error && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay transacciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aún no se han registrado movimientos en la wallet de cobros de este cobrador
            </Typography>
          </Box>
        )}

        {/* Transactions Table */}
        {selectedManagerId && !loading && !error && transactions.length > 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Transacciones
            </Typography>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'visible'
              }}
            >
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Antes</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Después</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => {
                    const isPositive = isPositiveTransaction(tx.type)
                    const hoverColor = tx.type === 'CASH_ADJUSTMENT' 
                      ? alpha(theme.palette.info.main, 0.02)
                      : tx.type === 'COLLECTION'
                      ? alpha(theme.palette.success.main, 0.02)
                      : tx.type === 'ROUTE_EXPENSE' || tx.type === 'LOAN_DISBURSEMENT'
                      ? alpha(theme.palette.error.main, 0.02)
                      : alpha(theme.palette.warning.main, 0.02)

                    return (
                      <TableRow 
                        key={tx.id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: hoverColor
                          },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(tx.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getTransactionIcon(tx.type)}
                            label={getTransactionLabel(tx.type)}
                            size="small"
                            color={getTransactionColor(tx.type)}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {tx.description}
                          </Typography>
                          {isMobile && (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Antes: {formatCurrency(tx.balanceBefore)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Después: {formatCurrency(tx.balanceAfter)}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(tx.balanceBefore)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={getAmountColor(tx.type)}
                          >
                            {getTransactionSign(tx.type)}{formatCurrency(tx.amount)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(tx.balanceAfter)}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination - Always visible like in other views */}
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                '& .MuiTablePagination-toolbar': {
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                },
                '& .MuiTablePagination-spacer': {
                  display: { xs: 'none', sm: 'flex' }
                }
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

