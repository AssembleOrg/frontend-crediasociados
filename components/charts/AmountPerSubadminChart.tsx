'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AmountPerSubadminData {
  name: string
  amount: number
  subadminId: string
}

interface AmountPerSubadminChartProps {
  data: AmountPerSubadminData[]
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
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          ${data.value.toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Monto total gestionado
        </Typography>
      </Paper>
    )
  }
  return null
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

const formatXAxis = (value: string) => {
  // Truncate long names for better display
  return value.length > 12 ? `${value.substring(0, 12)}...` : value
}

export default function AmountPerSubadminChart({ data, isLoading = false }: AmountPerSubadminChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 420 }
  const containerHeight = { xs: 280, sm: 320, md: 320 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Monto Gestionado por Sub-Admin
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando montos...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Monto Gestionado por Sub-Admin
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

  // Sort data by amount (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Monto Gestionado por Sub-Admin
      </Typography>

      <ResponsiveContainer width="100%" height="75%">
        <BarChart
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={60}
            tickFormatter={formatXAxis}
            fontSize={11}
          />
          <YAxis
            tickFormatter={formatYAxis}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            fill="#1976d2"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total gestionado: ${totalAmount.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  )
}