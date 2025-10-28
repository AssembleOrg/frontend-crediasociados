'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
      <Paper elevation={3} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} fontSize="0.875rem">
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
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: { xs: 400, sm: 450 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Préstamos Nuevos por Semana
        </Typography>
        <Box sx={{
          flexGrow: 1,
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
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: { xs: 400, sm: 450 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Préstamos Nuevos por Semana
        </Typography>
        <Box sx={{
          flexGrow: 1,
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
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: { xs: 400, sm: 450 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Préstamos Nuevos por Semana
      </Typography>

      <Box sx={{ flexGrow: 1, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              fontSize={11}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: '#666' }}
            />
            <YAxis
              fontSize={11}
              allowDecimals={false}
              tick={{ fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="loans"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#f59e0b" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Summary - Compact */}
      <Box sx={{
        mt: 2,
        pt: 2,
        borderColor: 'divider',
        borderTop: '1px solid',
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Total Período
          </Typography>
          <Typography variant="h6" color="secondary.main" fontSize="1.125rem">
            {totalLoans}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Mejor Semana
          </Typography>
          <Typography variant="h6" color="success.main" fontSize="1.125rem">
            {maxWeek}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Promedio
          </Typography>
          <Typography variant="h6" color="info.main" fontSize="1.125rem">
            {avgPerWeek}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

export default LoansEvolutionChart
