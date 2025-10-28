'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { StatusChartData, ChartTooltipProps, BaseChartProps } from '@/types/charts'

type StatusDistributionChartProps = BaseChartProps<StatusChartData>

const STATUS_COLORS = {
  ACTIVE: '#2e7d32',      // Green
  COMPLETED: '#1976d2',   // Blue
  OVERDUE: '#d32f2f',     // Red
  CANCELLED: '#757575',   // Grey
  DRAFT: '#ff9800'        // Orange
}

const STATUS_LABELS = {
  ACTIVE: 'Activos',
  COMPLETED: 'Completados',
  OVERDUE: 'Vencidos',
  CANCELLED: 'Cancelados',
  DRAFT: 'Borradores'
}

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as StatusChartData
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {STATUS_LABELS[data.name as keyof typeof STATUS_LABELS] || data.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cantidad: {data.value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monto: ${data.amount.toLocaleString()}
        </Typography>
      </Paper>
    )
  }
  return null
}


export default function StatusDistributionChart({ data, isLoading = false }: StatusDistributionChartProps) {
  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: 300 }}>
        <Typography variant="h6" gutterBottom>
          Distribución por Estado
        </Typography>
        <Box sx={{
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando gráfico...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: 300 }}>
        <Typography variant="h6" gutterBottom>
          Distribución por Estado
        </Typography>
        <Box sx={{
          height: 240,
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
    <Paper elevation={1} sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Distribución por Estado
      </Typography>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => STATUS_LABELS[value as keyof typeof STATUS_LABELS] || value}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}