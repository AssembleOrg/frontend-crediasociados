'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Calculate,
  CalendarMonth,
} from '@mui/icons-material'
import { collectorWalletService } from '@/services/collector-wallet.service'
import type { User } from '@/types/auth'

interface LiquidationModalProps {
  open: boolean
  onClose: () => void
  manager: User | null
}

export function LiquidationModal({ open, onClose, manager }: LiquidationModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)
  const [tempStart, setTempStart] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [summary, setSummary] = useState<{
    totalAmount: number
    totalCollections: number
    startDate: string
    endDate: string
  } | null>(null)
  const [commissionPercentage, setCommissionPercentage] = useState<string>('')
  const [calculatedCommission, setCalculatedCommission] = useState<number | null>(null)

  const normalizeDate = (date: Date): Date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime()
  }

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatShortDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const firstMonday = new Date(firstDay)
    firstMonday.setDate(firstDay.getDate() - (startDay === 0 ? 6 : startDay - 1))
    const endDay = lastDay.getDay()
    const lastSunday = new Date(lastDay)
    lastSunday.setDate(lastDay.getDate() + (endDay === 0 ? 0 : 7 - endDay))
    const days: Date[] = []
    const current = new Date(firstMonday)
    while (current <= lastSunday) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const loadSummary = async (start: Date, end: Date) => {
    if (!manager) return
    try {
      setLoading(true)
      setError(null)
      const startDate = formatDateToDDMMYYYY(start)
      const endDate = formatDateToDDMMYYYY(end)
      const data = await collectorWalletService.getCollectionsSummary(manager.id, startDate, endDate)
      setSummary({
        totalAmount: data.totalAmount,
        totalCollections: data.totalCollections,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      setCalculatedCommission(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el resumen de cobros')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date)
    if (!tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      setSummary(null)
      setCalculatedCommission(null)
      return
    }
    if (isSameDay(normalizedDate, tempStart)) {
      const range = { start: normalizedDate, end: normalizedDate }
      setSelectedRange(range)
      setTempStart(null)
      loadSummary(range.start, range.end)
      setCalendarOpen(false)
      return
    }
    if (normalizedDate < tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      setSummary(null)
      setCalculatedCommission(null)
      return
    }
    const range = { start: tempStart, end: normalizedDate }
    setSelectedRange(range)
    setTempStart(null)
    loadSummary(range.start, range.end)
    setCalendarOpen(false)
  }

  const isInRange = (date: Date): boolean => {
    const normalizedDate = normalizeDate(date)
    if (selectedRange) {
      return normalizedDate >= normalizeDate(selectedRange.start) && normalizedDate <= normalizeDate(selectedRange.end)
    }
    if (tempStart) return isSameDay(normalizedDate, tempStart)
    return false
  }

  const isRangeStart = (date: Date): boolean => {
    if (selectedRange) return isSameDay(date, selectedRange.start)
    if (tempStart) return isSameDay(date, tempStart)
    return false
  }

  const isRangeEnd = (date: Date): boolean => {
    if (selectedRange) return isSameDay(date, selectedRange.end)
    return false
  }

  const isInRangeMiddle = (date: Date): boolean => {
    if (!selectedRange) return false
    const normalizedDate = normalizeDate(date)
    return normalizedDate > normalizeDate(selectedRange.start) && normalizedDate < normalizeDate(selectedRange.end)
  }

  const formatCurrencyCompact = (amount: number) => {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    return `${sign}$${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(abs)}`
  }

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`
  }

  const handleCalculateCommission = () => {
    if (!summary || !commissionPercentage) {
      setError('Por favor ingresa un porcentaje')
      return
    }
    const percentage = parseFloat(commissionPercentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError('El porcentaje debe ser un número entre 0 y 100')
      return
    }
    setCalculatedCommission((summary.totalAmount * percentage) / 100)
    setError(null)
  }

  const handleClose = () => {
    setSelectedRange(null)
    setTempStart(null)
    setSummary(null)
    setCommissionPercentage('')
    setCalculatedCommission(null)
    setError(null)
    setCalendarOpen(false)
    onClose()
  }

  const days = getDaysInMonth(currentMonth)
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const calendarBlock = (
    <Box>
      {/* Month nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day names */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
        {dayNames.map((day) => (
          <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">{day}</Typography>
          </Box>
        ))}
      </Box>

      {/* Days */}
      {weeks.map((week, weekIndex) => (
        <Box key={weekIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
          {week.map((date, dayIndex) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isOtherMonth = date.getMonth() !== currentMonth.getMonth()
            const inRange = isInRange(date)
            const isStart = isRangeStart(date)
            const isEnd = isRangeEnd(date)
            return (
              <Box
                key={dayIndex}
                onClick={() => !isOtherMonth && handleDateClick(date)}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  borderRadius: 1,
                  position: 'relative',
                  cursor: isOtherMonth ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: inRange
                    ? isStart || isEnd
                      ? alpha(theme.palette.primary.main, 0.3)
                      : alpha(theme.palette.primary.main, 0.15)
                    : 'transparent',
                  border: isStart || isEnd
                    ? `2px solid ${theme.palette.primary.main}`
                    : '2px solid transparent',
                  '&:hover': {
                    backgroundColor: isOtherMonth
                      ? 'transparent'
                      : inRange
                        ? alpha(theme.palette.primary.main, 0.25)
                        : alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    color: isOtherMonth ? 'text.disabled' : inRange ? 'primary.main' : isToday ? 'primary.main' : 'text.primary',
                    fontWeight: (isStart || isEnd || isToday) ? 700 : 400,
                  }}
                >
                  {date.getDate()}
                </Typography>
                {isToday && !inRange && (
                  <Box sx={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main' }} />
                )}
              </Box>
            )
          })}
        </Box>
      ))}

      {selectedRange && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">Rango seleccionado:</Typography>
          <Typography variant="body2" fontWeight={600}>
            {formatDateToDDMMYYYY(selectedRange.start)} - {formatDateToDDMMYYYY(selectedRange.end)}
          </Typography>
        </Box>
      )}
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 96px)', sm: '90vh' },
          m: { xs: 1, sm: 2 },
          mt: { xs: 'auto', sm: 2 },
        },
      }}
    >
      <DialogTitle sx={{
        pt: 2.5,
        px: 3,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Calculate sx={{ fontSize: 24, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Calcular Liquidación
            </Typography>
            {manager && (
              <Typography variant="caption" color="text.secondary" display="block">
                {manager.fullName}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Mobile: pill button to open calendar */}
        {isMobile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
            onClick={() => setCalendarOpen(true)}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 2, mb: 2 }}
          >
            {selectedRange
              ? `${formatShortDate(selectedRange.start)} – ${formatShortDate(selectedRange.end)}`
              : 'Seleccionar período'}
          </Button>
        )}

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: { xs: 'stretch', md: 'start' }
        }}>
          {/* Desktop calendar column */}
          <Paper sx={{
            p: { xs: 2, sm: 3 },
            width: { md: '360px' },
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
          }}>
            {calendarBlock}
          </Paper>

          {/* Results */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && summary && (
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Resumen de Cobros
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Período</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {summary.startDate} - {summary.endDate}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Cobrado</Typography>
                    <Typography variant="h5" fontWeight={600} color="success.main">
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Cantidad de Cobros</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {summary.totalCollections}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {summary && (
              <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Calcular Comisión
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Porcentaje de Comisión (%)"
                    type="number"
                    value={commissionPercentage}
                    onChange={(e) => {
                      setCommissionPercentage(e.target.value)
                      setCalculatedCommission(null)
                    }}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    helperText="Ingresa el porcentaje de comisión (ej: 5 para 5%)"
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    startIcon={<Calculate />}
                    onClick={handleCalculateCommission}
                    disabled={!commissionPercentage || loading}
                    fullWidth
                    size="large"
                  >
                    Calcular Comisión
                  </Button>

                  {calculatedCommission !== null && (
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 1,
                        p: 2.5,
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                        border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderLeftColor: 'success.main',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" display="block" gutterBottom>
                        Comisión Calculada ({commissionPercentage}%)
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {formatCurrency(calculatedCommission)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {formatCurrencyCompact(calculatedCommission)} compacto
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Paper>
            )}

            {!loading && !summary && !selectedRange && (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                <CalendarMonth sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
                <Typography variant="body2" color="text.secondary">
                  Seleccioná un período para ver el resumen
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>

      {/* Mobile: Calendar BottomSheet */}
      {/* zIndex 1400 > Dialog (1300) para que se renderice encima */}
      <SwipeableDrawer
        anchor="bottom"
        open={calendarOpen}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => setCalendarOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, zIndex: 1400 }}
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
            <Typography variant="subtitle1" fontWeight={600}>Seleccionar período</Typography>
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
