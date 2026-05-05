'use client'

import { useState } from 'react'
import { Box, Typography, Chip, Tooltip, useTheme, useMediaQuery, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked, Warning, Error, Refresh, AttachMoney, Edit, CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'
import { subLoansService } from '@/services/sub-loans.service'
import { DateTime } from 'luxon'

interface LoanTimelineProps {
  clientName: string
  subLoans: SubLoanWithClientInfo[]
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
  onResetClick?: (subloan: SubLoanWithClientInfo) => void
  resettingSubloanId?: string | null
  onDateUpdated?: () => void
}

interface TimelineNodeProps {
  subloan: SubLoanWithClientInfo
  index: number
  isLast: boolean
  getUrgencyLevel: (subloan: SubLoanWithClientInfo) => 'overdue' | 'today' | 'soon' | 'future'
  compact?: boolean
  onPaymentClick?: (subloan: SubLoanWithClientInfo) => void
  onResetClick?: (subloan: SubLoanWithClientInfo) => void
  resettingSubloanId?: string | null
  onDateUpdated?: () => void
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
  subloan,
  isLast,
  getUrgencyLevel,
  compact = false,
  onPaymentClick,
  onResetClick,
  resettingSubloanId,
  onDateUpdated
}) => {
  const urgency = getUrgencyLevel(subloan)
  const isPaid = subloan.status === 'PAID'
  const isPartial = subloan.status === 'PARTIAL'

  // Reset only allowed if last payment was today
  const canReset = isPaid && onResetClick && (() => {
    if (!subloan.payments || subloan.payments.length === 0) return false
    const todayStr = DateTime.now().setZone('America/Argentina/Buenos_Aires').toFormat('yyyy-MM-dd')
    return subloan.payments.some((p: any) => {
      const payDate = DateTime.fromISO(p.paymentDate || p.createdAt).setZone('America/Argentina/Buenos_Aires').toFormat('yyyy-MM-dd')
      return payDate === todayStr
    })
  })()

  const [editDateOpen, setEditDateOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [dateInput, setDateInput] = useState('') // DD/MM/YYYY text input
  const [saving, setSaving] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<DateTime>(() => DateTime.now().startOf('month'))

  const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').toISODate() || ''

  const getNodeColors = () => {
    if (isPaid) {
      return { primary: '#4caf50', bg: '#e8f5e8', icon: CheckCircle, border: '#4caf50' }
    }
    if (isPartial) {
      return { primary: '#2196f3', bg: '#e3f2fd', icon: CheckCircle, border: '#2196f3' }
    }
    switch (urgency) {
      case 'overdue':
        return { primary: '#f44336', bg: '#ffebee', icon: Error, border: '#f44336' }
      case 'today':
        return { primary: '#ff9800', bg: '#fff3e0', icon: Warning, border: '#ff9800' }
      case 'soon':
        return { primary: '#ffc107', bg: '#fff8e1', icon: Warning, border: '#ffc107' }
      default:
        return { primary: '#9e9e9e', bg: '#f5f5f5', icon: RadioButtonUnchecked, border: '#e0e0e0' }
    }
  }

  const colors = getNodeColors()
  const IconComponent = colors.icon

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
  }

  const getDaysInfo = () => {
    if (isPaid) return 'Pagada'
    if (isPartial) {
      const paidAmount = subloan.paidAmount || 0
      const totalAmount = subloan.totalAmount ?? 0
      const pending = totalAmount - paidAmount
      return `Pagado parcial: $${paidAmount.toLocaleString()} (Resta: $${pending.toLocaleString()})`
    }
    const dateToCheck = subloan.dueDate
    if (!dateToCheck) return 'Sin fecha vencimiento'
    const todayDt = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
    const targetDate = DateTime.fromISO(dateToCheck).setZone('America/Argentina/Buenos_Aires').startOf('day')
    const diffDays = Math.round(targetDate.diff(todayDt, 'days').days)
    if (diffDays < 0) return `${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'} vencida`
    if (diffDays === 0) return 'Vence hoy'
    if (diffDays === 1) return 'Vence manana'
    return `En ${diffDays} dia${diffDays === 1 ? '' : 's'}`
  }

  const getPaymentDescriptions = () => {
    if ((isPaid || isPartial) && subloan.payments && Array.isArray(subloan.payments) && subloan.payments.length > 0) {
      const descriptions = subloan.payments
        .filter((p: any) => p && p.description && typeof p.description === 'string' && p.description.trim())
        .map((p: any) => p.description.trim())
      return descriptions.length > 0 ? descriptions.join(', ') : null
    }
    return null
  }

  const paymentDescriptions = getPaymentDescriptions()
  const canInteract = !isPaid && (onPaymentClick || onDateUpdated)
  const [showActions, setShowActions] = useState(false)

  const handleNodeClick = () => {
    if (!canInteract) return
    setShowActions(prev => !prev)
  }

  const handlePayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions(false)
    if (onPaymentClick) onPaymentClick(subloan)
  }

  const handleEditDateClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setShowActions(false)
    const currentDate = subloan.dueDate
      ? DateTime.fromISO(subloan.dueDate).setZone('America/Argentina/Buenos_Aires')
      : DateTime.now().setZone('America/Argentina/Buenos_Aires')
    const iso = currentDate.toISODate() || today
    setNewDate(iso)
    setDateInput(currentDate.toFormat('dd/MM/yyyy'))
    setCalendarMonth(currentDate.startOf('month'))
    setEditDateOpen(true)
  }

  const handleCalendarDateClick = (day: DateTime) => {
    const iso = day.toISODate() || ''
    setNewDate(iso)
    setDateInput(day.toFormat('dd/MM/yyyy'))
  }

  const handleDateInputChange = (value: string) => {
    // Allow typing with auto-formatting
    const digits = value.replace(/\D/g, '')
    let formatted = ''
    if (digits.length <= 2) formatted = digits
    else if (digits.length <= 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    else formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
    setDateInput(formatted)

    // Try to parse complete date
    if (digits.length === 8) {
      const parsed = DateTime.fromFormat(formatted, 'dd/MM/yyyy')
      if (parsed.isValid) {
        setNewDate(parsed.toISODate() || '')
        setCalendarMonth(parsed.startOf('month'))
      }
    }
  }

  const handleSaveDate = async () => {
    if (!subloan.id || !newDate) return
    setSaving(true)
    try {
      await subLoansService.updateDueDate(subloan.id, new Date(newDate + 'T12:00:00').toISOString())
      setEditDateOpen(false)
      if (onDateUpdated) onDateUpdated()
    } catch (err) {
      // Error saving
    } finally {
      setSaving(false)
    }
  }

  const isDateValid = newDate >= today

  // Calendar generation
  const generateCalendarDays = () => {
    const startOfMonth = calendarMonth.startOf('month')
    const endOfMonth = calendarMonth.endOf('month')
    const startDay = startOfMonth.startOf('week')
    const endDay = endOfMonth.endOf('week')
    const days: DateTime[] = []
    let current = startDay
    while (current <= endDay) {
      days.push(current)
      current = current.plus({ days: 1 })
    }
    return days
  }

  return (
    <>
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              Cuota #{subloan.paymentNumber}
            </Typography>
            <Typography variant="caption" display="block">
              Monto: ${(subloan.totalAmount ?? 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" display="block">
              Vencimiento: {subloan.dueDate ? formatDate(subloan.dueDate) : 'N/A'}
            </Typography>
            <Typography variant="caption" display="block" color={colors.primary}>
              {getDaysInfo()}
            </Typography>
            {(subloan.paidAmount ?? 0) > 0 && (
              <Typography variant="caption" display="block" color="success.main">
                Pagado: ${(subloan.paidAmount ?? 0).toLocaleString()}
              </Typography>
            )}
            {paymentDescriptions && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: 'white', maxWidth: 200, wordBreak: 'break-word', fontSize: '1rem' }}>
                  {paymentDescriptions}
                </Typography>
              </Box>
            )}
          </Box>
        }
        arrow
        disableHoverListener={showActions || editDateOpen}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            minWidth: compact ? 80 : 'auto',
            flex: compact ? '0 0 80px' : '1 0 100px',
            cursor: canInteract ? 'pointer' : 'default',
            transition: 'transform 0.2s ease',
            // No extra padding - ears are inline now
            ...(canInteract && {
              '&:hover': {
                transform: 'scale(1.05)',
                '& .payment-hint': { opacity: 1 }
              },
            })
          }}
          onClick={handleNodeClick}
        >
          {/* Action Buttons Row (inline, not absolute) */}
          {canInteract && showActions ? (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, justifyContent: 'center' }}>
              {onPaymentClick && (
                <IconButton
                  size="small"
                  onClick={handlePayClick}
                  sx={{
                    width: compact ? 28 : 36,
                    height: compact ? 28 : 36,
                    bgcolor: '#4caf50',
                    color: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: '#388e3c' },
                  }}
                >
                  <AttachMoney sx={{ fontSize: compact ? 16 : 20 }} />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={handleEditDateClick}
                sx={{
                  width: compact ? 28 : 36,
                  height: compact ? 28 : 36,
                  bgcolor: '#1976d2',
                  color: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#1565c0' },
                }}
              >
                <Edit sx={{ fontSize: compact ? 14 : 18 }} />
              </IconButton>
            </Box>
          ) : (
            // Spacer to keep consistent height when actions not shown
            <Box sx={{ height: compact ? 28 : 36, mb: 0.5 }} />
          )}

          {/* Connection Line */}
          {!isLast && (
            <Box sx={{
              position: 'absolute',
              top: compact ? 38 : 42,
              left: '50%',
              right: compact ? -32 : -50,
              height: 2,
              bgcolor: isPaid ? '#4caf50' : '#e0e0e0',
              zIndex: 0
            }} />
          )}

          {/* Node Icon */}
          <Box sx={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: '50%',
            bgcolor: colors.bg,
            border: `3px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            mb: 1,
            boxShadow: isPaid ? '0 2px 8px rgba(76, 175, 80, 0.3)' : undefined
          }}>
            <IconComponent sx={{ fontSize: compact ? 18 : 24, color: colors.primary }} />
          </Box>

          {/* Cuota Number */}
          <Typography variant={compact ? 'caption' : 'body2'} fontWeight="bold" color={colors.primary} sx={{ mb: 0.5 }}>
            #{subloan.paymentNumber}
          </Typography>

          {/* Date and Amount */}
          {!compact && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                {formatDate(subloan.dueDate)}
              </Typography>
              <Typography variant="caption" fontWeight="bold" color={colors.primary}>
                ${(subloan.totalAmount ?? 0).toLocaleString()}
              </Typography>
            </>
          )}

          {/* Status Indicator */}
          <Chip
            label={getDaysInfo()}
            size="small"
            sx={{
              bgcolor: colors.primary,
              color: 'white',
              fontSize: compact ? '9px' : '11px',
              height: 'auto',
              mt: 0.5,
              maxWidth: 'none',
              '& .MuiChip-label': {
                px: compact ? 0.5 : 1,
                py: 0.25,
                whiteSpace: 'normal',
                overflow: 'visible',
                textAlign: 'center',
                lineHeight: 1.3,
              }
            }}
          />

          {/* Reset Button - only if payment was today */}
          {canReset && (
            compact ? (
              <IconButton
                size="small"
                color="warning"
                onClick={(e) => { e.stopPropagation(); onResetClick(subloan) }}
                disabled={resettingSubloanId === subloan.id}
                sx={{ mt: 0.5, width: 24, height: 24 }}
              >
                {resettingSubloanId === subloan.id ? <CircularProgress size={12} /> : <Refresh sx={{ fontSize: 14 }} />}
              </IconButton>
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={resettingSubloanId === subloan.id ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 14 }} />}
                onClick={(e) => { e.stopPropagation(); onResetClick(subloan) }}
                disabled={resettingSubloanId === subloan.id}
                sx={{ mt: 1, minWidth: 'auto', px: 1, py: 0.5, fontSize: '10px', textTransform: 'none', borderWidth: 1.5, fontWeight: 600 }}
              >
                {resettingSubloanId === subloan.id ? 'Reseteando...' : 'Resetear'}
              </Button>
            )
          )}
        </Box>
      </Tooltip>

      {/* Edit Date Dialog */}
      <Dialog
        open={editDateOpen}
        onClose={() => setEditDateOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1500 }}
        PaperProps={{ sx: { borderRadius: 3, mx: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
        }}>
          <CalendarMonth sx={{ fontSize: 22 }} />
          <Typography variant="subtitle1" component="span" fontWeight={600}>
            Cambiar Vencimiento - Cuota #{subloan.paymentNumber}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: { xs: 1.5, sm: 3 } }}>
          {/* Text input DD/MM/YYYY */}
          <TextField
            label="Fecha (DD/MM/AAAA)"
            value={dateInput}
            onChange={(e) => handleDateInputChange(e.target.value)}
            placeholder="10/04/2026"
            fullWidth
            size="small"
            sx={{ mb: 2, mt: 1 }}
            InputLabelProps={{ shrink: true }}
            error={dateInput.length === 10 && !isDateValid}
            helperText={dateInput.length === 10 && !isDateValid ? 'La fecha no puede ser anterior a hoy' : ''}
          />

          {/* Calendar */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
            {/* Month Navigation */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <IconButton size="small" onClick={() => setCalendarMonth(prev => prev.minus({ months: 1 }))}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                {calendarMonth.toFormat('MMMM yyyy', { locale: 'es' })}
              </Typography>
              <IconButton size="small" onClick={() => setCalendarMonth(prev => prev.plus({ months: 1 }))}>
                <ChevronRight />
              </IconButton>
            </Stack>

            {/* Weekday Headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <Typography key={i} variant="caption" align="center" fontWeight="bold" color="text.secondary">
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {generateCalendarDays().map((day, i) => {
                const todayDt = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
                const isSelected = day.toISODate() === newDate
                const isCurrentMonth = day.month === calendarMonth.month
                const isTodayDate = day.equals(todayDt)
                const isDisabled = day < todayDt

                return (
                  <Button
                    key={i}
                    onClick={() => !isDisabled && handleCalendarDateClick(day)}
                    disabled={isDisabled}
                    sx={{
                      minWidth: 0,
                      width: { xs: 28, sm: 36 },
                      height: { xs: 28, sm: 36 },
                      p: 0,
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      borderRadius: 1,
                      color: !isCurrentMonth ? 'text.disabled' : isDisabled ? 'text.disabled' : 'text.primary',
                      bgcolor: isSelected ? '#1976d2' : isTodayDate ? 'primary.light' : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? '#1565c0' : 'action.hover',
                      },
                      ...(isSelected && { color: 'white', fontWeight: 'bold' }),
                      ...(isTodayDate && !isSelected && { border: '2px solid', borderColor: 'primary.main' }),
                    }}
                  >
                    {day.day}
                  </Button>
                )
              })}
            </Box>
          </Box>

          {/* Selected date display */}
          {newDate && isDateValid && (
            <Typography variant="body2" sx={{ mt: 1.5, textAlign: 'center', color: '#1976d2', fontWeight: 600 }}>
              {DateTime.fromISO(newDate).toFormat("EEEE dd 'de' MMMM yyyy", { locale: 'es' })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDateOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDate}
            disabled={saving || !newDate || !isDateValid}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export const LoanTimeline: React.FC<LoanTimelineProps> = ({
  clientName,
  subLoans,
  compact = false,
  onPaymentClick,
  onResetClick,
  resettingSubloanId,
  onDateUpdated
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const getUrgencyLevel = (subloan: SubLoanWithClientInfo): 'overdue' | 'today' | 'soon' | 'future' => {
    const dateToCheck = subloan.dueDate
    if (!dateToCheck) return 'future'
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
    const targetDate = DateTime.fromISO(dateToCheck).setZone('America/Argentina/Buenos_Aires').startOf('day')
    const diffDays = targetDate.diff(today, 'days').days
    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays <= 2) return 'soon'
    return 'future'
  }

  const totalCuotas = subLoans.length
  const paidCuotas = subLoans.filter(s => s.status === 'PAID').length
  const pendingCuotas = totalCuotas - paidCuotas
  const progressPercentage = totalCuotas > 0 ? (paidCuotas / totalCuotas) * 100 : 0

  const totalAmount = subLoans.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const paidAmount = subLoans.reduce((sum, s) => {
    if (s.status === 'PAID') return sum + (s.totalAmount || 0)
    if (s.status === 'PARTIAL') return sum + (s.paidAmount || 0)
    return sum
  }, 0)
  const remainingAmount = totalAmount - paidAmount

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`
  }

  const getRemainingAmountColor = () => {
    const percentageRemaining = (remainingAmount / totalAmount) * 100
    if (percentageRemaining < 25) return 'success.main'
    if (percentageRemaining < 50) return 'warning.main'
    return 'error.main'
  }

  const sortedSubLoans = [...subLoans].sort((a, b) => (a.paymentNumber ?? 0) - (b.paymentNumber ?? 0))
  const isCompactMode = compact || isMobile

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {clientName} - Timeline de Cuotas
        </Typography>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 2
        }}>
          <Chip
            label={`Progreso: ${paidCuotas}/${totalCuotas} cuotas (${Math.round(progressPercentage)}%)`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Resta pagar: ${formatCurrency(remainingAmount)} en ${pendingCuotas} cuota${pendingCuotas !== 1 ? 's' : ''}`}
            size="small"
            variant="filled"
            color={remainingAmount <= 0 ? 'success' : undefined}
            sx={{
              backgroundColor: remainingAmount <= 0 ? undefined : getRemainingAmountColor(),
              color: 'white'
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ width: '100%', height: 8, bgcolor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ width: `${progressPercentage}%`, height: '100%', bgcolor: '#4caf50', transition: 'width 0.5s ease' }} />
        </Box>
      </Box>

      {/* Timeline */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          pt: 0.5,
          gap: { xs: 0, sm: 2 },
          justifyContent: sortedSubLoans.length <= 8 ? 'space-evenly' : 'flex-start',
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-track': { bgcolor: '#f1f1f1', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#c1c1c1', borderRadius: 3, '&:hover': { bgcolor: '#a8a8a8' } }
        }}
      >
        {sortedSubLoans.map((subloan, index) => (
          <TimelineNode
            key={subloan.id}
            subloan={subloan}
            index={index}
            isLast={index === sortedSubLoans.length - 1}
            getUrgencyLevel={getUrgencyLevel}
            compact={isCompactMode}
            onPaymentClick={onPaymentClick}
            onResetClick={onResetClick}
            resettingSubloanId={resettingSubloanId}
            onDateUpdated={onDateUpdated}
          />
        ))}
      </Box>

      {/* Legend */}
      {!compact && (
        <Box sx={{
          mt: 3,
          p: 2,
          bgcolor: '#f9f9f9',
          borderRadius: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
            <Typography variant="caption">Pagada</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Error sx={{ color: '#f44336', fontSize: 16 }} />
            <Typography variant="caption">Vencida</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning sx={{ color: '#ff9800', fontSize: 16 }} />
            <Typography variant="caption">Vence hoy</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning sx={{ color: '#ffc107', fontSize: 16 }} />
            <Typography variant="caption">Vence pronto</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RadioButtonUnchecked sx={{ color: '#9e9e9e', fontSize: 16 }} />
            <Typography variant="caption">Pendiente</Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default LoanTimeline
