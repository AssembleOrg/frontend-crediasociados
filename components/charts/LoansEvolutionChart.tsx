'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface LoansEvolutionData {
  date: string
  loans: number
}

interface LoansEvolutionChartProps {
  data: LoansEvolutionData[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const loanCount = payload[0].value
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="secondary.main" fontWeight={600}>
          {loanCount} {loanCount === 1 ? 'préstamo' : 'préstamos'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Préstamos creados
        </Typography>
      </Paper>
    )
  }
  return null
}

const LoansEvolutionChart = memo(function LoansEvolutionChart({ data, isLoading = false }: LoansEvolutionChartProps) {
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Préstamos Nuevos por Semana
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos...
        </Box>
      </Paper>
    )
  }

  if (!data.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Préstamos Nuevos por Semana
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          No hay préstamos registrados
        </Box>
      </Paper>
    )
  }

  const totalLoans = data.reduce((sum, item) => sum + item.loans, 0)
  const maxWeek = Math.max(...data.map(item => item.loans))
  const avgPerWeek = data.length > 0 ? Math.round(totalLoans / data.length) : 0

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Préstamos Nuevos por Semana
      </Typography>

      <ResponsiveContainer width="100%" height="60%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 20,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            fontSize={11}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            fontSize={11}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="loans"
            fill="#ff9800"
            radius={[4, 4, 0, 0]}
            maxBarSize={80}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      <Box sx={{
        mt: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr 1fr', sm: '1fr 1fr 1fr' },
        gap: { xs: 1, sm: 2 },
        textAlign: 'center',
        px: { xs: 1, sm: 0 }
      }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Total Período
          </Typography>
          <Typography variant="h6" color="secondary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {totalLoans}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Mejor Semana
          </Typography>
          <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {maxWeek}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Promedio/Semana
          </Typography>
          <Typography variant="h6" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {avgPerWeek}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

export default LoansEvolutionChart