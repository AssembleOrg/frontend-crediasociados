'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material'
import { CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { DateTime } from 'luxon'

interface RescheduleDateDialogProps {
  open: boolean
  onClose: () => void
  onSave: (isoDate: string) => Promise<void>
  title: string
  currentDueDate?: string
}

export default function RescheduleDateDialog({
  open,
  onClose,
  onSave,
  title,
  currentDueDate,
}: RescheduleDateDialogProps) {
  const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').startOf('day')
  const todayIso = today.toISODate() || ''

  const [newDate, setNewDate] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<DateTime>(() => today.startOf('month'))

  useEffect(() => {
    if (open) {
      const currentDt = currentDueDate
        ? DateTime.fromISO(currentDueDate).setZone('America/Argentina/Buenos_Aires')
        : today
      const iso = currentDt.toISODate() || todayIso
      setNewDate(iso)
      setDateInput(currentDt.toFormat('dd/MM/yyyy'))
      setCalendarMonth(currentDt.startOf('month'))
      setSaving(false)
    }
  }, [open, currentDueDate])

  const handleCalendarDateClick = (day: DateTime) => {
    const iso = day.toISODate() || ''
    setNewDate(iso)
    setDateInput(day.toFormat('dd/MM/yyyy'))
  }

  const handleDateInputChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    let formatted = ''
    if (digits.length <= 2) formatted = digits
    else if (digits.length <= 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    else formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
    setDateInput(formatted)

    if (digits.length === 8) {
      const parsed = DateTime.fromFormat(formatted, 'dd/MM/yyyy')
      if (parsed.isValid) {
        setNewDate(parsed.toISODate() || '')
        setCalendarMonth(parsed.startOf('month'))
      }
    }
  }

  const handleSave = async () => {
    if (!newDate || !isDateValid) return
    setSaving(true)
    try {
      await onSave(newDate)
    } finally {
      setSaving(false)
    }
  }

  const isDateValid = newDate >= todayIso

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
        pb: 2, pt: 3, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarMonth sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{
        pt: 3,
        pb: 'calc(16px + env(safe-area-inset-bottom))',
        px: { xs: 1.5, sm: 3 },
        overflowY: 'auto',
      }}>
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

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
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

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <Typography key={i} variant="caption" align="center" fontWeight="bold" color="text.secondary">
                {day}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {generateCalendarDays().map((day, i) => {
              const isSelected = day.toISODate() === newDate
              const isCurrentMonth = day.month === calendarMonth.month
              const isTodayDate = day.equals(today)
              const isDisabled = day < today

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
                    '&:hover': { bgcolor: isSelected ? '#1565c0' : 'action.hover' },
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

        {newDate && isDateValid && (
          <Typography variant="body2" sx={{ mt: 1.5, textAlign: 'center', color: '#1976d2', fontWeight: 600 }}>
            {DateTime.fromISO(newDate).toFormat("EEEE dd 'de' MMMM yyyy", { locale: 'es' })}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !newDate || !isDateValid}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
