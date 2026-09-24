'use client'

import { Box, Typography, Link, Divider } from '@mui/material'
import { WhatsApp } from '@mui/icons-material'

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: 'grey.200',
        borderTop: '2px solid',
        borderColor: 'divider',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Divider sx={{ borderColor: 'divider', opacity: 0.5 }} />
      <Box
        sx={{
          py: 3,
          px: 3,
          textAlign: 'center',
          maxWidth: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 400,
            }}
          >
            Desarrollado por
          </Typography>
          <Link
            href="https://pistech.com.ar"
            target="_blank"
            rel="noopener"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: '#FFD700',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: '#FFA500',
                transform: 'translateY(-1px)',
                textDecoration: 'underline',
              },
            }}
          >
            Pistech
          </Link>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            color: 'text.disabled',
            fontSize: '0.75rem',
          }}
        >
          © {new Date().getFullYear()} Todos los derechos reservados
        </Typography>
      </Box>
    </Box>
  )
}
