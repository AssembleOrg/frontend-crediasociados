'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/auth'

const VERSION_KEY = 'version_notification_1.2.9'
const MAX_SHOW_COUNT = 10
const VERSION_MESSAGE = 'Nueva versión 1.2.9: Se agregaron los datos trabajo/oficio y referencia a la descripción de clientes'

export function VersionNotification() {
  const [open, setOpen] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Only show if user is authenticated
    if (!isAuthenticated) return

    // Get current show count from localStorage
    const storedCount = localStorage.getItem(VERSION_KEY)
    const showCount = storedCount ? parseInt(storedCount, 10) : 0
    
    // Only show if we haven't reached the max count
    if (showCount < MAX_SHOW_COUNT) {
      // Small delay to ensure smooth appearance after login
      const timer = setTimeout(() => {
        setOpen(true)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  const handleClose = () => {
    setOpen(false)
    // Increment show count in localStorage
    const storedCount = localStorage.getItem(VERSION_KEY)
    const currentCount = storedCount ? parseInt(storedCount, 10) : 0
    const newCount = currentCount + 1
    localStorage.setItem(VERSION_KEY, newCount.toString())
  }

  if (!open) return null

  return (
    <Collapse in={open} timeout={500}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 1400,
          maxWidth: 420,
          minWidth: 320,
          background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          overflow: 'hidden',
          animation: 'slideInRight 0.5s ease-out',
          '@keyframes slideInRight': {
            from: {
              transform: 'translateX(100%)',
              opacity: 0,
            },
            to: {
              transform: 'translateX(0)',
              opacity: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 0.5,
                fontSize: '0.95rem',
              }}
            >
              Actualización Disponible
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                lineHeight: 1.5,
                fontSize: '0.875rem',
              }}
            >
              {VERSION_MESSAGE}
            </Typography>
          </Box>

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'white',
              flexShrink: 0,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Collapse>
  )
}

