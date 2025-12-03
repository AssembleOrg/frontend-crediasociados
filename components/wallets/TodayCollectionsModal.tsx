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
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Close, TrendingUp, CalendarToday, Person, Refresh } from '@mui/icons-material'
import { Chip } from '@mui/material'

interface TodayCollectionsModalProps {
  open: boolean
  onClose: () => void
  data: {
    date: string | { requested?: string; start?: string; end?: string }
    collected: {
      total: number
      grossTotal: number
      count: number
      transactions: Array<{
        id: string
        amount: number
        description: string
        subLoanId: string
        createdAt: string
      }>
    }
    resets: {
      total: number
      count: number
      transactions: Array<{
        id: string
        amount: number
        description: string
        subLoanId: string
        createdAt: string
      }>
    }
    user: {
      id: string
      fullName: string
      email: string
      role: string
    }
  } | null
}

export default function TodayCollectionsModal({ open, onClose, data }: TodayCollectionsModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateObj: { requested?: string; start?: string; end?: string } | string) => {
    // Handle both object and string formats
    const dateString = typeof dateObj === 'string' ? dateObj : (dateObj.requested || dateObj.start || '')
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  if (!data) return null

  // Safely access collected and resets with defaults
  const collected = data.collected || { total: 0, grossTotal: 0, count: 0, transactions: [] }
  const resets = data.resets || { total: 0, count: 0, transactions: [] }
  const user = data.user || { id: '', fullName: 'N/A', email: '', role: '' }

  // Combine collections and resets, sort by date
  const allTransactions = [
    ...(collected.transactions || []).map(tx => ({
      ...tx,
      type: 'COLLECTION' as const,
      user: user
    })),
    ...(resets.transactions || []).map(tx => ({
      ...tx,
      type: 'RESET' as const,
      user: user
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Calculate net total (grossTotal - resets)
  const netTotal = collected.grossTotal - resets.total
  // Total count (collections + resets)
  const totalCount = collected.count + resets.count

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
        background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Cobros Realizados Hoy
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
              bgcolor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total Cobrado (Neto)
            </Typography>
            <Typography variant="h4" fontWeight={700} color={netTotal >= 0 ? "success.main" : "error.main"} sx={{ mt: 0.5 }}>
              {formatCurrency(netTotal)}
            </Typography>
            {resets.total > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Bruto: {formatCurrency(collected.grossTotal)} - Resets: {formatCurrency(resets.total)}
              </Typography>
            )}
          </Paper>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              bgcolor: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Cantidad de Transacciones
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalCount === 1 ? 'transacción' : 'transacciones'}
              </Typography>
            </Box>
            {resets.count > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {collected.count} cobros + {resets.count} resets
              </Typography>
            )}
          </Paper>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Collections Table */}
        {allTransactions.length > 0 ? (
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
                overflow: 'hidden'
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    {!isMobile && (
                      <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                    {!isMobile && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTransactions.map((transaction) => {
                    const isReset = transaction.type === 'RESET'
                    const hoverColor = isReset 
                      ? alpha(theme.palette.warning.main, 0.02)
                      : alpha(theme.palette.success.main, 0.02)
                    
                    return (
                      <TableRow 
                        key={transaction.id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: hoverColor
                          },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell>
                          {isReset ? (
                            <Chip
                              icon={<Refresh sx={{ fontSize: 14 }} />}
                              label="Reseteo"
                              size="small"
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : (
                            <Chip
                              label="Cobro"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {transaction.description}
                          </Typography>
                          {isMobile && (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.user.fullName}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {formatDateTime(transaction.createdAt)}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {transaction.user.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600} 
                            color={isReset ? "warning.main" : "success.main"}
                          >
                            {isReset ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(transaction.createdAt)}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay transacciones registradas para hoy
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

