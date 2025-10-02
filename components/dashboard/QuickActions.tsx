'use client'

import { Box, Paper, Typography, Button } from '@mui/material'
import { useRouter, usePathname } from 'next/navigation'

interface QuickAction {
  label: string
  icon: React.ReactNode
  path: string
  variant?: 'contained' | 'outlined'
}

interface QuickActionsProps {
  title?: string
  actions: QuickAction[]
  columns?: number
}

export function QuickActions({
  title = "Acciones Rápidas",
  actions,
  columns = 2
}: QuickActionsProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        display: { xs: 'block', md: 'none' }
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 1.5
        }}
      >
        {actions.map((action, index) => {
          const isActive = pathname === action.path

          return (
            <Button
              key={index}
              variant={isActive ? 'contained' : 'outlined'}
              size="small"
              startIcon={action.icon}
              onClick={() => router.push(action.path)}
              sx={{
                py: 1,
                fontSize: '0.75rem',
                '& .MuiButton-startIcon': {
                  mr: 0.5
                }
              }}
            >
              {action.label}
            </Button>
          )
        })}
      </Box>
    </Paper>
  )
}