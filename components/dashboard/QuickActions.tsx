'use client'

import { Box, Paper, Typography, Button } from '@mui/material'
import { useRouter } from 'next/navigation'

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

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 3, 
        display: { xs: 'block', md: 'none' } // Solo mobile
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
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outlined'}
            size="small"
            startIcon={action.icon}
            onClick={() => router.push(action.path)}
            sx={{
              py: 1,
              fontSize: '0.75rem',
              '& .MuiButton-startIcon': {
                mr: 0.5
              },
              // Fix hover state on touch devices
              '@media (hover: none) and (pointer: coarse)': {
                '&:hover': {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }
              }
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Paper>
  )
}