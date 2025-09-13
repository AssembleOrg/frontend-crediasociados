'use client'

import { Box } from '@mui/material'

interface StatsGridProps {
  children: React.ReactNode
  columns?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  minWidth?: string
}

export default function StatsGrid({ 
  children,
  columns = { xs: 1, sm: 2, lg: 3 },
  gap = 3,
  minWidth = '250px'
}: StatsGridProps) {
  // Convert columns object to grid template columns
  const getGridTemplateColumns = () => {
    const gridConfig: Record<string, string> = {}
    
    if (columns.xs) gridConfig.xs = `repeat(${columns.xs}, 1fr)`
    if (columns.sm) gridConfig.sm = `repeat(${columns.sm}, 1fr)`  
    if (columns.md) gridConfig.md = `repeat(${columns.md}, 1fr)`
    if (columns.lg) gridConfig.lg = `repeat(${columns.lg}, 1fr)`
    if (columns.xl) gridConfig.xl = `repeat(${columns.xl}, 1fr)`

    // Default to auto-fit if no specific columns defined
    if (Object.keys(gridConfig).length === 0) {
      return `repeat(auto-fit, minmax(${minWidth}, 1fr))`
    }

    return gridConfig
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: getGridTemplateColumns(),
        gap,
        mb: 4,
      }}
    >
      {children}
    </Box>
  )
}