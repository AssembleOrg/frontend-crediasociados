'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box, useTheme, useMediaQuery } from '@mui/material'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          minHeight: 200,
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
          p: { xs: 2, sm: 3 },
          minHeight: 200,
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
        p: { xs: 2, sm: 3 },
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

      <ResponsiveContainer width="100%" height={isMobile ? 180 : 280}>
        <BarChart
          data={data}
          margin={{
            top: isMobile ? 8 : 20,
            right: isMobile ? 8 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 16 : 60,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            fontSize={isMobile ? 10 : 11}
            interval={0}
            angle={isMobile ? 0 : -45}
            textAnchor={isMobile ? 'middle' : 'end'}
            height={isMobile ? 30 : 60}
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

      {/* Summary */}
      <Box sx={{
        mt: 1.5,
        pt: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
      }}>
        {[
          { label: 'Total Período', value: totalLoans, color: 'secondary.main' },
          { label: 'Mejor Semana', value: maxWeek, color: 'success.main' },
          { label: 'Promedio', value: avgPerWeek, color: 'info.main' },
        ].map((stat) => (
          <Box key={stat.label} sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="h6" fontWeight={700} color={stat.color} sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.2 }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
})

export default LoansEvolutionChart
