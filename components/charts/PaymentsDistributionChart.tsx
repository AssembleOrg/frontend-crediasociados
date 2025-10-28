'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PaymentsDistributionData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface PaymentsDistributionChartProps {
  data: PaymentsDistributionData[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: PaymentsDistributionData }>
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
          Cuotas: {data.value}
        </Typography>
      </Paper>
    )
  }
  return null
}

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

const PaymentsDistributionChart = memo(function PaymentsDistributionChart({ data, isLoading = false }: PaymentsDistributionChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Distribución de Pagos
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
          Distribución de Pagos
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          No hay pagos registrados
        </Box>
      </Paper>
    )
  }

  const totalPayments = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Distribución de Pagos por Estado
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
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total: {totalPayments} {totalPayments === 1 ? 'cuota' : 'cuotas'}
        </Typography>
      </Box>
    </Paper>
  )
})

export default PaymentsDistributionChart