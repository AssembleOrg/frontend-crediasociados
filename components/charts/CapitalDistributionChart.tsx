'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CapitalDistribution } from '@/types/finanzas'

interface CapitalDistributionChartProps {
  data: CapitalDistribution[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: CapitalDistribution
  }>
}

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#9c27b0', '#d32f2f']

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {data.managerName}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          ${data.capitalAsignado.toLocaleString('es-AR')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.percentage}% del capital total
        </Typography>
      </Paper>
    )
  }
  return null
}

const CapitalDistributionChart = memo(function CapitalDistributionChart({
  data,
  isLoading = false
}: CapitalDistributionChartProps) {
  const chartHeight = { xs: 400, sm: 450, md: 500 }
  const containerHeight = { xs: 300, sm: 350, md: 400 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Distribución de Capital
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
          Cargando distribución...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Distribución de Capital
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

  const totalCapital = data.reduce((sum, item) => sum + item.capitalAsignado, 0)

  // Prepare data for pie chart
  const chartData = data.map((item) => ({
    ...item,
    name: item.managerName,
    value: item.capitalAsignado
  }))

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Distribución de Capital
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total: ${totalCapital.toLocaleString('es-AR')}
      </Typography>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={window.innerWidth < 600 ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              const item = data.find(d => d.managerName === value)
              return `${value} (${item?.percentage}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
        {data.map((item, index) => (
          <Box
            key={item.managerId}
            sx={{
              textAlign: 'center',
              minWidth: 0,
              flex: '1 1 auto',
              maxWidth: { xs: '100%', sm: '45%', md: '30%' }
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: COLORS[index % COLORS.length],
                display: 'inline-block',
                mr: 1
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ wordBreak: 'break-word', display: 'block' }}
            >
              {item.managerName}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ wordBreak: 'break-word', display: 'block' }}
            >
              ${item.capitalAsignado.toLocaleString('es-AR')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
})

export default CapitalDistributionChart
