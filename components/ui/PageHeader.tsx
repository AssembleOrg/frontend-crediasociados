'use client'

import { Box, Typography, Button } from '@mui/material'

interface PageHeaderAction {
  label: string
  onClick: () => void
  variant?: 'contained' | 'outlined' | 'text'
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  startIcon?: React.ReactNode
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: PageHeaderAction[]
  size?: 'small' | 'medium' | 'large'
}

export default function PageHeader({ 
  title, 
  subtitle, 
  actions = [],
  size = 'medium'
}: PageHeaderProps) {
  const getTitleVariant = () => {
    switch (size) {
      case 'small': return 'h5' as const
      case 'large': return 'h3' as const
      default: return 'h4' as const
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: actions.length > 0 ? '1fr auto' : '1fr' },
        gap: { xs: 3, sm: 2 },
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 4,
      }}
    >
      <Box>
        <Typography
          variant={getTitleVariant()}
          component="h1"
          gutterBottom
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            color="text.secondary"
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
          }}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'contained'}
              color={action.color || 'primary'}
              size={action.size || 'medium'}
              startIcon={action.startIcon}
              onClick={action.onClick}
              disabled={action.disabled}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  )
}