'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  Divider,
  useMediaQuery,
  Button,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Snackbar,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  TrendingUp,
  TrendingDown,
  Receipt,
  AttachMoney,
  SwapHoriz,
  AccountBalance,
  AccountBalanceWallet,
  ViewList,
  ViewModule,
  ExpandMore,
  Assessment,
  Edit,
} from '@mui/icons-material'
import { collectorReportService, type CollectorPeriodReport } from '@/services/collector-report.service'
import { collectorWalletService } from '@/services/collector-wallet.service'
import { usersService } from '@/services/users.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface CollectorReportViewProps {
  managerId?: string
  title?: string
  subtitle?: string
}

export default function CollectorReportView({
  managerId,
  title = 'Reporte de Cobrador',
  subtitle = 'Selecciona un día o un rango de fechas para ver el reporte'
}: CollectorReportViewProps) {
  const theme = useTheme()
  const currentUser = useCurrentUser()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)
  const [tempStart, setTempStart] = useState<Date | null>(null)
  const [report, setReport] = useState<CollectorPeriodReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastWithdrawal, setLastWithdrawal] = useState<{
    id: string;
    amount: number;
    currency: string;
    description: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
    manager: {
      id: string;
      fullName: string;
      email: string;
    };
  } | null>(null)
  const [loadingLastWithdrawal, setLoadingLastWithdrawal] = useState(false)

  // Drawer states
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [commissionDrawerOpen, setCommissionDrawerOpen] = useState(false)
  const [financialSummaryDrawerOpen, setFinancialSummaryDrawerOpen] = useState(false)

  // Commission editing states
  const [editingCommission, setEditingCommission] = useState(false)
  const [customPercentage, setCustomPercentage] = useState<number | ''>('')
  const [savingCommission, setSavingCommission] = useState(false)
  const [commissionSaveError, setCommissionSaveError] = useState<string | null>(null)
  const [commissionSnackbar, setCommissionSnackbar] = useState(false)

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [txViewMode, setTxViewMode] = useState<'list' | 'cards'>(isMobile ? 'cards' : 'list')

  // ─── Date helpers ──────────────────────────────────────────────────────────

  const normalizeDate = (date: Date): Date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime()
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

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadReport = async (start: Date, end: Date) => {
    try {
      setLoading(true)
      setError(null)
      const startStr = formatDateToString(normalizeDate(start))
      const endStr = formatDateToString(normalizeDate(end))
      const data = await collectorReportService.getPeriodReport(startStr, endStr, managerId)
      setReport(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setReport(null)
    setError(null)
    if (selectedRange) {
      loadReport(selectedRange.start, selectedRange.end)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId])

  useEffect(() => {
    const loadLastWithdrawal = async () => {
      const targetManagerId = managerId || currentUser?.id
      if (!targetManagerId) {
        setLastWithdrawal(null)
        return
      }
      setLoadingLastWithdrawal(true)
      try {
        const withdrawal = await collectorWalletService.getLastWithdrawal(targetManagerId)
        setLastWithdrawal(withdrawal)
      } catch {
        setLastWithdrawal(null)
      } finally {
        setLoadingLastWithdrawal(false)
      }
    }
    loadLastWithdrawal()
  }, [managerId, currentUser?.id])

  // ─── Calendar interaction ──────────────────────────────────────────────────

  const handleDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date)
    if (!tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      return
    }
    if (isSameDay(normalizedDate, tempStart)) {
      const range = { start: normalizedDate, end: normalizedDate }
      setSelectedRange(range)
      setTempStart(null)
      loadReport(range.start, range.end)
      setCalendarOpen(false)
      return
    }
    if (normalizedDate < tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      return
    }
    const range = { start: tempStart, end: normalizedDate }
    setSelectedRange(range)
    setTempStart(null)
    loadReport(range.start, range.end)
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

  // ─── Formatters ────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`
  }

  const formatCurrencyCompact = (amount: number) => {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    return `${sign}$${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(abs)}`
  }

  const formatCurrencyAbbr = (amount: number) => {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}K`
    return `${sign}$${abs}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
    })
  }

  // ─── Transaction helpers ───────────────────────────────────────────────────

  const getTransactionLabel = (type: string, amount?: number): string => {
    switch (type) {
      case 'COLLECTION': return 'Cobro'
      case 'WITHDRAWAL': return 'Retiro'
      case 'ROUTE_EXPENSE': return 'Gasto de Ruta'
      case 'LOAN_DISBURSEMENT': return 'Desembolso'
      case 'CASH_ADJUSTMENT': return amount !== undefined && amount < 0 ? '- Ajuste de Caja' : 'Ajuste de Caja'
      default: return 'Transacción'
    }
  }

  const getTransactionColor = (type: string, amount?: number): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (type) {
      case 'COLLECTION': return 'success'
      case 'WITHDRAWAL': return 'warning'
      case 'ROUTE_EXPENSE': return 'error'
      case 'LOAN_DISBURSEMENT': return 'error'
      case 'CASH_ADJUSTMENT': return amount !== undefined && amount < 0 ? 'error' : 'info'
      default: return 'default'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COLLECTION': return <TrendingUp />
      case 'WITHDRAWAL': return <TrendingDown />
      case 'ROUTE_EXPENSE': return <Receipt />
      case 'LOAN_DISBURSEMENT': return <AccountBalance />
      case 'CASH_ADJUSTMENT': return <SwapHoriz />
      default: return <AttachMoney />
    }
  }

  const getTransactionSign = (type: string, amount: number): string => {
    if (type === 'CASH_ADJUSTMENT') return amount < 0 ? '' : '+'
    if (type === 'COLLECTION') return '+'
    return '-'
  }

  const getAmountColor = (type: string, amount: number): string => {
    if (type === 'CASH_ADJUSTMENT') return amount < 0 ? 'error.main' : 'info.main'
    if (type === 'COLLECTION') return 'success.main'
    return 'error.main'
  }

  // ─── Commission editing ────────────────────────────────────────────────────

  const originalPercentage = report?.commission?.percentage ?? 0
  const displayPercentage = customPercentage !== '' ? customPercentage : originalPercentage
  const displayCommissionAmount = (report?.commission?.baseAmount ?? 0) * ((Number(displayPercentage)) / 100)
  const commissionChanged = customPercentage !== '' && Number(customPercentage) !== originalPercentage

  const handleCommissionDrawerClose = () => {
    setCommissionDrawerOpen(false)
    setEditingCommission(false)
    setCustomPercentage('')
    setCommissionSaveError(null)
  }

  const handleSaveCommission = async () => {
    if (!managerId) return
    setSavingCommission(true)
    setCommissionSaveError(null)
    try {
      await usersService.updateUser(managerId, { commission: Number(customPercentage) } as any)
      setEditingCommission(false)
      setCustomPercentage('')
      setCommissionSnackbar(true)
      if (selectedRange) {
        loadReport(selectedRange.start, selectedRange.end)
      }
    } catch {
      setCommissionSaveError('No se pudo guardar el cambio')
    } finally {
      setSavingCommission(false)
    }
  }

  // ─── Calendar grid ─────────────────────────────────────────────────────────

  const days = getDaysInMonth(currentMonth)
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // ─── Calendar block (shared between drawer and desktop column) ─────────────

  const calendarBlock = (
    <Box>
      {/* Month navigation */}
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

      {/* Day cells */}
      {weeks.map((week, weekIndex) => (
        <Box key={weekIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
          {week.map((date, dayIndex) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear()
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
                  py: 1.5,
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
                    color: isOtherMonth ? 'text.disabled' : inRange ? 'primary.main' : isToday ? 'primary.main' : 'text.primary',
                    fontWeight: (isStart || isEnd || isToday) ? 700 : 400,
                  }}
                >
                  {date.getDate()}
                </Typography>
                {isToday && !inRange && (
                  <Box sx={{
                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%', backgroundColor: 'primary.main',
                  }} />
                )}
              </Box>
            )
          })}
        </Box>
      ))}

      {/* Selection indicator */}
      {tempStart && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
          <Typography variant="caption" color="info.main" fontWeight={500}>
            Selecciona la fecha de fin para completar el rango
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Inicio: {tempStart.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
      )}

      {selectedRange && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
          <Typography variant="caption" color="success.main" fontWeight={500}>Rango seleccionado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isSameDay(selectedRange.start, selectedRange.end)
              ? selectedRange.start.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
              : `${selectedRange.start.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })} - ${selectedRange.end.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`
            }
          </Typography>
        </Box>
      )}

      {/* Último Retiro */}
      <Divider sx={{ my: 2 }} />
      {loadingLastWithdrawal ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : lastWithdrawal ? (
        <Box sx={{
          p: 1.5,
          bgcolor: alpha(theme.palette.warning.main, 0.08),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          borderRadius: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccountBalanceWallet sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main" fontWeight={600}>Último Retiro</Typography>
          </Box>
          {lastWithdrawal.createdAt && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Fecha: {new Date(lastWithdrawal.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </Typography>
          )}
          {lastWithdrawal.amount !== undefined && lastWithdrawal.amount !== null && (
            <Typography variant="body2" color="text.secondary">
              Monto: <strong>${lastWithdrawal.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.text.disabled, 0.05), borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">No hay retiros registrados</Typography>
        </Box>
      )}
    </Box>
  )

  // ─── Computed report values ────────────────────────────────────────────────

  const cobrado = report ? (report.cobrado ?? report.summary?.cobrado ?? report.collections?.amounts?.totalCollected ?? 0) : 0
  const prestado = report ? (report.prestado ?? report.summary?.prestado ?? report.loans?.totalAmount ?? 0) : 0
  const gastado = report ? (report.gastado ?? report.summary?.gastado ?? report.expenses?.total ?? 0) : 0
  const retirado = report ? (report.retirado ?? report.summary?.retirado ?? report.collectorWallet?.totalWithdrawals ?? 0) : 0
  // ajusteCaja: campo no tipado en CollectorPeriodReport, acceso seguro via cast
  const reportAny = report as any
  const ajusteCaja = report ? (reportAny.ajusteCaja ?? reportAny.summary?.ajusteCaja ?? reportAny.collectorWallet?.totalCashAdjustments ?? 0) : 0
  const baseNeto = report ? (report.neto ?? reportAny.summary?.neto ?? report.collectorWallet?.netAmount ?? 0) : 0
  const netoConAjuste = baseNeto
  const netoSinAjuste = baseNeto - ajusteCaja

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>

      {/* Pill selector de fechas — solo mobile */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
        endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        onClick={() => setCalendarOpen(true)}
        sx={{
          borderRadius: '20px',
          textTransform: 'none',
          px: 2,
          mb: 2,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        {selectedRange
          ? `${formatShortDate(selectedRange.start)} – ${formatShortDate(selectedRange.end)}`
          : 'Seleccionar período'}
      </Button>

      {/* BottomSheet calendario — mobile */}
      <SwipeableDrawer
        anchor="bottom"
        open={calendarOpen}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => setCalendarOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' } }}
      >
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Seleccionar período</Typography>
          {calendarBlock}
        </Box>
      </SwipeableDrawer>

      {/* Layout: columna calendario (desktop) + contenido */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '380px 1fr' },
        gap: { xs: 2, md: 3 },
        alignItems: 'start',
        width: '100%',
      }}>

        {/* Columna calendario — solo desktop */}
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          position: 'sticky',
          top: 24,
          display: { xs: 'none', md: 'block' },
          bgcolor: '#FFFFFF',
        }}>
          {calendarBlock}
        </Paper>

        {/* Columna de contenido */}
        <Box sx={{ width: '100%', minWidth: 0 }}>

          {/* Estado vacío */}
          {!selectedRange && !loading && (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#FFFFFF' }}>
              <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona un día o rango de fechas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Haz clic en un día para seleccionarlo, o selecciona dos días para crear un rango
              </Typography>
            </Paper>
          )}

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Cargando reporte...</Typography>
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {report && selectedRange && !loading && (
            <Box>

              {/* ── Header cobrador ── */}
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, bgcolor: '#FFFFFF', borderLeft: 4, borderLeftColor: 'primary.main' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {report.collector?.fullName || 'Cobrador'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Usuario</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>{report.collector?.userId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rol</Typography>
                    <Typography variant="body2" fontWeight={500}>{report.collector?.role}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">% Comisión</Typography>
                    <Typography variant="body2" fontWeight={500}>{report.collector?.commissionPercentage}%</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr' }, gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Desde</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(report.period.startDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hasta</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(report.period.endDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* ── Resumen grouped list ── */}
              <Paper sx={{ mb: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <List disablePadding>
                  {[
                    { icon: <TrendingUp sx={{ fontSize: 20 }} />, label: 'Cobrado', value: cobrado, color: 'success.main' },
                    { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: 'Prestado', value: prestado, color: 'info.main' },
                    { icon: <Receipt sx={{ fontSize: 20 }} />, label: 'Gastado', value: gastado, color: 'error.main' },
                    { icon: <TrendingDown sx={{ fontSize: 20 }} />, label: 'Retirado', value: retirado, color: 'warning.main' },
                    { icon: <SwapHoriz sx={{ fontSize: 20 }} />, label: 'Ajuste de Caja', value: ajusteCaja, color: 'info.main' },
                    { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: 'Neto (con ajuste)', value: netoConAjuste, color: 'primary.main' },
                    { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: 'Neto (sin ajuste)', value: netoSinAjuste, color: 'text.primary' },
                  ].map((item, i, arr) => (
                    <React.Fragment key={item.label}>
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
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              {/* ── Estadísticas de Cobros ── */}
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Estadísticas de Cobros
                </Typography>

                {/* Grid 3x2 compacto — cantidades y porcentajes */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.5 }}>
                  {[
                    { label: 'A Cobrar', value: report.collections?.totalDue || 0, color: 'info.main', isCount: true },
                    { label: 'Completos', value: report.collections?.collected?.full || 0, color: 'success.main', isCount: true },
                    { label: 'Parciales', value: report.collections?.collected?.partial || 0, color: 'warning.main', isCount: true },
                    { label: 'Total Cobrado', value: report.collections?.collected?.total || 0, color: 'success.dark', isCount: true },
                    { label: 'No Cobrados', value: report.collections?.failed || 0, color: 'error.main', isCount: true },
                    {
                      label: 'Eficiencia',
                      value: report.collections?.totalDue && report.collections?.collected?.total
                        ? ((report.collections.collected.total / report.collections.totalDue) * 100)
                        : 0,
                      color: 'primary.main',
                      isPercent: true,
                    },
                  ].map((stat) => (
                    <Box key={stat.label} sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                      <Typography variant="h6" fontWeight={700} color={stat.color} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                        {'isPercent' in stat && stat.isPercent
                          ? `${(stat.value as number).toFixed(1)}%`
                          : stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* 3 montos */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {[
                    { label: 'Monto a Cobrar', value: report.collections?.amounts?.totalDue || 0, color: 'info.main' },
                    { label: 'Monto Cobrado', value: report.collections?.amounts?.totalCollected || 0, color: 'success.main' },
                    { label: 'Pendiente', value: (report.collections?.amounts?.totalDue || 0) - (report.collections?.amounts?.totalCollected || 0), color: 'error.main' },
                  ].map((monto) => (
                    <Box key={monto.label} sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                      <Typography variant="body2" fontWeight={700} color={monto.color} sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        {isMobile ? formatCurrencyAbbr(monto.value) : formatCurrencyCompact(monto.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {monto.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* ── Comisión — fila cliqueable ── */}
              <Paper sx={{ mb: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <ListItem
                  component="div"
                  onClick={() => setCommissionDrawerOpen(true)}
                  sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AccountBalance sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Comisión del Cobrador"
                    secondary={`${report.commission?.percentage ?? 0}% — ${formatCurrencyCompact(report.commission?.commissionAmount ?? 0)}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ChevronRight sx={{ color: 'text.disabled' }} />
                </ListItem>
              </Paper>

              {/* ── Resumen Financiero — fila cliqueable ── */}
              <Paper sx={{ mb: 2, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <ListItem
                  component="div"
                  onClick={() => setFinancialSummaryDrawerOpen(true)}
                  sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Assessment sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Resumen Financiero Completo"
                    secondary="Ver desglose detallado"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ChevronRight sx={{ color: 'text.disabled' }} />
                </ListItem>
              </Paper>

              {/* ── Gastos del Período ── */}
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Gastos del Período
                </Typography>

                <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08), textAlign: 'center' }}>
                  <Typography variant="h5" color="error.main" fontWeight={700}>
                    {formatCurrency(report.expenses?.total || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Total de Gastos</Typography>
                </Box>

                {report.expenses?.byCategory && Object.keys(report.expenses.byCategory).length > 0 && (
                  <>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Por categoría
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1, mb: 2 }}>
                      {report.expenses.byCategory.COMBUSTIBLE !== undefined && (
                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.08), textAlign: 'center' }}>
                          <Typography variant="body2" color="warning.main" fontWeight={600}>{formatCurrency(report.expenses.byCategory.COMBUSTIBLE)}</Typography>
                          <Typography variant="caption" color="text.secondary">Combustible</Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.CONSUMO !== undefined && (
                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.08), textAlign: 'center' }}>
                          <Typography variant="body2" color="info.main" fontWeight={600}>{formatCurrency(report.expenses.byCategory.CONSUMO)}</Typography>
                          <Typography variant="caption" color="text.secondary">Consumo</Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.REPARACIONES !== undefined && (
                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08), textAlign: 'center' }}>
                          <Typography variant="body2" color="error.main" fontWeight={600}>{formatCurrency(report.expenses.byCategory.REPARACIONES)}</Typography>
                          <Typography variant="caption" color="text.secondary">Reparaciones</Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.OTROS !== undefined && (
                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.grey[500], 0.08), textAlign: 'center' }}>
                          <Typography variant="body2" color="text.primary" fontWeight={600}>{formatCurrency(report.expenses.byCategory.OTROS)}</Typography>
                          <Typography variant="caption" color="text.secondary">Otros</Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}

                {report.expenses?.detail && report.expenses.detail.length > 0 && (
                  <>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Detalle
                    </Typography>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 400 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {report.expenses.detail.map((expense, index) => (
                            <TableRow key={index} hover>
                              <TableCell><Typography variant="caption">{formatDate(expense.date)}</Typography></TableCell>
                              <TableCell><Chip label={expense.category} size="small" /></TableCell>
                              <TableCell><Typography variant="body2">{expense.description}</Typography></TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={600} color="error.main">{formatCurrency(expense.amount)}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {(!report.expenses?.detail || report.expenses.detail.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay gastos registrados en este período
                  </Typography>
                )}
              </Paper>

              {/* ── Transacciones Wallet ── */}
              <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 2, bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Transacciones de la Wallet
                  </Typography>
                  {report.collectorWallet?.transactions && report.collectorWallet.transactions.length > 0 && (
                    <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 1, p: 0.25 }}>
                      <IconButton
                        size="small"
                        onClick={() => setTxViewMode('list')}
                        sx={{
                          borderRadius: 1,
                          bgcolor: txViewMode === 'list' ? 'primary.main' : 'transparent',
                          color: txViewMode === 'list' ? 'white' : 'text.secondary',
                          '&:hover': { bgcolor: txViewMode === 'list' ? 'primary.dark' : 'action.selected' },
                        }}
                      >
                        <ViewList fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setTxViewMode('cards')}
                        sx={{
                          borderRadius: 1,
                          bgcolor: txViewMode === 'cards' ? 'primary.main' : 'transparent',
                          color: txViewMode === 'cards' ? 'white' : 'text.secondary',
                          '&:hover': { bgcolor: txViewMode === 'cards' ? 'primary.dark' : 'action.selected' },
                        }}
                      >
                        <ViewModule fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />

                {report.collectorWallet?.transactions && report.collectorWallet.transactions.length > 0 ? (
                  txViewMode === 'list' ? (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Balance Antes</TableCell>
                            <TableCell align="right">Balance Después</TableCell>
                            <TableCell align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {report.collectorWallet.transactions.map((tx) => (
                            <TableRow key={tx.id} hover>
                              <TableCell><Typography variant="body2">{formatDate(tx.createdAt)}</Typography></TableCell>
                              <TableCell>
                                <Chip
                                  icon={getTransactionIcon(tx.type)}
                                  label={getTransactionLabel(tx.type, tx.amount)}
                                  size="small"
                                  color={getTransactionColor(tx.type, tx.amount)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell><Typography variant="body2">{tx.description}</Typography></TableCell>
                              <TableCell align="right"><Typography variant="body2" color="text.secondary">{formatCurrency(tx.balanceBefore)}</Typography></TableCell>
                              <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatCurrency(tx.balanceAfter)}</Typography></TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight={600} color={getAmountColor(tx.type, tx.amount)}>
                                  {getTransactionSign(tx.type, tx.amount)}{formatCurrency(Math.abs(tx.amount))}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {report.collectorWallet.transactions.map((tx) => (
                        <Card
                          key={tx.id}
                          variant="outlined"
                          sx={{
                            borderLeft: 4,
                            borderLeftColor: tx.type === 'COLLECTION' ? 'success.main'
                              : tx.type === 'CASH_ADJUSTMENT' && tx.amount >= 0 ? 'info.main'
                              : 'error.main',
                          }}
                        >
                          <CardContent sx={{ px: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Chip
                                icon={getTransactionIcon(tx.type)}
                                label={getTransactionLabel(tx.type, tx.amount)}
                                size="small"
                                color={getTransactionColor(tx.type, tx.amount)}
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                            <Typography variant="h6" fontWeight={700} color={getAmountColor(tx.type, tx.amount)} sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                              {getTransactionSign(tx.type, tx.amount)}{formatCurrency(Math.abs(tx.amount))}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{tx.description}</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>{formatDate(tx.createdAt)}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.disabled">{formatCurrency(tx.balanceBefore)}</Typography>
                              <Typography variant="caption" color="text.disabled">→</Typography>
                              <Typography variant="caption" fontWeight={600}>{formatCurrency(tx.balanceAfter)}</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No hay transacciones registradas en este período
                  </Typography>
                )}
              </Paper>

            </Box>
          )}
        </Box>
      </Box>

      {/* ── BottomSheet Comisión ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={commissionDrawerOpen}
        onOpen={() => setCommissionDrawerOpen(true)}
        onClose={handleCommissionDrawerClose}
        PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' } }}
      >
        <Box sx={{ px: 3, pt: 3.5, pb: 'calc(24px + env(safe-area-inset-bottom))', maxWidth: { sm: 480 }, mx: { sm: 'auto' } }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary', letterSpacing: -0.3 }}>
            Comisión del Cobrador
          </Typography>

          {report && (
            <>
              {/* Fila compacta: Porcentaje | Monto Base | Comisión Total */}
              <Box sx={{ display: 'flex', gap: 3, mb: 2.5, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Porcentaje
                  </Typography>
                  <Box
                    onClick={() => !editingCommission && setEditingCommission(true)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: editingCommission ? 'default' : 'pointer' }}
                  >
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                      {displayPercentage}%
                    </Typography>
                    {!editingCommission && <Edit sx={{ fontSize: 14, color: 'text.disabled' }} />}
                  </Box>
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Monto Base
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {formatCurrency(report.commission?.baseAmount || 0)}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Comisión Total
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {formatCurrency(displayCommissionAmount)}
                  </Typography>
                  {commissionChanged && (
                    <Typography variant="caption" color="text.disabled">
                      antes: {formatCurrency((report.commission?.baseAmount || 0) * (originalPercentage / 100))}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Input de edición */}
              {editingCommission && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <TextField
                    fullWidth
                    type="number"
                    value={customPercentage}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') { setCustomPercentage(''); return }
                      const num = Math.min(100, Math.max(0, Number(val)))
                      setCustomPercentage(num)
                    }}
                    placeholder={`${originalPercentage}`}
                    autoFocus
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        minHeight: 44,
                        '& fieldset': { borderColor: 'divider' },
                        '&:hover fieldset': { borderColor: 'text.disabled' },
                        '&.Mui-focused fieldset': { borderColor: 'text.primary', borderWidth: 1.5 },
                      },
                      '& input': { fontSize: '0.9375rem' },
                    }}
                  />

                  {commissionSaveError && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1.5 }}>
                      {commissionSaveError}
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    onClick={handleSaveCommission}
                    variant="contained"
                    disableElevation
                    disabled={savingCommission || customPercentage === '' || !commissionChanged}
                    sx={{
                      minHeight: 48,
                      borderRadius: 2,
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      mb: 1,
                    }}
                  >
                    {savingCommission ? <CircularProgress size={20} color="inherit" /> : 'Guardar cambio'}
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => {
                      setEditingCommission(false)
                      setCustomPercentage('')
                      setCommissionSaveError(null)
                    }}
                    variant="text"
                    sx={{
                      minHeight: 44,
                      borderRadius: 2,
                      fontSize: '0.9375rem',
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      </SwipeableDrawer>

      {/* ── BottomSheet Resumen Financiero ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={financialSummaryDrawerOpen}
        onOpen={() => setFinancialSummaryDrawerOpen(true)}
        onClose={() => setFinancialSummaryDrawerOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' } }}
      >
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Resumen Financiero Completo</Typography>
          {report && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">Total Cobros</Typography>
                  </Box>
                  <Typography variant="h6" color="success.main" fontWeight={700}>{formatCurrency(report.summary?.cobrado || 0)}</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingDown sx={{ fontSize: 18, color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary">Total Retiros</Typography>
                  </Box>
                  <Typography variant="h6" color="warning.main" fontWeight={700}>{formatCurrency(report.summary?.retirado || 0)}</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Receipt sx={{ fontSize: 18, color: 'error.main' }} />
                    <Typography variant="caption" color="text.secondary">Total Gastos</Typography>
                  </Box>
                  <Typography variant="h6" color="error.main" fontWeight={700}>{formatCurrency(report.summary?.gastado || 0)}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Neto Antes de Comisión</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{formatCurrency(report.summary?.neto || 0)}</Typography>
                  <Typography variant="caption" color="text.disabled">Cobros − Retiros − Gastos</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Comisión</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{formatCurrency(report.summary?.commission || 0)}</Typography>
                  <Typography variant="caption" color="text.disabled">{report.commission?.percentage || 0}% s/ {formatCurrency(report.commission?.baseAmount || 0)}</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>Neto Final</Typography>
                  <Typography variant="h5" color="primary.main" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{formatCurrency((report.summary?.neto || 0) - (report.summary?.commission || 0))}</Typography>
                  <Typography variant="caption" color="text.disabled">Después de Comisión</Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={commissionSnackbar}
        autoHideDuration={3000}
        onClose={() => setCommissionSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message="Comisión actualizada correctamente"
      />
    </Box>
  )
}
