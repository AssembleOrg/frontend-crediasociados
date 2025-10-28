'use client'

import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ManagerAnalytics } from '@/services/analytics.service'

interface CollectionRateData {
  name: string
  value: number
  color: string
  rate: number
  [key: string]: string | number // Index signature for recharts compatibility
}

interface ManagerCollectionChartProps {
  managers: ManagerAnalytics[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: CollectionRateData }>
  label?: string
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
          Tasa de cobranza: {data.rate.toFixed(1)}%
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

export default function ManagerCollectionChart({ managers, isLoading = false }: ManagerCollectionChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  // Categorize managers by collection rate
  const getCollectionCategory = (rate: number) => {
    if (rate >= 80) return { name: 'Excelente (≥80%)', color: '#2e7d32', minRate: 80 }
    if (rate >= 60) return { name: 'Buena (60-79%)', color: '#1976d2', minRate: 60 }
    if (rate >= 40) return { name: 'Regular (40-59%)', color: '#ff9800', minRate: 40 }
    return { name: 'Baja (<40%)', color: '#d32f2f', minRate: 0 }
  }

  // Group managers by collection rate categories
  const categories = managers.reduce((acc, manager) => {
    const category = getCollectionCategory(manager.collectionRate)
    const existing = acc.find(item => item.name === category.name)

    if (existing) {
      existing.value += 1
      existing.rate = (existing.rate + manager.collectionRate) / 2 // Average rate
    } else {
      acc.push({
        name: category.name,
        value: 1,
        color: category.color,
        rate: manager.collectionRate
      })
    }

    return acc
  }, [] as CollectionRateData[])

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Distribución por Tasa de Cobranza
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

  if (!categories.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Distribución por Tasa de Cobranza
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

  const totalManagers = categories.reduce((sum, item) => sum + item.value, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Distribución por Tasa de Cobranza
      </Typography>

      <ResponsiveContainer width="100%" height="75%">
        <PieChart>
          <Pie
            data={categories}
            cx="50%"
            cy="50%"
            labelLine={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={CustomLabel as any}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
          >
            {categories.map((entry, index) => (
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

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total: {totalManagers} {totalManagers === 1 ? 'manager' : 'managers'} evaluados
        </Typography>
      </Box>
    </Paper>
  )
}