'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface CurrencyDistributionData {
  name: string
  value: number
  amount: number
}

interface CurrencyDistributionChartProps {
  data: CurrencyDistributionData[]
  isLoading?: boolean
}

const CURRENCY_COLORS = {
  ARS: '#4caf50',  // Green for ARS
  USD: '#2196f3'   // Blue for USD
}

const CURRENCY_LABELS = {
  ARS: 'Pesos',
  USD: 'Dólares'
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 180 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {CURRENCY_LABELS[data.name as keyof typeof CURRENCY_LABELS] || data.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Préstamos: {data.value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monto: {data.name === 'USD' ? '$' : '$'}{data.amount.toLocaleString()} {data.name}
        </Typography>
      </Paper>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
  if (percent < 0.1) return null // Don't show labels for slices smaller than 10%

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
      {`${payload.name}`}
    </text>
  )
}

export default function CurrencyDistributionChart({ data, isLoading = false }: CurrencyDistributionChartProps) {
  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: 300 }}>
        <Typography variant="h6" gutterBottom>
          Distribución por Moneda
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
          Distribución por Moneda
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
        Distribución por Moneda
      </Typography>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={90}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CURRENCY_COLORS[entry.name as keyof typeof CURRENCY_COLORS] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary info */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
        {data.map((currency) => (
          <Box key={currency.name} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {CURRENCY_LABELS[currency.name as keyof typeof CURRENCY_LABELS] || currency.name}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {currency.value} préstamos
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}