'use client'

import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error'
  progress?: number
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  progress,
  trend 
}: StatsCardProps) {
  const getColorValue = (colorName: string) => {
    const colors = {
      primary: '#1976d2',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f'
    }
    return colors[colorName as keyof typeof colors] || colors.primary
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                color: getColorValue(color),
                mb: 0.5
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ 
              p: 1, 
              borderRadius: 1, 
              bgcolor: `${getColorValue(color)}15`,
              color: getColorValue(color)
            }}>
              {icon}
            </Box>
          )}
        </Box>

        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progreso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getColorValue(color),
                  borderRadius: 3
                }
              }}
            />
          </Box>
        )}

        {trend && (
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: trend.isPositive ? '#e8f5e8' : '#ffebee'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: trend.isPositive ? '#388e3c' : '#d32f2f'
              }}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}