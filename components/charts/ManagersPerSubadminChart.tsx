'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface ManagersPerSubadminData {
  name: string
  value: number
  subadminId: string
}

interface ManagersPerSubadminChartProps {
  data: ManagersPerSubadminData[]
  isLoading?: boolean
}

const COLORS = [
  '#2e7d32', '#1976d2', '#d32f2f', '#ff9800', '#9c27b0',
  '#00796b', '#5d4037', '#455a64', '#e91e63', '#3f51b5'
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ManagersPerSubadminData }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {data.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Managers: {data.value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.value === 1 ? 'manager' : 'managers'} bajo gestión
        </Typography>
      </Paper>
    )
  }
  return null
}

interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  value: number
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: LabelProps) => {
  if (percent < 0.05) return null // Don't show labels for slices smaller than 5%

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {value}
    </text>
  )
}

export default function ManagersPerSubadminChart({ data, isLoading = false }: ManagersPerSubadminChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 420 }
  const containerHeight = { xs: 280, sm: 320, md: 320 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Managers por Sub-Administrador
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando distribución...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Managers por Sub-Administrador
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

  const totalManagers = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Managers por Sub-Administrador
      </Typography>

      <ResponsiveContainer width="100%" height="75%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value, entry: { payload: ManagersPerSubadminData }) =>
              `${value} (${entry.payload.value} ${entry.payload.value === 1 ? 'manager' : 'managers'})`
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total: {totalManagers} {totalManagers === 1 ? 'manager' : 'managers'} en {data.length} {data.length === 1 ? 'sub-admin' : 'sub-admins'}
        </Typography>
      </Box>
    </Paper>
  )
}