'use client'

import { useState } from 'react'
import { Box, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material'
import { Phone, WhatsApp } from '@mui/icons-material'
import { getWhatsAppUrl } from '@/lib/phone'
import { useCopyToClipboard } from '@/lib/useCopyToClipboard'

const WHATSAPP_GREEN = '#25D366'

interface PhoneChipProps {
  phone: string | null | undefined
  size?: 'small' | 'medium'
  /** Muestra el ícono de teléfono a la izquierda del número. */
  showIcon?: boolean
}

/**
 * Muestra un teléfono con dos acciones mobile-first:
 * - Tap en el número → copia al portapapeles + toast "Número copiado".
 * - Tap en el ícono de WhatsApp → abre wa.me en una pestaña nueva.
 *
 * Si no hay teléfono, muestra "—" y no es interactivo.
 */
export default function PhoneChip({ phone, size = 'small', showIcon = true }: PhoneChipProps) {
  const { copy } = useCopyToClipboard()
  const [toastOpen, setToastOpen] = useState(false)

  if (!phone || !phone.trim()) {
    return (
      <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.disabled">
        —
      </Typography>
    )
  }

  const phoneFontSize = size === 'small' ? 14 : 16

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await copy(phone)
    if (ok) {
      setToastOpen(true)
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(getWhatsAppUrl(phone), '_blank', 'noopener,noreferrer')
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {showIcon && <Phone sx={{ fontSize: phoneFontSize, color: 'text.disabled' }} />}

      <Tooltip title="Copiar número">
        <Typography
          component="span"
          variant={size === 'small' ? 'caption' : 'body2'}
          onClick={handleCopy}
          sx={{
            cursor: 'pointer',
            color: 'text.secondary',
            transition: 'opacity 0.15s ease',
            '&:hover': { opacity: 0.65 },
          }}
        >
          {phone}
        </Typography>
      </Tooltip>

      <Tooltip title="Abrir WhatsApp">
        <IconButton
          onClick={handleWhatsApp}
          size="small"
          aria-label="Abrir WhatsApp"
          sx={{ color: WHATSAPP_GREEN, p: 0.5 }}
        >
          <WhatsApp sx={{ fontSize: phoneFontSize + 4 }} />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: '100%' }}>
          Número copiado
        </Alert>
      </Snackbar>
    </Box>
  )
}
