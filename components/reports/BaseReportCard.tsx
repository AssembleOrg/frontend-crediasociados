'use client'

import React from 'react'
import { Paper, Typography, Box, Skeleton } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

interface BaseReportCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactElement<SvgIconComponent>
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  isLoading?: boolean
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
}

/**
 * Base Report Card Component
 * Reusable card component for displaying metrics in reports
 */
export default function BaseReportCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  isLoading = false,
  trend
}: BaseReportCardProps) {
  const getColorStyles = (colorName: string) => {
    const colorMap = {
      primary: { bg: 'primary.50', text: 'primary.800', border: 'primary.200' },
      secondary: { bg: 'secondary.50', text: 'secondary.800', border: 'secondary.200' },
      success: { bg: 'success.50', text: 'success.800', border: 'success.200' },
      warning: { bg: 'warning.50', text: 'warning.800', border: 'warning.200' },
      error: { bg: 'error.50', text: 'error.800', border: 'error.200' },
      info: { bg: 'info.50', text: 'info.800', border: 'info.200' }
    }
    return colorMap[colorName as keyof typeof colorMap] || colorMap.primary
  }

  const colors = getColorStyles(color)

  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: 140 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" height={20} />
      </Paper>
    )
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        height: 140,
        bgcolor: colors.bg,
        color: colors.text,
        border: '1px solid',
        borderColor: colors.border,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600 }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{
            color: colors.text,
            opacity: 0.7,
            '& svg': { fontSize: 28 }
          }}>
            {icon}
          </Box>
        )}
      </Box>

      {/* Main Value */}
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 'bold',
          color: colors.text,
          mb: 1,
          lineHeight: 1.2
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>

      {/* Subtitle and Trend */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: colors.text,
              opacity: 0.7,
              fontSize: '0.75rem'
            }}
          >
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            >
              {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
            </Typography>
          </Box>
        )}
      </Box>

    </Paper>
  )
}