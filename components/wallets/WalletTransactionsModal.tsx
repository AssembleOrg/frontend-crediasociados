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
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material'
import { Close, History, TrendingUp, TrendingDown, FilterList } from '@mui/icons-material'
import { walletsService } from '@/services/wallets.service'
import type { WalletTransaction } from '@/types/auth'

interface WalletTransactionsModalProps {
  open: boolean
  onClose: () => void
}

type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'LOAN_PAYMENT' | 'TRANSFER_TO_MANAGER' | 'TRANSFER_FROM_SUBADMIN' | 'ALL'

export default function WalletTransactionsModal({ open, onClose }: WalletTransactionsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0) // MUI TablePagination uses 0-based indexing
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<TransactionType>('ALL')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    if (open) {
      loadTransactions()
    } else {
      setTransactions([])
      setError(null)
      setPage(0)
      setFilterType('ALL')
      setStartDate('')
      setEndDate('')
    }
  }, [open, page, rowsPerPage, filterType, startDate, endDate])

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      // MUI TablePagination uses 0-based indexing, but API uses 1-based
      const params: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string } = {
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

      const data = await walletsService.getTransactions(params)
      setTransactions(data.data || [])
      setTotal(data.meta?.total || 0)
    } catch (err: any) {
      // Error loading transactions
      setError(err.response?.data?.message || 'Error al cargar las transacciones')
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0'
    }
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'DEPOSIT': 'Depósito',
      'WITHDRAWAL': 'Retiro',
      'LOAN_DISBURSEMENT': 'Desembolso',
      'LOAN_PAYMENT': 'Pago de Préstamo',
      'TRANSFER_TO_MANAGER': 'Transferencia a Manager',
      'TRANSFER_FROM_SUBADMIN': 'Transferencia desde Subadmin'
    }
    return labels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    if (type === 'DEPOSIT' || type === 'LOAN_PAYMENT') return 'success'
    if (type === 'WITHDRAWAL' || type === 'LOAN_DISBURSEMENT') return 'error'
    return 'info'
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'DEPOSIT' || type === 'LOAN_PAYMENT') return <TrendingUp />
    if (type === 'WITHDRAWAL' || type === 'LOAN_DISBURSEMENT') return <TrendingDown />
    return <History />
  }

  // La API ahora devuelve balanceBefore y balanceAfter directamente

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
              Historial de Transacciones
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              Retiros, depósitos y transferencias
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
        p: { xs: 2, sm: 3, mt: 3 }, 
        bgcolor: 'background.default',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', mt:3 }}>
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
              <MenuItem value="DEPOSIT">Depósitos</MenuItem>
              <MenuItem value="WITHDRAWAL">Retiros</MenuItem>
              <MenuItem value="LOAN_DISBURSEMENT">Desembolsos</MenuItem>
              <MenuItem value="LOAN_PAYMENT">Pagos de Préstamos</MenuItem>
              <MenuItem value="TRANSFER_TO_MANAGER">Transferencias a Manager</MenuItem>
              <MenuItem value="TRANSFER_FROM_SUBADMIN">Transferencias desde Subadmin</MenuItem>
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

        {/* Summary */}
        {!loading && !error && total > 0 && (
          <Box sx={{ mb: 3 }}>
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
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando transacciones...
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
        {!loading && !error && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay transacciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aún no se han registrado movimientos en tu wallet
            </Typography>
          </Box>
        )}

        {/* Transactions Table */}
        {!loading && !error && transactions.length > 0 && (
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
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Antes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Balance Después</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow 
                      key={tx.id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: tx.type === 'DEPOSIT' || tx.type === 'LOAN_PAYMENT'
                            ? alpha(theme.palette.success.main, 0.02)
                            : alpha(theme.palette.error.main, 0.02)
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
                          label={getTransactionTypeLabel(tx.type)}
                          size="small"
                          color={getTransactionTypeColor(tx.type) as any}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {tx.description || 'Sin descripción'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={
                            tx.type === 'DEPOSIT' || tx.type === 'LOAN_PAYMENT'
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          {tx.type === 'DEPOSIT' || tx.type === 'LOAN_PAYMENT' ? '+' : '-'}
                          {formatCurrency(tx.amount ? Math.abs(tx.amount) : 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                          {formatCurrency(tx.balanceBefore ?? 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(tx.balanceAfter ?? 0)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination - Always visible like in clients view */}
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

