'use client'

import React, { useMemo, memo } from 'react'
import { Paper, Typography, Box, useTheme, useMediaQuery } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ClientsEvolutionData {
  date: string
  clients: number
}

interface ClientsEvolutionChartProps {
  data: ClientsEvolutionData[]
  isLoading?: boolean
}

interface WeeklyData {
  week: string
  clients: number
  period: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number, payload?: WeeklyData }>
  label?: string
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const weekData = payload[0].payload
    const clientCount = payload[0].value

    return (
      <Paper elevation={3} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} fontSize="0.875rem">
          {weekData?.week}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          {clientCount} {clientCount === 1 ? 'cliente nuevo' : 'clientes nuevos'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {weekData?.period}
        </Typography>
      </Paper>
    )
  }
  return null
}

// Function to group daily data into weekly data
const groupDataByWeeks = (dailyData: ClientsEvolutionData[]): WeeklyData[] => {
  if (!dailyData.length) return []

  const weeklyMap = new Map<string, { clients: number, dates: Date[] }>()

  dailyData.forEach(item => {
    if (!item.date) return

    const date = new Date(item.date)
    if (isNaN(date.getTime())) return

    const monday = new Date(date)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)

    const weekKey = monday.toISOString().split('T')[0]

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { clients: 0, dates: [] })
    }

    const week = weeklyMap.get(weekKey)!
    week.clients += item.clients
    week.dates.push(date)
  })

  return Array.from(weeklyMap.entries())
    .map(([weekStart, data]) => {
      const startDate = new Date(weekStart)
      const endDate = new Date(Math.max(...data.dates.map(d => d.getTime())))

      return {
        week: `Sem. ${startDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}`,
        clients: data.clients,
        period: `${startDate.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit'
        })} - ${endDate.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit'
        })}`
      }
    })
    .sort((a, b) => a.week.localeCompare(b.week))
}

const ClientsEvolutionChart = memo(function ClientsEvolutionChart({ data, isLoading = false }: ClientsEvolutionChartProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  // Group daily data into weekly data
  const weeklyData = useMemo(() => groupDataByWeeks(data), [data])

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          minHeight: 200,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Clientes Nuevos por Semana
        </Typography>
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos...
        </Box>
      </Paper>
    )
  }

  if (!weeklyData.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          minHeight: 200,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Clientes Nuevos por Semana
        </Typography>
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          No hay datos en el período seleccionado
        </Box>
      </Paper>
    )
  }

  const totalClients = weeklyData.reduce((sum, item) => sum + item.clients, 0)
  const maxWeek = Math.max(...weeklyData.map(item => item.clients))
  const avgPerWeek = weeklyData.length > 0 ? Math.round(totalClients / weeklyData.length) : 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Clientes Nuevos por Semana
      </Typography>

      <ResponsiveContainer width="100%" height={isMobile ? 180 : 280}>
        <BarChart
          data={weeklyData}
          margin={{
            top: isMobile ? 8 : 20,
            right: isMobile ? 8 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 16 : 60,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="week"
            fontSize={isMobile ? 10 : 11}
            interval={0}
            angle={isMobile ? 0 : -45}
            textAnchor={isMobile ? 'middle' : 'end'}
            height={isMobile ? 30 : 60}
            tick={{ fill: '#666' }}
          />
          <YAxis
            fontSize={11}
            allowDecimals={false}
            tick={{ fill: '#666' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="clients"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {weeklyData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#10b981" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <Box sx={{
        mt: 1.5,
        pt: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
      }}>
        {[
          { label: 'Total Período', value: totalClients, color: 'primary.main' },
          { label: 'Mejor Semana', value: maxWeek, color: 'success.main' },
          { label: 'Promedio', value: avgPerWeek, color: 'info.main' },
        ].map((stat) => (
          <Box key={stat.label} sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="h6" fontWeight={700} color={stat.color} sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.2 }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
})

export default ClientsEvolutionChart
