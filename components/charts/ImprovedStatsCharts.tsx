'use client';

import React from 'react';
import { Paper, Typography, Box, Skeleton } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// ============================================================================
// TIPOS
// ============================================================================

interface ChartDataItem {
  name: string;
  value: number;
  label?: string;
  [key: string]: string | number | undefined;
}

interface StatsChartProps {
  title: string;
  data: ChartDataItem[];
  isLoading?: boolean;
  height?: number;
  showPercentage?: boolean;
}

// ============================================================================
// COLORES MODERNOS
// ============================================================================

const MODERN_COLORS = [
  '#3b82f6', // Blue 500
  '#10b981', // Green 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
  '#8b5cf6', // Purple 500
  '#ec4899', // Pink 500
  '#14b8a6', // Teal 500
  '#f97316', // Orange 500
];

// ============================================================================
// CUSTOM LABEL CON PORCENTAJE
// ============================================================================

//eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  
  // Solo mostrar si el porcentaje es >= 5%
  if (!percent || percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="14"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataItem;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload[0].payload.value || 0;

    return (
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {data.payload.label || data.name}
        </Typography>
        <Typography variant="body2" color="primary">
          {data.value.toLocaleString('es-AR')} ({((data.value / total) * 100).toFixed(1)}%)
        </Typography>
      </Paper>
    );
  }
  return null;
};

// ============================================================================
// PIE CHART MEJORADO
// ============================================================================

export function ImprovedPieChart({
  title,
  data,
  isLoading = false,
  height = 400,
  showPercentage = true,
}: StatsChartProps) {
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width="80%" height={24} sx={{ mt: 2, mx: 'auto' }} />
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Paper>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showPercentage ? (renderCustomLabel) : false}
              outerRadius="80%"
              innerRadius="40%"
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MODERN_COLORS[index % MODERN_COLORS.length]}
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
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
                  bgcolor: MODERN_COLORS[index % MODERN_COLORS.length],
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {item.label || item.name}: <strong>{percentage}%</strong> ({item.value})
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Total */}
      <Box sx={{ mt: 2, textAlign: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Total: <strong>{total.toLocaleString('es-AR')}</strong> {data.length === 1 ? 'item' : 'items'}
        </Typography>
      </Box>
    </Paper>
  );
}

// ============================================================================
// BAR CHART MEJORADO
// ============================================================================

export function ImprovedBarChart({
  title,
  data,
  isLoading = false,
  height = 400,
}: StatsChartProps) {
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height - 100} />
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>

      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              label={{
                position: 'top',
                fontSize: 12,
                fill: '#666',
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

