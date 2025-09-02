'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  Clear,
} from '@mui/icons-material'
import { DateTime } from 'luxon'

interface CustomCalendarProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  minDate?: Date
  maxDate?: Date
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function CustomCalendar({
  value,
  onChange,
  label = 'Fecha',
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  error = false,
  helperText,
  minDate,
  maxDate,
}: CustomCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(DateTime.now().setZone('America/Argentina/Buenos_Aires'))
  const [inputValue, setInputValue] = useState('')

  // Convertir Date a DateTime con timezone Buenos Aires
  const dateToBuenosAires = (date: Date | null): DateTime | null => {
    if (!date) return null
    return DateTime.fromJSDate(date).setZone('America/Argentina/Buenos_Aires')
  }

  // Convertir DateTime a Date
  const dateTimeToDate = (dateTime: DateTime | null): Date | null => {
    if (!dateTime) return null
    return dateTime.toJSDate()
  }

  // Formatear fecha para mostrar en input (DD/MM/YYYY)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return ''
    const dt = dateToBuenosAires(date)
    return dt ? dt.toFormat('dd/MM/yyyy') : ''
  }

  // Parsear fecha desde input (DD/MM/YYYY)
  const parseDateFromInput = (input: string): Date | null => {
    if (!input.trim()) return null
    
    // Validar formato DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = input.match(dateRegex)
    
    if (!match) return null
    
    const [, day, month, year] = match
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    // Validar rangos
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return null
    }
    
    try {
      const dt = DateTime.fromObject({
        day: dayNum,
        month: monthNum,
        year: yearNum,
      }, { zone: 'America/Argentina/Buenos_Aires' })
      
      // Verificar que la fecha es válida
      if (!dt.isValid) return null
      
      return dt.toJSDate()
    } catch {
      return null
    }
  }

  // Sincronizar input con value
  useEffect(() => {
    setInputValue(formatDateForInput(value))
  }, [value])

  // Sincronizar currentMonth con value
  useEffect(() => {
    if (value) {
      const dt = dateToBuenosAires(value)
      if (dt) {
        setCurrentMonth(dt.startOf('month'))
      }
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    
    // Solo actualizar si el formato es válido
    const parsedDate = parseDateFromInput(newValue)
    if (parsedDate || newValue === '') {
      onChange(parsedDate)
    }
  }

  const handleCalendarClick = () => {
    console.log('Calendar icon clicked, isOpen:', isOpen, 'disabled:', disabled)
    if (!disabled) {
      setIsOpen(true)
      console.log('Setting isOpen to true')
    }
  }

  const handleInputBlur = () => {
    // Al perder el foco, validar y corregir el input
    const parsedDate = parseDateFromInput(inputValue)
    if (parsedDate) {
      setInputValue(formatDateForInput(parsedDate))
      onChange(parsedDate)
    } else if (inputValue.trim() !== '') {
      // Si hay texto pero no es válido, restaurar el valor anterior
      setInputValue(formatDateForInput(value))
    }
  }

  const handleDateClick = (date: DateTime) => {
    const jsDate = dateTimeToDate(date)
    onChange(jsDate)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setInputValue('')
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

  const goToToday = () => {
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires')
    setCurrentMonth(today.startOf('month'))
  }

  const isDateDisabled = (date: DateTime): boolean => {
    if (minDate) {
      const minDateTime = dateToBuenosAires(minDate)
      if (minDateTime && date < minDateTime.startOf('day')) return true
    }
    
    if (maxDate) {
      const maxDateTime = dateToBuenosAires(maxDate)
      if (maxDateTime && date > maxDateTime.startOf('day')) return true
    }
    
    return false
  }

  const isDateSelected = (date: DateTime): boolean => {
    if (!value) return false
    const selectedDate = dateToBuenosAires(value)
    if (!selectedDate) return false
    return date.hasSame(selectedDate, 'day')
  }

  const isToday = (date: DateTime): boolean => {
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires')
    return date.hasSame(today, 'day')
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

  console.log('CustomCalendar render - isOpen:', isOpen, 'disabled:', disabled, 'value:', value)

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                size="small"
                onClick={handleCalendarClick}
                disabled={disabled}
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
                disabled={disabled}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
      />

      {isOpen && !disabled && (
        <>
          {/* Overlay para cerrar el calendario */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Calendario */}
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1400,
              mt: 1,
              p: 2,
              borderRadius: 2,
              minWidth: 300,
            }}
          >
            {/* Header del calendario */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <IconButton
                size="small"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft />
              </IconButton>
              
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {MONTHS[currentMonth.month - 1]} {currentMonth.year}
              </Typography>
              
              <IconButton
                size="small"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight />
              </IconButton>
            </Box>

            {/* Botón "Hoy" */}
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={goToToday}
                sx={{ borderRadius: 2 }}
              >
                Hoy
              </Button>
            </Box>

            {/* Días de la semana */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
              {WEEKDAYS.map((day) => (
                <Typography
                  key={day}
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'text.secondary',
                    py: 1,
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Días del mes */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {days.map((day, index) => {
                const isCurrentMonth = day.month === currentMonth.month
                const isSelected = isDateSelected(day)
                const isTodayDate = isToday(day)
                const isDisabled = isDateDisabled(day)

                return (
                  <Button
                    key={index}
                    size="small"
                    onClick={() => !isDisabled && handleDateClick(day)}
                    disabled={isDisabled}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                      backgroundColor: isSelected
                        ? 'primary.main'
                        : isTodayDate
                        ? 'action.hover'
                        : 'transparent',
                      color: isSelected
                        ? 'primary.contrastText'
                        : isTodayDate
                        ? 'primary.main'
                        : isCurrentMonth
                        ? 'text.primary'
                        : 'text.disabled',
                      fontWeight: isSelected || isTodayDate ? 600 : 400,
                      '&:hover': {
                        backgroundColor: isSelected
                          ? 'primary.dark'
                          : isDisabled
                          ? 'transparent'
                          : 'action.hover',
                      },
                      '&:disabled': {
                        color: 'text.disabled',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {day.day}
                  </Button>
                )
              })}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  )
}
