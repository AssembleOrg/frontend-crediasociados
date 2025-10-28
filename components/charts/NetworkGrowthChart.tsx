'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface NetworkGrowthData {
  month: string
  asociados: number
  prestamistas: number
  [key: string]: string | number // Index signature for recharts compatibility
}

interface NetworkGrowthChartProps {
  data: NetworkGrowthData[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; color: string; name: string }>
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
            sx={{ color: entry.color }}
            fontWeight={600}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
        <Typography variant="caption" color="text.secondary">
          Crecimiento de la red
        </Typography>
      </Paper>
    )
  }
  return null
}

export default function NetworkGrowthChart({ data, isLoading = false }: NetworkGrowthChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Crecimiento de la Red
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos de crecimiento...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Crecimiento de la Red
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          No hay datos disponibles
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Crecimiento de la Red
      </Typography>

      <ResponsiveContainer width="100%" height="75%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="asociados"
            stroke="#1976d2"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Asociados"
          />
          <Line
            type="monotone"
            dataKey="prestamistas"
            stroke="#2e7d32"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Prestamistas"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Evolución mensual de la red de asociados y prestamistas
        </Typography>
      </Box>
    </Paper>
  )
}