'use client'

import { Card, CardContent, Box, Skeleton } from '@mui/material'

interface StatsCardSkeletonProps {
  showIcon?: boolean
  showProgress?: boolean
  showTrend?: boolean
}

export function StatsCardSkeleton({ 
  showIcon = true,
  showProgress = false,
  showTrend = false 
}: StatsCardSkeletonProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            {/* Title skeleton */}
            <Skeleton 
              variant="text" 
              width="60%" 
              height={20} 
              sx={{ mb: 1 }} 
            />
            
            {/* Value skeleton */}
            <Skeleton 
              variant="text" 
              width="80%" 
              height={40} 
              sx={{ mb: 0.5 }} 
            />
            
            {/* Subtitle skeleton */}
            <Skeleton 
              variant="text" 
              width="70%" 
              height={16} 
            />
          </Box>
          
          {/* Icon skeleton */}
          {showIcon && (
            <Skeleton 
              variant="rounded" 
              width={48} 
              height={48} 
              sx={{ borderRadius: 1 }}
            />
          )}
        </Box>

        {/* Progress skeleton */}
        {showProgress && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="text" width="40%" height={16} />
              <Skeleton variant="text" width="20%" height={16} />
            </Box>
            <Skeleton 
              variant="rounded" 
              width="100%" 
              height={6} 
              sx={{ borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Trend skeleton */}
        {showTrend && (
          <Box sx={{ 
            mt: 2, 
            p: 1,
            borderRadius: 1,
            bgcolor: 'grey.50'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="text" width="30%" height={16} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}