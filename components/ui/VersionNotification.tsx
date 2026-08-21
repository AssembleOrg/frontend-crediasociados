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

const VERSION_KEY = 'version_notification_1.6'
const MAX_SHOW_COUNT = 10
const VERSION_TITLE = 'Nueva versión 1.6'
const VERSION_ITEMS = [
  'Corregidos los montos de "En Calle" y capital + intereses en Operativa.',
  '"Préstamos con Deuda" ahora cuenta solo los préstamos que realmente deben.',
  'PDF de préstamos más claro y compacto.',
  'Los clientes eliminados durante una búsqueda ya no quedan visibles hasta refrescar.',
]

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
      const showTimer = setTimeout(() => setOpen(true), 800)
      // Auto-dismiss after 8 seconds (más items = más tiempo de lectura)
      const hideTimer = setTimeout(() => handleClose(), 8000)
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
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
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
          minWidth: { xs: 'auto', sm: 320 },
          left: { xs: 16, sm: 'auto' },
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
                mb: 1,
                fontSize: '0.95rem',
              }}
            >
              {VERSION_TITLE}
            </Typography>
            {VERSION_ITEMS.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '0.875rem', lineHeight: 1.4 }}
                >
                  •
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    lineHeight: 1.4,
                    fontSize: '0.875rem',
                    flex: 1,
                  }}
                >
                  {item}
                </Typography>
              </Box>
            ))}
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


