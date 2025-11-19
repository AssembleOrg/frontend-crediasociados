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
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Calculate,
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
  const [summary, setSummary] = useState<{
    totalAmount: number
    totalCollections: number
    startDate: string
    endDate: string
  } | null>(null)
  const [commissionPercentage, setCommissionPercentage] = useState<string>('')
  const [calculatedCommission, setCalculatedCommission] = useState<number | null>(null)

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

  // Formatear fecha a DD/MM/YYYY
  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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
      
      const data = await collectorWalletService.getCollectionsSummary(
        manager.id,
        startDate,
        endDate
      )
      setSummary({
        totalAmount: data.totalAmount,
        totalCollections: data.totalCollections,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      // Reset commission calculation when new summary is loaded
      setCalculatedCommission(null)
    } catch (err: any) {
      console.error('Error loading collections summary:', err)
      setError(err.response?.data?.message || 'Error al cargar el resumen de cobros')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date)
    
    // Si no hay fecha de inicio temporal, establecerla
    if (!tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      setSummary(null)
      setCalculatedCommission(null)
      return
    }
    
    // Si se hace clic en la misma fecha, seleccionar solo ese día
    if (isSameDay(normalizedDate, tempStart)) {
      const range = { start: normalizedDate, end: normalizedDate }
      setSelectedRange(range)
      setTempStart(null)
      loadSummary(range.start, range.end)
      return
    }
    
    // Si la nueva fecha es anterior a tempStart, reiniciar
    if (normalizedDate < tempStart) {
      setTempStart(normalizedDate)
      setSelectedRange(null)
      setSummary(null)
      setCalculatedCommission(null)
      return
    }
    
    // Establecer el rango final
    const range = { start: tempStart, end: normalizedDate }
    setSelectedRange(range)
    setTempStart(null)
    loadSummary(range.start, range.end)
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

    const commission = (summary.totalAmount * percentage) / 100
    setCalculatedCommission(commission)
    setError(null)
  }

  const handleClose = () => {
    setSelectedRange(null)
    setTempStart(null)
    setSummary(null)
    setCommissionPercentage('')
    setCalculatedCommission(null)
    setError(null)
    onClose()
  }

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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          mt: { xs: 2, sm: 3 },
          maxHeight: { xs: '95vh', sm: '90vh' },
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: 2.5,
          px: 3,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Calcular Liquidación
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {manager && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Manager: <strong>{manager.fullName}</strong> ({manager.email})
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: { xs: 'stretch', md: 'start' }
        }}>
          {/* Calendario */}
          <Paper sx={{ 
            p: { xs: 2, sm: 3 },
            width: { xs: '100%', md: '380px' },
            flexShrink: 0,
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mb: { xs: 2, sm: 3 },
            }}>
              <IconButton 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
                size="small"
              >
                <ChevronLeft />
              </IconButton>
              
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  textTransform: 'capitalize',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
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
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
              {dayNames.map((day) => (
                <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
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
                        textAlign: 'center',
                        py: { xs: 1, sm: 1.5 },
                        px: { xs: 0.5, sm: 0 },
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
                          color: isOtherMonth
                            ? 'text.disabled'
                            : inRange
                              ? 'primary.main'
                              : isToday
                                ? 'primary.main'
                                : 'text.primary',
                          fontWeight: (isStart || isEnd || isToday) ? 700 : 400,
                        }}
                      >
                        {date.getDate()}
                      </Typography>
                      {isToday && !inRange && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                          }}
                        />
                      )}
                    </Box>
                  )
                })}
              </Box>
            ))}

            {selectedRange && (
              <Box sx={{ 
                mt: 2, 
                p: { xs: 1.5, sm: 2 }, 
                bgcolor: 'grey.100', 
                borderRadius: 1 
              }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  display="block"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Rango seleccionado:
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={600}
                  sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                >
                  {formatDateToDDMMYYYY(selectedRange.start)} - {formatDateToDDMMYYYY(selectedRange.end)}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Resultados y cálculo */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && summary && (
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  Resumen de Cobros
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Período
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {summary.startDate} - {summary.endDate}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Total Cobrado
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={600} 
                      color="success.main"
                      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
                    >
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      Cantidad de Cobros
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {summary.totalCollections}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {summary && (
              <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
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
                    size="medium"
                  />

                  <Button
                    variant="contained"
                    startIcon={<Calculate />}
                    onClick={handleCalculateCommission}
                    disabled={!commissionPercentage || loading}
                    fullWidth
                    size="large"
                    sx={{ py: { xs: 1.5, sm: 1.75 } }}
                  >
                    Calcular Comisión
                  </Button>

                  {calculatedCommission !== null && (
                    <Box sx={{ 
                      mt: 2, 
                      p: { xs: 2, sm: 2.5 }, 
                      bgcolor: '#8B0000', // Color bordo
                      borderRadius: 2,
                      boxShadow: 2,
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          mb: 0.5,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        }} 
                        display="block"
                      >
                        Comisión Calculada ({commissionPercentage}%)
                      </Typography>
                      <Typography 
                        variant="h4" 
                        fontWeight={600} 
                        sx={{ 
                          color: '#FFFFFF',
                          fontSize: { xs: '1.75rem', sm: '2.125rem' },
                        }}
                      >
                        {formatCurrency(calculatedCommission)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            {!loading && !summary && selectedRange && (
              <Alert severity="info">
                Selecciona un rango de fechas para ver el resumen de cobros
              </Alert>
            )}

            {!selectedRange && (
              <Alert severity="info">
                Selecciona un rango de fechas en el calendario para comenzar
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

