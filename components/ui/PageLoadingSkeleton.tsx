'use client'

import { Box, Container, Skeleton, Stack, Paper } from '@mui/material'

interface PageLoadingSkeletonProps {
  variant?: 'dashboard' | 'table' | 'form' | 'simple'
}

export function PageLoadingSkeleton({ variant = 'dashboard' }: PageLoadingSkeletonProps) {
  if (variant === 'simple') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="text" width="40%" height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    )
  }

  if (variant === 'form') {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={120} height={40} />
            </Box>
          </Stack>
        </Paper>
      </Container>
    )
  }

  if (variant === 'table') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack spacing={1}>
              <Skeleton variant="text" width={300} height={50} />
              <Skeleton variant="text" width={200} height={30} />
            </Stack>
            <Skeleton variant="rectangular" width={150} height={40} />
          </Box>

          {/* Search bar */}
          <Skeleton variant="rectangular" height={56} sx={{ maxWidth: 400 }} />

          {/* Table */}
          <Paper>
            <Box sx={{ p: 2 }}>
              {/* Table header */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="text" width={`${100 / 5}%`} height={30} />
                ))}
              </Box>

              {/* Table rows */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <Box key={row} sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  {[1, 2, 3, 4, 5].map((col) => (
                    <Skeleton key={col} variant="text" width={`${100 / 5}%`} height={40} />
                  ))}
                </Box>
              ))}
            </Box>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Skeleton variant="rectangular" width={300} height={40} />
            </Box>
          </Paper>
        </Stack>
      </Container>
    )
  }

  // Dashboard variant (default)
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Skeleton variant="text" width={300} height={50} />
          <Skeleton variant="text" width={200} height={30} />
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper key={i} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton variant="text" width="60%" height={30} />
                <Skeleton variant="text" width="80%" height={40} />
              </Stack>
            </Paper>
          ))}
        </Box>

        {/* Charts */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Box>

        {/* Table preview */}
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: i < 5 ? 1 : 0, borderColor: 'divider' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={25} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={30} />
            </Box>
          ))}
        </Paper>
      </Stack>
    </Container>
  )
}

