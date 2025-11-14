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
  Divider
} from '@mui/material'
import { Close, History, TrendingUp, TrendingDown } from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'

interface WalletHistoryModalProps {
  open: boolean
  onClose: () => void
}

export default function WalletHistoryModal({ open, onClose }: WalletHistoryModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [transactions, setTransactions] = useState<Array<{
    id: string
    type: 'COLLECTION' | 'WITHDRAWAL'
    amount: number
    currency: string
    description: string
    balanceBefore: number
    balanceAfter: number
    subLoanId?: string
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (open) {
      loadWalletHistory()
    } else {
      setTransactions([])
      setError(null)
    }
  }, [open])

  const loadWalletHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await collectorWalletService.getWalletHistory()
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Error loading wallet history:', err)
      setError(err.response?.data?.message || 'Error al cargar el historial de wallet')
      setTransactions([])
    } finally {
      setLoading(false)
    }
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
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <History sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Historial de Wallet de Cobros
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
              Todos los movimientos (cobros y retiros)
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

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
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
        {!loading && !error && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay transacciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aún no se han registrado movimientos en la wallet de cobros
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
                overflow: 'hidden',
                maxHeight: isMobile ? 400 : 500
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
                  {transactions.map((tx) => (
                    <TableRow 
                      key={tx.id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: tx.type === 'COLLECTION' 
                            ? alpha(theme.palette.success.main, 0.02)
                            : alpha(theme.palette.warning.main, 0.02)
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
                          icon={tx.type === 'COLLECTION' ? <TrendingUp /> : <TrendingDown />}
                          label={tx.type === 'COLLECTION' ? 'Cobro' : 'Retiro'}
                          size="small"
                          color={tx.type === 'COLLECTION' ? 'success' : 'warning'}
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
                          color={tx.type === 'COLLECTION' ? 'success.main' : 'warning.main'}
                        >
                          {tx.type === 'COLLECTION' ? '+' : '-'}{formatCurrency(tx.amount)}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

