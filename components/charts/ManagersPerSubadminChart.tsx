'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ManagersChartData, ChartTooltipProps, BaseChartProps } from '@/types/charts'

type ManagersPerSubadminChartProps = BaseChartProps<ManagersChartData>

const COLORS = [
  '#2e7d32', '#1976d2', '#d32f2f', '#ff9800', '#9c27b0',
  '#00796b', '#5d4037', '#455a64', '#e91e63', '#3f51b5'
]

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ManagersChartData
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

// Custom label component for showing numbers in pie slices
interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  value: number
  percent: number
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }: CustomLabelProps) => {
  // Only show labels for slices larger than 5% to avoid clutter
  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
      style={{
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.8))'
      }}
    >
      {value}
    </text>
  )
}


export default function ManagersPerSubadminChart({ data, isLoading = false }: ManagersPerSubadminChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={CustomLabel as any}
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