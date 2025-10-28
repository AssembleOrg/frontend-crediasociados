'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PortfolioEvolution } from '@/types/finanzas'

interface PortfolioEvolutionChartProps {
  data: PortfolioEvolution[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color, fontWeight: 600 }}
          >
            {entry.name}: ${entry.value.toLocaleString('es-AR')}
          </Typography>
        ))}
      </Paper>
    )
  }
  return null
}

const formatXAxis = (value: string) => {
  // Format date: "2025-10-02" -> "02/10"
  const [, month, day] = value.split('-')
  return `${day}/${month}`
}

const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value}`
}

const PortfolioEvolutionChart = memo(function PortfolioEvolutionChart({
  data,
  isLoading = false
}: PortfolioEvolutionChartProps) {
  const chartHeight = { xs: 400, sm: 450, md: 500 }
  const containerHeight = { xs: 300, sm: 350, md: 400 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Evolución del Valor de Cartera
        </Typography>
        <Box
          sx={{
            height: containerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          Cargando evolución...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Evolución del Valor de Cartera
        </Typography>
        <Box
          sx={{
            height: containerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          No hay datos disponibles
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Evolución del Valor de Cartera
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Últimos {data.length} días
      </Typography>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 10,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tickFormatter={formatYAxis} fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="valorCartera"
            stroke="#1976d2"
            strokeWidth={3}
            name="Valor Cartera"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="capitalDisponible"
            stroke="#388e3c"
            strokeWidth={2}
            name="Capital Disponible"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="prestadoActivo"
            stroke="#f57c00"
            strokeWidth={2}
            name="Prestado Activo"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  )
})

export default PortfolioEvolutionChart
