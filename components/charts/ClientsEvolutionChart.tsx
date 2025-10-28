'use client'

import React, { useMemo, memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
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
  const chartHeight = { xs: 500, sm: 520, md: 600, lg: 680 }
  const containerHeight = { xs: 340, sm: 320, md: 400, lg: 480 }

  // Group daily data into weekly data
  const weeklyData = useMemo(() => groupDataByWeeks(data), [data])

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Clientes Nuevos por Semana
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos semanales...
        </Box>
      </Paper>
    )
  }

  if (!weeklyData.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Clientes Nuevos por Semana
        </Typography>
        <Box sx={{
          height: containerHeight,
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
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Clientes Nuevos por Semana
      </Typography>

      <ResponsiveContainer width="100%" height="60%">
        <BarChart
          data={weeklyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 20,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            fontSize={11}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            fontSize={11}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="clients"
            fill="#2e7d32"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary - Responsive Grid */}
      <Box sx={{
        mt: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr 1fr', sm: '1fr 1fr 1fr' },
        gap: { xs: 1, sm: 2 },
        textAlign: 'center',
        px: { xs: 1, sm: 0 }
      }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Total Período
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {totalClients}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Mejor Semana
          </Typography>
          <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {maxWeek}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Promedio/Semana
          </Typography>
          <Typography variant="h6" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {avgPerWeek}
          </Typography>
        </Box>
      </Box>

      {weeklyData.length === 1 && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 2 }}>
          Todos los clientes fueron creados en la misma semana
        </Typography>
      )}
    </Paper>
  )
})

export default ClientsEvolutionChart