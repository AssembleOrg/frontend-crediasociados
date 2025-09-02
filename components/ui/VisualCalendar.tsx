'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Typography,
  Button,
} from '@mui/material'
import {
  CalendarToday,
  Clear,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { DateTime } from 'luxon'

interface VisualCalendarProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  helperText?: string
  error?: boolean
  minDate?: Date
  maxDate?: Date
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function VisualCalendar({
  label,
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  helperText,
  error = false,
  minDate,
  maxDate,
}: VisualCalendarProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [currentMonth, setCurrentMonth] = useState(DateTime.now().setZone('America/Argentina/Buenos_Aires'))

  // Formatear fecha para mostrar
  const formatDate = (date: Date | null): string => {
    if (!date) return ''
    const dt = DateTime.fromJSDate(date).setZone('America/Argentina/Buenos_Aires')
    return dt.toFormat('dd/MM/yyyy')
  }

  // Parsear fecha desde input
  const parseDate = (input: string): Date | null => {
    if (!input.trim()) return null
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = input.match(dateRegex)
    
    if (!match) return null
    
    const [, day, month, year] = match
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return null
    }
    
    try {
      const dt = DateTime.fromObject({
        day: dayNum,
        month: monthNum,
        year: yearNum,
      }, { zone: 'America/Argentina/Buenos_Aires' })
      
      if (!dt.isValid) return null
      return dt.toJSDate()
    } catch {
      return null
    }
  }

  // Sincronizar input con value
  useEffect(() => {
    setInputValue(formatDate(value))
  }, [value])

  // Sincronizar currentMonth con value
  useEffect(() => {
    if (value) {
      const dt = DateTime.fromJSDate(value).setZone('America/Argentina/Buenos_Aires')
      setCurrentMonth(dt.startOf('month'))
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    
    const parsedDate = parseDate(newValue)
    if (parsedDate || newValue === '') {
      onChange(parsedDate)
    }
  }

  const handleCalendarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClear = () => {
    setInputValue('')
    onChange(null)
  }

  const handleDateClick = (date: DateTime) => {
    const jsDate = date.toJSDate()
    
    // Verificar restricciones de fecha
    if (minDate && jsDate < minDate) return
    if (maxDate && jsDate > maxDate) return
    
    setInputValue(formatDate(jsDate))
    onChange(jsDate)
    handleClose()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      if (direction === 'prev') {
        return prev.minus({ months: 1 })
      } else {
        return prev.plus({ months: 1 })
      }
    })
  }

  const handleTodayClick = () => {
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').toJSDate()
    setInputValue(formatDate(today))
    onChange(today)
    handleClose()
  }

  // Generar días del mes
  const generateDays = () => {
    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const startOfWeek = startOfMonth.startOf('week')
    const endOfWeek = endOfMonth.endOf('week')
    
    const days = []
    let current = startOfWeek
    
    while (current <= endOfWeek) {
      days.push(current)
      current = current.plus({ days: 1 })
    }
    
    return days
  }

  const days = generateDays()
  const selectedDate = value ? DateTime.fromJSDate(value).setZone('America/Argentina/Buenos_Aires') : null
  const today = DateTime.now().setZone('America/Argentina/Buenos_Aires')

  const open = Boolean(anchorEl)

  return (
    <Box>
      <TextField
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                size="small"
                onClick={handleCalendarClick}
                sx={{ p: 0.5 }}
              >
                <CalendarToday color="action" />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: inputValue ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#64748b',
            fontWeight: 500,
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#667eea',
          }
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ p: 2, minWidth: 320 }}>
          {/* Header del calendario */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 2,
            px: 1
          }}>
            <IconButton
              size="small"
              onClick={() => navigateMonth('prev')}
              sx={{ 
                p: 1,
                color: '#374151',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                }
              }}
            >
              <ChevronLeft />
            </IconButton>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              fontSize: '1rem',
              color: '#111827'
            }}>
              {MONTHS[currentMonth.month - 1]} {currentMonth.year}
            </Typography>
            
            <IconButton
              size="small"
              onClick={() => navigateMonth('next')}
              sx={{ 
                p: 1,
                color: '#374151',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                }
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Días de la semana */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0,
            mb: 1
          }}>
            {WEEKDAYS.map((day) => (
              <Box
                key={day}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase'
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* Días del mes - CSS Grid para celdas cuadradas perfectas */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0,
            width: '100%'
          }}>
            {days.map((day, index) => {
              const isCurrentMonth = day.month === currentMonth.month
              const isToday = day.hasSame(today, 'day')
              const isSelected = selectedDate && day.hasSame(selectedDate, 'day')
              const isDisabled = (minDate && day.toJSDate() < minDate) || 
                                (maxDate && day.toJSDate() > maxDate)

              return (
                <Box
                  key={index}
                  onClick={() => !isDisabled && handleDateClick(day)}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: isToday || isSelected ? 600 : 400,
                    color: isCurrentMonth ? 
                      (isSelected ? 'white' : 
                       isToday ? '#2563eb' : '#111827') : '#9ca3af',
                    backgroundColor: isSelected ? 
                      '#2563eb' :
                      isToday ? 
                        '#dbeafe' : 'transparent',
                    cursor: isDisabled ? 'default' : 'pointer',
                    borderRadius: 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: isDisabled ? 'transparent' :
                        isSelected ? '#1d4ed8' :
                        isToday ? '#bfdbfe' :
                        '#f3f4f6',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    }
                  }}
                >
                  {day.day}
                </Box>
              )
            })}
          </Box>

          {/* Botones de acción */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mt: 2, 
            pt: 2, 
            borderTop: '1px solid #e5e7eb'
          }}>
            <Button
              variant="outlined"
              onClick={handleTodayClick}
              size="small"
              sx={{ 
                flex: 1,
                py: 0.5,
                fontSize: '0.75rem',
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                }
              }}
            >
              Hoy
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              size="small"
              sx={{ 
                flex: 1,
                py: 0.5,
                fontSize: '0.75rem',
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                }
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  )
}