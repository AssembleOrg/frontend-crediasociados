'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ManagerCountPerSubadminData {
  name: string
  managerCount: number
  subadminId: string
}

interface ManagerCountPerSubadminChartProps {
  data: ManagerCountPerSubadminData[]
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
          {data.value} {data.value === 1 ? 'prestamista' : 'prestamistas'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Prestamistas bajo gestión
        </Typography>
      </Paper>
    )
  }
  return null
}

const formatYAxis = (value: number) => {
  // Simple number formatting for manager counts
  return value.toString()
}

const formatXAxis = (value: string) => {
  // Truncate long names for better display
  return value.length > 12 ? `${value.substring(0, 12)}...` : value
}

export default function ManagerCountPerSubadminChart({ data, isLoading = false }: ManagerCountPerSubadminChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Prestamistas por Asociado
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos de prestamistas...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Prestamistas por Asociado
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

  // Sort data by manager count (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.managerCount - a.managerCount)
  const totalManagers = data.reduce((sum, item) => sum + item.managerCount, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Prestamistas por Asociado
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
            dataKey="managerCount"
            fill="#1976d2"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total prestamistas: {totalManagers}
        </Typography>
      </Box>
    </Paper>
  )
}