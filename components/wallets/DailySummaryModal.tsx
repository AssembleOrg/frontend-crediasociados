'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  alpha,
  useTheme,
  Button,
} from '@mui/material'
import { Close, TrendingUp, TrendingDown, Receipt, AccountBalance, CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { dailySummaryService, type DailySummaryResponse } from '@/services/daily-summary.service'

interface DailySummaryModalProps {
  open: boolean
  onClose: () => void
  managerId: string
  managerName: string
}

export function DailySummaryModal({ open, onClose, managerId, managerName }: DailySummaryModalProps) {
  const theme = useTheme()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [summary, setSummary] = useState<DailySummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const days: Date[] = []
    
    // Add days from previous month to fill the week
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysToAdd = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1 // Monday = 0
    
    for (let i = daysToAdd; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i)
      days.push(prevDate)
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length // 6 rows x 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }

  const loadSummary = async (date: Date) => {
    try {
      setLoading(true)
      setError(null)
      const dateStr = dailySummaryService.formatDateForAPI(date)
      const data = await dailySummaryService.getDailySummaryQuery(dateStr, managerId)
      setSummary(data)
    } catch (err: any) {
      console.error('Error loading daily summary:', err)
      setError(err.response?.data?.message || 'Error al cargar el resumen diario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSummary(selectedDate)
    }
  }, [open, selectedDate, managerId])

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Resumen Diario - {managerName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Revisa la actividad del día seleccionado
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, 
          gap: 3,
          minHeight: { xs: 'auto', md: '500px' }
        }}>
          {/* Left Column: Calendar */}
          <Box>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], position: { md: 'sticky' }, top: 0 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <IconButton 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              size="small"
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            
            <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <IconButton 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              size="small"
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>

          {/* Day names */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
              <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Days */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3 }}>
            {getDaysInMonth(currentMonth).map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === selectedDate.toDateString()

              return (
                <Box
                  key={index}
                  onClick={() => {
                    setSelectedDate(day)
                    if (day.getMonth() !== currentMonth.getMonth()) {
                      setCurrentMonth(day)
                    }
                  }}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 0.75,
                    cursor: 'pointer',
                    bgcolor: isSelected 
                      ? 'primary.main' 
                      : isToday 
                        ? alpha(theme.palette.primary.light, 0.2) 
                        : 'transparent',
                    color: isSelected 
                      ? 'white' 
                      : isCurrentMonth 
                        ? 'text.primary' 
                        : 'text.disabled',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    '&:hover': {
                      bgcolor: isSelected 
                        ? 'primary.dark' 
                        : alpha(theme.palette.primary.light, 0.1),
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {day.getDate()}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Quick Actions */}
          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const today = new Date()
                setSelectedDate(today)
                setCurrentMonth(today)
              }}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Hoy
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                setSelectedDate(yesterday)
                setCurrentMonth(yesterday)
              }}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Ayer
            </Button>
          </Box>

          {/* Selected Date Display */}
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ fontSize: '0.7rem' }}>
              Fecha seleccionada:
            </Typography>
            <Typography variant="body2" align="center" fontWeight={600} sx={{ mt: 0.5, fontSize: '0.85rem' }}>
              {selectedDate.toLocaleDateString('es-AR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </Typography>
          </Box>
        </Paper>
          </Box>

          {/* Right Column: Data */}
          <Box sx={{ overflow: 'auto', maxHeight: { xs: 'auto', md: '600px' } }}>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {summary && !loading && (
          <Box>
            {/* Summary Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
              gap: 2, 
              mb: 3 
            }}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 28, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {formatCurrency(summary.collected.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cobrado ({summary.collected.count})
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <AccountBalance sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    {formatCurrency(summary.loaned.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prestado ({summary.loaned.count})
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 28, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {formatCurrency(summary.expenses.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gastos ({summary.expenses.count})
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                bgcolor: summary.summary.netBalance >= 0 
                  ? alpha(theme.palette.success.main, 0.1) 
                  : alpha(theme.palette.error.main, 0.1) 
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <TrendingDown sx={{ 
                    fontSize: 28, 
                    color: summary.summary.netBalance >= 0 ? 'success.main' : 'error.main', 
                    mb: 1 
                  }} />
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    color={summary.summary.netBalance >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(Math.abs(summary.summary.netBalance))}
                    {summary.summary.netBalance < 0 && ' (-)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balance Neto
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Collections */}
            {summary.collected.transactions.length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Cobros Realizados
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Hora</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.collected.transactions.map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell>
                            <Typography variant="body2">{tx.description}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              +{formatCurrency(tx.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(tx.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Loans */}
            {summary.loaned.loans.length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Préstamos Otorgados
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Hora</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.loaned.loans.map((loan) => (
                        <TableRow key={loan.id} hover>
                          <TableCell>
                            <Chip label={loan.loanTrack} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{loan.clientName}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {formatCurrency(loan.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(loan.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Expenses */}
            {summary.expenses.detail.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Gastos Registrados
                </Typography>
                
                {/* By Category */}
                {Object.keys(summary.expenses.byCategory).length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {summary.expenses.byCategory.COMBUSTIBLE && (
                      <Chip 
                        label={`Combustible: ${formatCurrency(summary.expenses.byCategory.COMBUSTIBLE)}`} 
                        size="small" 
                        color="warning"
                      />
                    )}
                    {summary.expenses.byCategory.CONSUMO && (
                      <Chip 
                        label={`Consumo: ${formatCurrency(summary.expenses.byCategory.CONSUMO)}`} 
                        size="small" 
                        color="info"
                      />
                    )}
                    {summary.expenses.byCategory.REPARACIONES && (
                      <Chip 
                        label={`Reparaciones: ${formatCurrency(summary.expenses.byCategory.REPARACIONES)}`} 
                        size="small" 
                        color="error"
                      />
                    )}
                    {summary.expenses.byCategory.OTROS && (
                      <Chip 
                        label={`Otros: ${formatCurrency(summary.expenses.byCategory.OTROS)}`} 
                        size="small" 
                        color="default"
                      />
                    )}
                  </Box>
                )}

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.expenses.detail.map((expense, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip label={expense.category} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{expense.description}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="error.main">
                              {formatCurrency(expense.amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Empty state */}
            {summary.collected.count === 0 && summary.loaned.count === 0 && summary.expenses.count === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No hay actividad registrada para este día
                </Typography>
              </Box>
            )}
          </Box>
        )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

