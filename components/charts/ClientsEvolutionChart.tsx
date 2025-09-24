'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ClientsEvolutionData {
  date: string
  clients: number
}

interface ClientsEvolutionChartProps {
  data: ClientsEvolutionData[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const formattedDate = new Date(label).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 180 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {formattedDate}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          {data.value} {data.value === 1 ? 'cliente' : 'clientes'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Creados en esta fecha
        </Typography>
      </Paper>
    )
  }
  return null
}

const formatXAxis = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit'
  })
}

const formatYAxis = (value: number) => {
  return value.toString()
}

export default function ClientsEvolutionChart({ data, isLoading = false }: ClientsEvolutionChartProps) {
  const chartHeight = { xs: 480, sm: 520, md: 520 }
  const containerHeight = { xs: 280, sm: 320, md: 320 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Evolución de Clientes por Fecha
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando evolución...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Evolución de Clientes por Fecha
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

  const totalClients = data.reduce((sum, item) => sum + item.clients, 0)
  const maxDay = Math.max(...data.map(item => item.clients))

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Evolución de Clientes por Fecha
      </Typography>

      <ResponsiveContainer width="100%" height="60%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            fontSize={11}
          />
          <YAxis
            tickFormatter={formatYAxis}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="clients"
            stroke="#2e7d32"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2e7d32' }}
            activeDot={{ r: 6, fill: '#1b5e20' }}
          />
        </LineChart>
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
            Día Pico
          </Typography>
          <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {maxDay}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Promedio/Día
          </Typography>
          <Typography variant="h6" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {data.length > 0 ? Math.round(totalClients / data.length) : 0}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}