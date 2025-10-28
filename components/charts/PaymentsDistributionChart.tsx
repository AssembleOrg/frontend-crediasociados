'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

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
    const total = payload.reduce((sum, item) => sum + item.value, 0)
    const percentage = ((data.value / total) * 100).toFixed(1)
    
    return (
      <Paper elevation={3} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} fontSize="0.875rem">
          {data.name}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {data.value} cuotas ({percentage}%)
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
  percent: number
  index: number
}

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) => {
  // Solo mostrar si el porcentaje es >= 5%
  if (percent < 0.05) return null

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
      fontSize={14}
      fontWeight="bold"
      style={{
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const PaymentsDistributionChart = memo(function PaymentsDistributionChart({ data, isLoading = false }: PaymentsDistributionChartProps) {
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
          Distribución de Pagos por Estado
        </Typography>
        <Box sx={{
          flexGrow: 1,
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
          Distribución de Pagos por Estado
        </Typography>
        <Box sx={{
          flexGrow: 1,
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
        Distribución de Pagos por Estado
      </Typography>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius="70%"
              innerRadius="35%"
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Leyenda personalizada con porcentajes */}
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        {data.map((item, index) => {
          const percentage = ((item.value / totalPayments) * 100).toFixed(1)
          return (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: item.color,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {item.name}: <strong>{percentage}%</strong> ({item.value})
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* Total */}
      <Box sx={{ mt: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Total: <strong>{totalPayments.toLocaleString('es-AR')}</strong> cuotas
        </Typography>
      </Box>
    </Paper>
  )
})

export default PaymentsDistributionChart
