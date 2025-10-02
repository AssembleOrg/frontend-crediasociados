import { Paper, Box, Skeleton, Typography } from '@mui/material'

interface ChartSkeletonProps {
  title?: string
  height?: { xs: number; sm: number; md: number; lg: number }
}

export function ChartSkeleton({
  title,
  height = { xs: 380, sm: 420, md: 520, lg: 580 }
}: ChartSkeletonProps) {
  return (
    <Paper elevation={1} sx={{ p: 3, height }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          <Skeleton width="60%" />
        </Typography>
      )}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80%',
        flexDirection: 'column',
        gap: 2
      }}>
        <Skeleton
          variant="circular"
          width={200}
          height={200}
          sx={{ display: { xs: 'block', md: 'none' } }}
        />
        <Skeleton
          variant="circular"
          width={300}
          height={300}
          sx={{ display: { xs: 'none', md: 'block' } }}
        />
        <Box sx={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton width="100%" height={20} />
          <Skeleton width="90%" height={20} />
          <Skeleton width="95%" height={20} />
        </Box>
      </Box>
    </Paper>
  )
}

export function BarChartSkeleton({
  title,
  height = { xs: 480, sm: 520, md: 600, lg: 680 }
}: ChartSkeletonProps) {
  return (
    <Paper elevation={1} sx={{ p: 3, height }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          <Skeleton width="60%" />
        </Typography>
      )}
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '70%',
        px: 2,
        gap: { xs: 1, sm: 2 }
      }}>
        {[60, 80, 40, 90, 55, 70].map((height, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={`${height}%`}
            sx={{
              borderRadius: '4px 4px 0 0',
              width: { xs: 30, sm: 50, md: 60 }
            }}
          />
        ))}
      </Box>
      <Box sx={{
        mt: 3,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 2,
        px: 2
      }}>
        {[1, 2, 3].map((_, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Skeleton width="80%" height={16} sx={{ mx: 'auto', mb: 0.5 }} />
            <Skeleton width="60%" height={24} sx={{ mx: 'auto' }} />
          </Box>
        ))}
      </Box>
    </Paper>
  )
}