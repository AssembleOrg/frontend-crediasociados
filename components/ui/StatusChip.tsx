'use client'

import { Chip, type ChipProps } from '@mui/material'
import { iosColors } from '@/lib/theme'

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; color: string }> = {
  PAID:      { label: 'Pagado',    bg: iosColors.green,    color: '#fff' },
  PARTIAL:   { label: 'Parcial',   bg: iosColors.orange,   color: '#fff' },
  PENDING:   { label: 'Pendiente', bg: iosColors.gray4,    color: iosColors.secondaryLabel },
  OVERDUE:   { label: 'Vencido',   bg: iosColors.red,      color: '#fff' },
  ACTIVE:    { label: 'Activo',    bg: iosColors.blue,     color: '#fff' },
  COMPLETED: { label: 'Completado',bg: iosColors.green,    color: '#fff' },
  DEFAULTED: { label: 'Moroso',    bg: '#FF2D55',          color: '#fff' },
}

const LABEL_OVERRIDES: Record<string, PaymentStatus> = {
  PAGADO:    'PAID',
  PARCIAL:   'PARTIAL',
  PENDIENTE: 'PENDING',
  VENCIDO:   'OVERDUE',
  ACTIVO:    'ACTIVE',
}

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string
  size?: 'small' | 'medium'
}

export function StatusChip({ status, size = 'small', sx, ...rest }: StatusChipProps) {
  const normalized = (LABEL_OVERRIDES[status.toUpperCase()] ?? status.toUpperCase()) as PaymentStatus
  const config = STATUS_CONFIG[normalized] ?? {
    label: status,
    bg:    iosColors.gray4,
    color: iosColors.secondaryLabel,
  }

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        backgroundColor: config.bg,
        color:           config.color,
        fontWeight:      700,
        fontSize:        size === 'small' ? '0.6875rem' : '0.8125rem',
        height:          size === 'small' ? 22 : 28,
        borderRadius:    20,
        letterSpacing:   '0.02em',
        ...sx,
      }}
      {...rest}
    />
  )
}
