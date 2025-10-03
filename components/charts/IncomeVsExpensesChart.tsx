'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { IncomeVsExpenses } from '@/types/finanzas'

interface IncomeVsExpensesChartProps {
  data: IncomeVsExpenses[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const ingresos = payload.find(p => p.name === 'Ingresos')?.value || 0
    const egresos = payload.find(p => p.name === 'Egresos')?.value || 0
    const balance = ingresos - egresos

    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="success.main" fontWeight={600}>
          Ingresos: ${ingresos.toLocaleString('es-AR')}
        </Typography>
        <Typography variant="body2" color="error.main" fontWeight={600}>
          Egresos: ${egresos.toLocaleString('es-AR')}
        </Typography>
        <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color={balance >= 0 ? 'success.main' : 'error.main'}
          >
            Balance: ${balance.toLocaleString('es-AR')}
          </Typography>
        </Box>
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

const IncomeVsExpensesChart = memo(function IncomeVsExpensesChart({
  data,
  isLoading = false
}: IncomeVsExpensesChartProps) {
  const chartHeight = { xs: 450, sm: 500, md: 550 }
  const containerHeight = { xs: 300, sm: 350, md: 400 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Ingresos vs Egresos
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
          Cargando datos...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Ingresos vs Egresos
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

  const totalIngresos = data.reduce((sum, item) => sum + item.ingresos, 0)
  const totalEgresos = data.reduce((sum, item) => sum + item.egresos, 0)
  const balance = totalIngresos - totalEgresos

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Ingresos vs Egresos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Últimos {data.length} meses
      </Typography>

      <ResponsiveContainer width="100%" height="65%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={formatYAxis}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="square"
          />
          <Bar
            dataKey="ingresos"
            fill="#388e3c"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
            name="Ingresos"
            isAnimationActive={false}
          />
          <Bar
            dataKey="egresos"
            fill="#d32f2f"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
            name="Egresos"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary - Responsive Grid */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr 1fr', sm: '1fr 1fr 1fr' },
          gap: { xs: 1, sm: 2 },
          textAlign: 'center',
          px: { xs: 1, sm: 0 }
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Total Ingresos
          </Typography>
          <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            ${totalIngresos.toLocaleString('es-AR')}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Total Egresos
          </Typography>
          <Typography variant="h6" color="error.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            ${totalEgresos.toLocaleString('es-AR')}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Balance
          </Typography>
          <Typography
            variant="h6"
            color={balance >= 0 ? 'success.main' : 'error.main'}
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            ${balance.toLocaleString('es-AR')}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

export default IncomeVsExpensesChart
