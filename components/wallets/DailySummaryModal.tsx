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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  useMediaQuery,
  Button,
  SwipeableDrawer,
  Divider,
} from '@mui/material'
import { Close, TrendingUp, TrendingDown, Receipt, AccountBalance, CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { dailySummaryService, type DailySummaryResponse } from '@/services/daily-summary.service'

interface DailySummaryModalProps {
  open: boolean
  onClose: () => void
  managerId: string
  managerName: string
}

const formatCurrencyCompact = (amount: number) => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(abs)}`
}

export function DailySummaryModal({ open, onClose, managerId, managerName }: DailySummaryModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [summary, setSummary] = useState<DailySummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const days: Date[] = []
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysToAdd = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1
    for (let i = daysToAdd; i > 0; i--) {
      days.push(new Date(year, month, 1 - i))
    }
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    const remainingDays = 42 - days.length
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

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  const calendarBlock = (
    <Box>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} size="small">
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} size="small">
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

      {/* Day names */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.7rem' }}>{day}</Typography>
          </Box>
        ))}
      </Box>

      {/* Days */}
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
                if (day.getMonth() !== currentMonth.getMonth()) setCurrentMonth(day)
                setCalendarOpen(false)
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
                color: isSelected ? 'white' : isCurrentMonth ? 'text.primary' : 'text.disabled',
                fontWeight: isSelected || isToday ? 600 : 400,
                '&:hover': { bgcolor: isSelected ? 'primary.dark' : alpha(theme.palette.primary.light, 0.1) },
                transition: 'all 0.2s ease',
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{day.getDate()}</Typography>
            </Box>
          )
        })}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        <Button size="small" variant="outlined" onClick={() => { const today = new Date(); setSelectedDate(today); setCurrentMonth(today); setCalendarOpen(false) }} sx={{ fontSize: '0.75rem', py: 0.5 }}>
          Hoy
        </Button>
        <Button size="small" variant="outlined" onClick={() => { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); setSelectedDate(yesterday); setCurrentMonth(yesterday); setCalendarOpen(false) }} sx={{ fontSize: '0.75rem', py: 0.5 }}>
          Ayer
        </Button>
      </Box>

      {/* Selected date */}
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ fontSize: '0.7rem' }}>Fecha seleccionada:</Typography>
        <Typography variant="body2" align="center" fontWeight={600} sx={{ mt: 0.5, fontSize: '0.85rem' }}>
          {selectedDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Typography>
      </Box>
    </Box>
  )

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
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 2,
        pt: 2.5,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarMonth sx={{ fontSize: 24, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Resumen Diario — {managerName}
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              Revisa la actividad del día seleccionado
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
        {/* Mobile: date pill */}
        {isMobile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
            onClick={() => setCalendarOpen(true)}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 2, mb: 2, mt: 1 }}
          >
            {formatShortDate(selectedDate)}
          </Button>
        )}

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
          gap: 3,
          minHeight: { xs: 'auto', md: '500px' }
        }}>
          {/* Desktop: calendar column */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 0 }}>
              {calendarBlock}
            </Paper>
          </Box>

          {/* Data column */}
          <Box>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {summary && !loading && (
              <Box>
                {/* Summary — grouped list instead of 4 individual cards */}
                <Paper sx={{ mb: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                  <List disablePadding>
                    {[
                      { icon: <TrendingUp sx={{ fontSize: 20 }} />, label: `Cobrado (${summary.collected.count})`, value: summary.collected.total, color: 'success.main' },
                      { icon: <AccountBalance sx={{ fontSize: 20 }} />, label: `Prestado (${summary.loaned.count})`, value: summary.loaned.total, color: 'primary.main' },
                      { icon: <Receipt sx={{ fontSize: 20 }} />, label: `Gastos (${summary.expenses.count})`, value: summary.expenses.total, color: 'warning.main' },
                      {
                        icon: <TrendingDown sx={{ fontSize: 20 }} />,
                        label: 'Balance Neto',
                        value: summary.summary.netBalance,
                        color: summary.summary.netBalance >= 0 ? 'success.main' : 'error.main'
                      },
                    ].map((item, i, arr) => (
                      <div key={item.label}>
                        <ListItem sx={{ py: 1.25, px: 2 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                          <Typography variant="body1" fontWeight={700} color={item.color}>
                            {formatCurrencyCompact(item.value)}
                          </Typography>
                        </ListItem>
                        {i < arr.length - 1 && <Divider component="li" />}
                      </div>
                    ))}
                  </List>
                </Paper>

                {/* Collections table */}
                {summary.collected.transactions.length > 0 && (
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                      Cobros Realizados
                    </Typography>
                    {isMobile ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {summary.collected.transactions.map((tx) => (
                          <Card key={tx.id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderLeft: 3, borderLeftColor: 'success.main' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ flex: 1, pr: 1 }}>{tx.description}</Typography>
                                <Typography variant="body2" fontWeight={700} color="success.main">
                                  +{formatCurrencyCompact(tx.amount)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">{formatDate(tx.createdAt)}</Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
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
                                <TableCell><Typography variant="body2">{tx.description}</Typography></TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600} color="success.main">
                                    +{formatCurrency(tx.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">{formatDate(tx.createdAt)}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                )}

                {/* Loans table */}
                {summary.loaned.loans.length > 0 && (
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                      Préstamos Otorgados
                    </Typography>
                    {isMobile ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {summary.loaned.loans.map((loan) => (
                          <Card key={loan.id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderLeft: 3, borderLeftColor: 'primary.main' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Chip label={loan.loanTrack} size="small" color="primary" />
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                  {formatCurrencyCompact(loan.amount)}
                                </Typography>
                              </Box>
                              <Typography variant="body2">{loan.clientName}</Typography>
                              <Typography variant="caption" color="text.secondary">{formatDate(loan.createdAt)}</Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
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
                                <TableCell><Chip label={loan.loanTrack} size="small" color="primary" /></TableCell>
                                <TableCell><Typography variant="body2">{loan.clientName}</Typography></TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600} color="primary.main">
                                    {formatCurrency(loan.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">{formatDate(loan.createdAt)}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                )}

                {/* Expenses table */}
                {summary.expenses.detail.length > 0 && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                      Gastos Registrados
                    </Typography>
                    {Object.keys(summary.expenses.byCategory).length > 0 && (
                      <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {summary.expenses.byCategory.COMBUSTIBLE && (
                          <Chip label={`Combustible: ${formatCurrencyCompact(summary.expenses.byCategory.COMBUSTIBLE)}`} size="small" color="warning" />
                        )}
                        {summary.expenses.byCategory.CONSUMO && (
                          <Chip label={`Consumo: ${formatCurrencyCompact(summary.expenses.byCategory.CONSUMO)}`} size="small" color="info" />
                        )}
                        {summary.expenses.byCategory.REPARACIONES && (
                          <Chip label={`Reparaciones: ${formatCurrencyCompact(summary.expenses.byCategory.REPARACIONES)}`} size="small" color="error" />
                        )}
                        {summary.expenses.byCategory.OTROS && (
                          <Chip label={`Otros: ${formatCurrencyCompact(summary.expenses.byCategory.OTROS)}`} size="small" color="default" />
                        )}
                      </Box>
                    )}
                    {isMobile ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {summary.expenses.detail.map((expense, index) => (
                          <Card key={index} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderLeft: 3, borderLeftColor: 'warning.main' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Chip label={expense.category} size="small" />
                                <Typography variant="body2" fontWeight={700} color="error.main">
                                  {formatCurrencyCompact(expense.amount)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">{expense.description}</Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
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
                                <TableCell><Chip label={expense.category} size="small" /></TableCell>
                                <TableCell><Typography variant="body2">{expense.description}</Typography></TableCell>
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
                    )}
                  </Paper>
                )}

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

      {/* Mobile: Calendar BottomSheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={calendarOpen}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => setCalendarOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        PaperProps={{
          sx: {
            borderRadius: '20px 20px 0 0',
            maxHeight: '90vh',
            overflowY: 'auto',
          }
        }}
      >
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Seleccionar fecha</Typography>
            <IconButton size="small" onClick={() => setCalendarOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          {calendarBlock}
        </Box>
      </SwipeableDrawer>
    </Dialog>
  )
}
