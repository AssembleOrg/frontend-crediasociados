'use client'

import React, { useMemo, memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
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
  // Group daily data into weekly data
  const weeklyData = useMemo(() => groupDataByWeeks(data), [data])

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: { xs: 400, sm: 450 },
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
          p: 3,
          height: { xs: 400, sm: 450 },
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
        p: 3,
        height: { xs: 400, sm: 450 },
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

      <Box sx={{ flexGrow: 1, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="week"
              fontSize={11}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
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
      </Box>

      {/* Summary - Compact */}
      <Box sx={{
        mt: 2,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Total Período
          </Typography>
          <Typography variant="h6" color="primary.main" fontSize="1.125rem">
            {totalClients}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Mejor Semana
          </Typography>
          <Typography variant="h6" color="success.main" fontSize="1.125rem">
            {maxWeek}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Promedio
          </Typography>
          <Typography variant="h6" color="info.main" fontSize="1.125rem">
            {avgPerWeek}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

export default ClientsEvolutionChart
