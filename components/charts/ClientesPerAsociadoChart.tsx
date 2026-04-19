'use client';

import React, { memo } from 'react';
import { Paper, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ClientesPerAsociadoData {
  name: string;
  clientCount: number;
  asociadoId: string;
}

interface ClientesPerAsociadoChartProps {
  data: ClientesPerAsociadoData[];
  isLoading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Paper
        elevation={3}
        sx={{ p: 2, minWidth: 200 }}
      >
        <Typography
          variant='subtitle2'
          fontWeight={600}
        >
          {label}
        </Typography>
        <Typography
          variant='body2'
          color='success.main'
          fontWeight={600}
        >
          {data.value} {data.value === 1 ? 'cliente' : 'clientes'}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
        >
          Total de clientes activos
        </Typography>
      </Paper>
    );
  }
  return null;
};

const formatYAxis = (value: number) => {
  return value.toString();
};

const formatXAxis = (value: string) => {
  // Truncate long names for better display
  return value.length > 12 ? `${value.substring(0, 12)}...` : value;
};

const ClientesPerAsociadoChart = memo(function ClientesPerAsociadoChart({
  data,
  isLoading = false,
}: ClientesPerAsociadoChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = { xs: 380, sm: 420, md: 520, lg: 580 };
  const containerHeight = { xs: 280, sm: 320, md: 420, lg: 480 };

  if (isLoading) {
    return (
      <Paper
        elevation={1}
        sx={{ p: 3, height: chartHeight }}
      >
        <Typography
          variant='h6'
          gutterBottom
        >
          Clientes por Asociado
        </Typography>
        <Box
          sx={{
            height: containerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          Cargando datos de clientes...
        </Box>
      </Paper>
    );
  }

  if (!data.length) {
    return (
      <Paper
        elevation={1}
        sx={{ p: 3, height: chartHeight }}
      >
        <Typography
          variant='h6'
          gutterBottom
        >
          Clientes por Asociado
        </Typography>
        <Box
          sx={{
            height: containerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          No hay datos disponibles
        </Box>
      </Paper>
    );
  }

  // Sort data by client count (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.clientCount - a.clientCount);
  const totalClients = data.reduce((sum, item) => sum + item.clientCount, 0);

  return (
    <Paper
      elevation={1}
      sx={{ p: 3, height: chartHeight }}
    >
      <Typography
        variant='h6'
        gutterBottom
      >
        Clientes por Asociado
      </Typography>

      <ResponsiveContainer
        width='100%'
        height={isMobile ? 260 : 300}
      >
        <BarChart
          data={sortedData}
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: isMobile ? 5 : 20,
            bottom: isMobile ? 20 : 60,
          }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis
            dataKey='name'
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
            dataKey='clientCount'
            fill='#4caf50'
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary with better spacing */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography
          variant='body2'
          color='text.secondary'
        >
          Total clientes: {totalClients}
        </Typography>
      </Box>
    </Paper>
  );
});

export default ClientesPerAsociadoChart;
