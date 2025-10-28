import { Box, Container, Paper, Skeleton, Stack } from '@mui/material'

export default function LoginLoading() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Stack spacing={3}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center' }}>
              <Skeleton variant="rectangular" width="100%" height={175} sx={{ mx: 'auto', borderRadius: 2 }} />
              <Skeleton variant="text" width="50%" height={40} sx={{ mx: 'auto', mt: 2 }} />
            </Box>

            {/* Form fields */}
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />

            {/* Button */}
            <Skeleton variant="rectangular" height={48} />
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}

