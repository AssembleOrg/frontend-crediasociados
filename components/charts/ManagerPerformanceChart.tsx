'use client'

import React, { memo } from 'react'
import { Paper, Typography, Box, useTheme, useMediaQuery } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ManagerAnalytics } from '@/services/analytics.service'

interface ManagerPerformanceData {
  name: string
  amount: number
  managerId: string
  clients: number
  loans: number
}

interface ManagerPerformanceChartProps {
  managers: ManagerAnalytics[]
  isLoading?: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ManagerPerformanceData }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          ${data.amount.toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {data.clients} clientes • {data.loans} préstamos
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Monto total prestado
        </Typography>
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

const formatXAxis = (value: string) => {
  // Truncate long names for better display
  return value.length > 12 ? `${value.substring(0, 12)}...` : value
}

const ManagerPerformanceChart = memo(function ManagerPerformanceChart({ managers, isLoading = false }: ManagerPerformanceChartProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 }
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 }

  // Transform manager analytics data to chart format
  const chartData: ManagerPerformanceData[] = managers.map(manager => ({
    name: manager.managerName,
    amount: manager.totalAmountLent,
    managerId: manager.managerId,
    clients: manager.totalClients,
    loans: manager.totalLoans
  }))

  if (isLoading) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Rendimiento por Manager
        </Typography>
        <Box sx={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          Cargando datos de rendimiento...
        </Box>
      </Paper>
    )
  }

  if (!chartData.length) {
    return (
      <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
        <Typography variant="h6" gutterBottom>
          Rendimiento por Manager
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

  // Sort data by amount (descending) for better visualization
  const sortedData = [...chartData].sort((a, b) => b.amount - a.amount)
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Paper elevation={1} sx={{ p: 3, height: chartHeight }}>
      <Typography variant="h6" gutterBottom>
        Rendimiento por Manager
      </Typography>

      <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
        <BarChart
          data={sortedData}
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: isMobile ? 5 : 20,
            bottom: isMobile ? 20 : 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={isMobile ? 0 : -45}
            textAnchor={isMobile ? 'middle' : 'end'}
            height={isMobile ? 30 : 60}
            tickFormatter={isMobile ? (v: string) => v.length > 8 ? `${v.substring(0, 8)}…` : v : formatXAxis}
            fontSize={isMobile ? 10 : 11}
          />
          <YAxis
            tickFormatter={formatYAxis}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            fill="#1976d2"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total prestado: ${totalAmount.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  )
})

export default ManagerPerformanceChart