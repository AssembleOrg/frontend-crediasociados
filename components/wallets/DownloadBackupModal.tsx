'use client'

import { useState, useRef, useEffect } from 'react'
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
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarMonth,
} from '@mui/icons-material'
import { dailySummaryService } from '@/services/daily-summary.service'

interface DownloadBackupModalProps {
  open: boolean
  onClose: () => void
}

export function DownloadBackupModal({ open, onClose }: DownloadBackupModalProps) {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null)
  const [tempStart, setTempStart] = useState<Date | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  // Normalizar fecha (solo día, sin hora)
  const normalizeDate = (date: Date): Date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Comparar fechas (solo día)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime()
  }

  // Formatear fecha a YYYY-MM-DD sin depender de zona horaria
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

  const handleDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date)
    
    // Si no hay fecha de inicio temporal, establecerla
    if (!tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      return
    }
    
    // Si se hace clic en la misma fecha, seleccionar solo ese día
    if (isSameDay(normalizedDate, tempStart)) {
      const range = { start: normalizedDate, end: normalizedDate }
      setSelectedRange(range)
      setTempStart(null)
      return
    }
    
    // Si la nueva fecha es anterior a tempStart, reiniciar
    if (normalizedDate < tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      return
    }
    
    // Establecer el rango final
    const range = { start: tempStart, end: normalizedDate }
    setSelectedRange(range)
    setTempStart(null)
  }

  // Determinar si una fecha está en el rango seleccionado
  const isInRange = (date: Date): boolean => {
    const normalizedDate = normalizeDate(date)
    
    if (selectedRange) {
      const start = normalizeDate(selectedRange.start)
      const end = normalizeDate(selectedRange.end)
      return normalizedDate >= start && normalizedDate <= end
    }
    
    if (tempStart) {
      return isSameDay(normalizedDate, tempStart)
    }
    
    return false
  }

  // Determinar si una fecha es el inicio del rango
  const isRangeStart = (date: Date): boolean => {
    if (selectedRange) {
      return isSameDay(date, selectedRange.start)
    }
    if (tempStart) {
      return isSameDay(date, tempStart)
    }
    return false
  }

  // Determinar si una fecha es el fin del rango
  const isRangeEnd = (date: Date): boolean => {
    if (selectedRange) {
      return isSameDay(date, selectedRange.end)
    }
    return false
  }

  // Determinar si una fecha está entre el inicio y el fin (pero no es inicio ni fin)
  const isInRangeMiddle = (date: Date): boolean => {
    if (!selectedRange) return false
    const normalizedDate = normalizeDate(date)
    const start = normalizeDate(selectedRange.start)
    const end = normalizeDate(selectedRange.end)
    return normalizedDate > start && normalizedDate < end
  }

  const handleDownload = async () => {
    if (!selectedRange) {
      setError('Por favor selecciona un rango de fechas')
      return
    }

    setDownloading(true)
    setError(null)

    try {
      const startStr = formatDateToString(selectedRange.start)
      const endStr = formatDateToString(selectedRange.end)

      // Descargar el PDF
      const pdfBlob = await dailySummaryService.downloadManagersReportPDF(startStr, endStr)

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `copia-seguridad-${startStr}-${endStr}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Cerrar modal después de descargar
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar la copia de seguridad')
    } finally {
      setDownloading(false)
    }
  }

  const handleClose = () => {
    if (!downloading) {
      onClose()
    }
  }

  // Resetear todo cuando el modal se cierra
  useEffect(() => {
    if (!open) {
      setSelectedRange(null)
      setTempStart(null)
      setError(null)
      setCurrentMonth(new Date())
      setDownloading(false)
    }
  }, [open])

  const days = getDaysInMonth(currentMonth)
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  
  // Agrupar días en semanas para el renderizado
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Descargar Copia de Seguridad
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={downloading}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona un rango de fechas para descargar el reporte de managers en formato PDF
        </Typography>

        {/* Mostrar fechas seleccionadas */}
        {selectedRange && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
              Fechas seleccionadas:
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {selectedRange.start.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              -{' '}
              {selectedRange.end.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          </Box>
        )}

        {/* Calendario */}
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconButton 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
              size="small"
            >
              <ChevronLeft />
            </IconButton>
            
            <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: 'capitalize', fontSize: '1rem' }}>
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <IconButton 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Nombres de días */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {dayNames.map((day) => (
              <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Días del calendario */}
          {weeks.map((week, weekIndex) => (
            <Box
              key={weekIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {week.map((date, dayIndex) => {
                const isToday = 
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear()
                const isOtherMonth = date.getMonth() !== currentMonth.getMonth()
                const inRange = isInRange(date)
                const isStart = isRangeStart(date)
                const isEnd = isRangeEnd(date)
                const inMiddle = isInRangeMiddle(date)

                return (
                  <Box
                    key={dayIndex}
                    onClick={() => !isOtherMonth && handleDateClick(date)}
                    sx={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isOtherMonth ? 'default' : 'pointer',
                      position: 'relative',
                      borderRadius: 1,
                      bgcolor: isOtherMonth
                        ? 'transparent'
                        : inRange
                        ? isStart || isEnd
                          ? 'primary.main'
                          : alpha(theme.palette.primary.main, 0.2)
                        : 'transparent',
                      color: isOtherMonth
                        ? 'text.disabled'
                        : inRange
                        ? isStart || isEnd
                          ? 'primary.contrastText'
                          : 'primary.main'
                        : isToday
                        ? 'primary.main'
                        : 'text.primary',
                      fontWeight: isStart || isEnd ? 700 : isToday ? 600 : 400,
                      border: isToday && !inRange ? `2px solid ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        bgcolor: isOtherMonth
                          ? 'transparent'
                          : inRange
                          ? 'primary.dark'
                          : alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {date.getDate()}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          ))}
        </Paper>

      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
        <Button onClick={handleClose} disabled={downloading}>
          Cancelar
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
          disabled={!selectedRange || downloading}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
            },
          }}
        >
          {downloading ? 'Descargando...' : 'Descargar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

