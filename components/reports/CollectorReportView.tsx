'use client'

import { useState } from 'react'
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
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  TrendingUp,
  TrendingDown,
  Receipt,
  AttachMoney,
} from '@mui/icons-material'
import { collectorReportService, type CollectorPeriodReport } from '@/services/collector-report.service'

interface CollectorReportViewProps {
  managerId?: string // Optional: if provided, fetch report for this manager (subadmin view)
  title?: string
  subtitle?: string
}

export default function CollectorReportView({ 
  managerId, 
  title = 'Reporte de Cobrador',
  subtitle = 'Selecciona una semana para ver el reporte de cobros'
}: CollectorReportViewProps) {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null)
  const [report, setReport] = useState<CollectorPeriodReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    
    return { start: monday, end: sunday }
  }

  const getWeeksInMonth = (date: Date): Date[][] => {
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
    
    const weeks: Date[][] = []
    const current = new Date(firstMonday)
    
    while (current <= lastSunday) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }
    
    return weeks
  }

  const loadReport = async (start: Date, end: Date) => {
    try {
      setLoading(true)
      setError(null)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      const data = await collectorReportService.getPeriodReport(startStr, endStr, managerId)
      setReport(data)
    } catch (err: any) {
      console.error('Error loading report:', err)
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleWeekClick = (weekStart: Date) => {
    const week = getWeekRange(weekStart)
    setSelectedWeek(week)
    loadReport(week.start, week.end)
  }

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
    })
  }

  const isSelectedWeek = (weekStart: Date) => {
    if (!selectedWeek) return false
    const week = getWeekRange(weekStart)
    return week.start.getTime() === selectedWeek.start.getTime()
  }

  const weeks = getWeeksInMonth(currentMonth)
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {subtitle}
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, 
        gap: 3,
        alignItems: 'start'
      }}>
        {/* Calendario */}
        <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} size="small">
              <ChevronLeft />
            </IconButton>
            
            <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} size="small">
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

          {/* Semanas */}
          {weeks.map((week, weekIndex) => {
            const weekStart = week[0]
            const isSelected = isSelectedWeek(weekStart)

            return (
              <Box
                key={weekIndex}
                onClick={() => handleWeekClick(weekStart)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 0.5,
                  p: 1,
                  transition: 'all 0.2s',
                  backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.15)
                    : 'transparent',
                  border: isSelected
                    ? `2px solid ${theme.palette.primary.main}`
                    : '2px solid transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {week.map((date, dayIndex) => {
                    const isToday = 
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth() &&
                      date.getFullYear() === new Date().getFullYear()
                    const isOtherMonth = date.getMonth() !== currentMonth.getMonth()

                    return (
                      <Box key={dayIndex} sx={{ textAlign: 'center', py: 1, borderRadius: 1, position: 'relative' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isOtherMonth ? 'text.disabled' : isToday ? 'primary.main' : 'text.primary',
                            fontWeight: isToday ? 700 : 400,
                          }}
                        >
                          {date.getDate()}
                        </Typography>
                        {isToday && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )
          })}
        </Paper>

        {/* Reporte */}
        <Box>
          {!selectedWeek && !loading && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona una semana en el calendario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Haz clic en cualquier día para ver el reporte de esa semana
              </Typography>
            </Paper>
          )}

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Cargando reporte...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {report && selectedWeek && !loading && (
            <Box>
              {/* Header - Información del Cobrador */}
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)', 
                color: 'white',
                borderRadius: 2
              }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {report.collector?.fullName || 'Cobrador'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Usuario</Typography>
                    <Typography variant="body2" fontWeight={500}>{report.collector?.userId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Rol</Typography>
                    <Typography variant="body2" fontWeight={500}>{report.collector?.role}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>% Comisión</Typography>
                    <Typography variant="body2" fontWeight={500}>{report.collector?.commissionPercentage}%</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Fecha Inicio</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(report.period.startDate).toLocaleDateString('es-AR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Fecha Fin</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(report.period.endDate).toLocaleDateString('es-AR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Summary Cards */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
                gap: 2, 
                mb: 3 
              }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrendingUp sx={{ color: 'success.main' }} />
                      <Typography variant="caption" color="text.secondary">
                        Total Cobrado
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {formatCurrency(report.collections?.amounts?.totalCollected || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      de {formatCurrency(report.collections?.amounts?.totalDue || 0)} esperado
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrendingDown sx={{ color: 'warning.main' }} />
                      <Typography variant="caption" color="text.secondary">
                        Total Retirado
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="warning.main">
                      {formatCurrency(report.collectorWallet?.totalWithdrawals || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      de la wallet
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Receipt sx={{ color: 'error.main' }} />
                      <Typography variant="caption" color="text.secondary">
                        Gastos
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      {formatCurrency(report.expenses?.total || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      del período
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AttachMoney />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Neto Wallet
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {formatCurrency(report.collectorWallet?.netAmount || 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
                      después de retiros
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Collection Stats - Cantidades */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Estadísticas de Cobros - Cantidades
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <Typography variant="h3" color="info.main" fontWeight={600}>
                      {report.collections?.totalDue || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Total a Cobrar
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="h3" color="success.main" fontWeight={600}>
                      {report.collections?.collected?.full || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Cobros Completos
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <Typography variant="h3" color="warning.main" fontWeight={600}>
                      {report.collections?.collected?.partial || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Cobros Parciales
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.15) }}>
                    <Typography variant="h3" color="success.dark" fontWeight={600}>
                      {report.collections?.collected?.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Total Cobrado
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                    <Typography variant="h3" color="error.main" fontWeight={600}>
                      {report.collections?.failed || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No Cobrados
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Collection Stats - Porcentajes */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Estadísticas de Cobros - Porcentajes
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="h3" color="success.main" fontWeight={600}>
                      {report.collections?.percentages?.full?.toFixed(2) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      % Completos
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <Typography variant="h3" color="warning.main" fontWeight={600}>
                      {report.collections?.percentages?.partial?.toFixed(2) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      % Parciales
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                    <Typography variant="h3" color="error.main" fontWeight={600}>
                      {report.collections?.percentages?.failed?.toFixed(2) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      % No Cobrados
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Typography variant="h3" color="primary.main" fontWeight={600}>
                      {report.collections?.totalDue && report.collections?.collected?.total 
                        ? ((report.collections.collected.total / report.collections.totalDue) * 100).toFixed(2)
                        : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Eficiencia Total
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Collection Stats - Montos */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Montos de Cobros
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <Typography variant="h4" color="info.main" fontWeight={600}>
                      {formatCurrency(report.collections?.amounts?.totalDue || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Monto Total a Cobrar
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="h4" color="success.main" fontWeight={600}>
                      {formatCurrency(report.collections?.amounts?.totalCollected || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Monto Total Cobrado
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                    <Typography variant="h4" color="error.main" fontWeight={600}>
                      {formatCurrency((report.collections?.amounts?.totalDue || 0) - (report.collections?.amounts?.totalCollected || 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Pendiente de Cobrar
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Comisión */}
              <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Comisión del Cobrador
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="h4" fontWeight={600}>
                      {report.commission?.percentage || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Porcentaje de Comisión
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="h4" fontWeight={600}>
                      {formatCurrency(report.commission?.baseAmount || 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Monto Base
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.3)' }}>
                    <Typography variant="h4" fontWeight={600}>
                      {formatCurrency(report.commission?.commissionAmount || 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Comisión Total
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Gastos Detallados */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Gastos del Período
                </Typography>
                
                {/* Total de gastos */}
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1), textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight={600}>
                    {formatCurrency(report.expenses?.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total de Gastos
                  </Typography>
                </Box>

                {/* Gastos por categoría */}
                {report.expenses?.byCategory && Object.keys(report.expenses.byCategory).length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                      Desglose por Categoría
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
                      gap: 2,
                      mb: 3 
                    }}>
                      {report.expenses.byCategory.COMBUSTIBLE !== undefined && (
                        <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.1), textAlign: 'center' }}>
                          <Typography variant="h6" color="warning.main" fontWeight={600}>
                            {formatCurrency(report.expenses.byCategory.COMBUSTIBLE)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Combustible
                          </Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.CONSUMO !== undefined && (
                        <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.1), textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main" fontWeight={600}>
                            {formatCurrency(report.expenses.byCategory.CONSUMO)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Consumo
                          </Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.REPARACIONES !== undefined && (
                        <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.1), textAlign: 'center' }}>
                          <Typography variant="h6" color="error.main" fontWeight={600}>
                            {formatCurrency(report.expenses.byCategory.REPARACIONES)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reparaciones
                          </Typography>
                        </Box>
                      )}
                      {report.expenses.byCategory.OTROS !== undefined && (
                        <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.grey[500], 0.1), textAlign: 'center' }}>
                          <Typography variant="h6" color="text.primary" fontWeight={600}>
                            {formatCurrency(report.expenses.byCategory.OTROS)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Otros
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}

                {/* Detalle de gastos */}
                {report.expenses?.detail && report.expenses.detail.length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                      Detalle de Gastos
                    </Typography>
                    <TableContainer>
                      <Table size="small">
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
                            <TableRow key={index} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.05) } }}>
                              <TableCell>
                                <Typography variant="caption">
                                  {formatDate(expense.date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={expense.category} size="small" color="default" />
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
                  </>
                )}

                {(!report.expenses?.detail || report.expenses.detail.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay gastos registrados en este período
                  </Typography>
                )}
              </Paper>

              {/* Resumen Financiero Completo (Summary) */}
              <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Resumen Financiero Completo
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                  gap: 2,
                  mb: 2
                }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Cobros</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(report.summary?.totalCollections || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Retiros</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(report.summary?.totalWithdrawals || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Gastos</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(report.summary?.totalExpenses || 0)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Neto Antes de Comisión</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(report.summary?.netBeforeCommission || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Comisión</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(report.summary?.commission || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.35)' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Neto Después de Comisión</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {formatCurrency(report.summary?.netAfterCommission || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Transactions */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Transacciones de la Wallet
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {report.collectorWallet?.transactions && report.collectorWallet.transactions.length > 0 ? (
                  <TableContainer>
                    <Table>
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
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(tx.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tx.type === 'COLLECTION' ? 'Cobro' : 'Retiro'}
                                size="small"
                                color={tx.type === 'COLLECTION' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {tx.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {formatCurrency(tx.balanceBefore)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(tx.balanceAfter)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body1"
                                fontWeight={600}
                                color={tx.type === 'COLLECTION' ? 'success.main' : 'warning.main'}
                              >
                                {tx.type === 'COLLECTION' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
    </Box>
  )
}


