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
  Card,
  CardContent,
  alpha,
  useTheme,
  useMediaQuery,
  Tooltip,
  Button,
} from '@mui/material'
import { Close, TrendingUp, CalendarToday, Person, Refresh, Info, RouteOutlined } from '@mui/icons-material'
import { Chip } from '@mui/material'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatCurrencyCompact = (amount: number) => {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace('.0', '')}M`
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace('.0', '')}k`
    return `${sign}$${abs}`
  }

  const formatDate = (dateObj: { requested?: string; start?: string; end?: string } | string) => {
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

  const collected = data.collected || { total: 0, grossTotal: 0, count: 0, transactions: [] }
  const resets = data.resets || { total: 0, count: 0, transactions: [] }
  const user = data.user || { id: '', fullName: 'N/A', email: '', role: '' }

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

  const netTotal = collected.grossTotal - resets.total
  const totalCount = collected.count + resets.count

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
        pt: 2,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 24, color: 'success.main' }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Cobros Realizados Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {formatDate(data.date)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RouteOutlined />}
            onClick={() => { onClose(); router.push('/dashboard/prestamista/rutas') }}
            sx={{ borderRadius: 2, fontSize: '0.8125rem' }}
          >
            Ver Ruta
          </Button>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F2F2F7' }}>
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
              p: 2,
              bgcolor: '#FFFFFF',
              borderLeft: 4,
              borderLeftColor: netTotal >= 0 ? 'success.main' : 'error.main',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total Cobrado (Neto)
            </Typography>
            <Typography variant="h5" fontWeight={700} color={netTotal >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>
              {formatCurrency(netTotal)}
            </Typography>
            {resets.total > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Bruto: {formatCurrency(collected.grossTotal)} — Resets: {formatCurrency(resets.total)}
              </Typography>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: '#FFFFFF',
              borderLeft: 4,
              borderLeftColor: 'info.main',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Cantidad de Transacciones
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
              <Typography variant="h5" fontWeight={700} color="info.main">
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

        {/* Transactions */}
        {allTransactions.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Detalle de Transacciones
            </Typography>

            {isMobile ? (
              /* Mobile: una Card por transacción */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {allTransactions.map((transaction) => {
                  const isReset = transaction.type === 'RESET'
                  return (
                    <Card
                      key={transaction.id}
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderLeft: 3,
                        borderLeftColor: isReset ? 'warning.main' : 'success.main',
                        borderRadius: 2,
                        bgcolor: '#FFFFFF',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Chip tipo + monto */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip
                            icon={isReset ? <Refresh sx={{ fontSize: 14 }} /> : undefined}
                            label={isReset ? 'Reseteo' : 'Cobro'}
                            size="small"
                            color={isReset ? 'warning' : 'success'}
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="body1" fontWeight={700} color={isReset ? 'warning.main' : 'success.main'}>
                            {isReset ? '-' : '+'}{formatCurrencyCompact(Math.abs(transaction.amount))}
                          </Typography>
                        </Box>

                        {/* Descripción */}
                        {transaction.description && transaction.description.trim() ? (
                          <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75, lineHeight: 1.4 }}>
                            {transaction.description}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mb: 0.75 }}>
                            Sin descripción
                          </Typography>
                        )}

                        {/* Cobrador + fecha */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {transaction.user.fullName}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(transaction.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            ) : (
              /* Desktop: tabla completa */
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cobrador</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allTransactions.map((transaction) => {
                      const isReset = transaction.type === 'RESET'
                      return (
                        <TableRow
                          key={transaction.id}
                          sx={{
                            '&:hover': {
                              bgcolor: isReset
                                ? alpha(theme.palette.warning.main, 0.02)
                                : alpha(theme.palette.success.main, 0.02)
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
                            <Box>
                              {transaction.description && transaction.description.trim() ? (
                                <Tooltip
                                  title={transaction.description}
                                  arrow
                                  disableHoverListener={transaction.description.length <= 50}
                                  placement="top"
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    sx={{
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'block',
                                    }}
                                  >
                                    {transaction.description}
                                  </Typography>
                                </Tooltip>
                              ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Sin descripción
                                </Typography>
                              )}

                              {transaction.payments && transaction.payments.length > 0 && (
                                <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {transaction.payments.map((payment, idx) => (
                                    payment.description && payment.description.trim() ? (
                                      <Chip
                                        key={payment.id || idx}
                                        label={payment.description}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 } }}
                                      />
                                    ) : null
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </TableCell>
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
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={isReset ? 'warning.main' : 'success.main'}
                            >
                              {isReset ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(transaction.createdAt)}
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
