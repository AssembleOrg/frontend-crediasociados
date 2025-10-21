'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Autocomplete
} from '@mui/material'
import {
  FilterList,
  Clear
} from '@mui/icons-material'
import { useCobrosFilters } from '@/hooks/useCobrosFilters'
import { useClients } from '@/hooks/useClients'

interface CobrosFilterPanelProps {
  variant?: 'expanded' | 'compact'
  onClose?: () => void
}

export function CobrosFilterPanel({ variant = 'expanded', onClose }: CobrosFilterPanelProps) {
  const {
    filters,
    filterStats,
    hasActiveFilters,
    statusFilterOptions,
    updateFilter,
    clearAllFilters
  } = useCobrosFilters()
  
  const { clients } = useClients()

  const handleClearFilters = () => {
    clearAllFilters()
    onClose?.()
  }

  const handleStatusFilter = (status: 'OVERDUE' | 'TODAY' | 'SOON' | 'UPCOMING' | 'NOTIFIED' | 'ALL' | null) => {
    updateFilter('status', status || undefined)
  }

  const handlePaymentStatusFilter = (paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL' | null) => {
    updateFilter('paymentStatus', paymentStatus || undefined)
  }

  // Payment status filter options
  const paymentStatusOptions = [
    {
      key: 'ALL',
      label: 'Todos',
      color: 'default',
      count: filterStats.paymentStatus?.all || 0
    },
    {
      key: 'PENDING',
      label: 'Pendiente',
      color: 'default',
      count: filterStats.paymentStatus?.pending || 0
    },
    {
      key: 'PARTIAL',
      label: 'Pago Parcial',
      color: 'info',
      count: filterStats.paymentStatus?.partial || 0
    },
    {
      key: 'PAID',
      label: 'Pagado',
      color: 'success',
      count: filterStats.paymentStatus?.paid || 0
    }
  ]

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Filtros de Cobros
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${filterStats.total} resultados`}
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </Box>

        {/* Quick Status Filter Buttons */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Estados
          </Typography>
          <ToggleButtonGroup
            value={filters.status || ''}
            exclusive
            onChange={(_, value) => handleStatusFilter(value)}
            size="small"
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: '1px solid',
                px: 2,
                py: 1
              }
            }}
          >
            {statusFilterOptions.map((option) => (
              <ToggleButton 
                key={option.key}
                value={option.key}
                sx={{
                  color: 'customColor' in option ? option.customColor : `${option.color}.main`,
                  borderColor: 'customColor' in option ? option.customColor : `${option.color}.main`,
                  '&.Mui-selected': {
                    backgroundColor: 'customColor' in option ? option.customColor : `${option.color}.main`,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'customColor' in option ? option.customColor : `${option.color}.dark`,
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'customColor' in option ? `${option.customColor}20` : `${option.color}.light`,
                  }
                }}
              >
                {option.label} ({option.count})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Payment Status Filter Buttons */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Estado de Pago
          </Typography>
          <ToggleButtonGroup
            value={filters.paymentStatus || 'ALL'}
            exclusive
            onChange={(_, value) => handlePaymentStatusFilter(value)}
            size="small"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: '1px solid',
                px: 2,
                py: 1
              }
            }}
          >
            {paymentStatusOptions.map((option) => (
              <ToggleButton
                key={option.key}
                value={option.key}
                sx={{
                  color: `${option.color}.main`,
                  borderColor: `${option.color}.main`,
                  '&.Mui-selected': {
                    backgroundColor: `${option.color}.main`,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: `${option.color}.dark`,
                    }
                  },
                  '&:hover': {
                    backgroundColor: `${option.color}.light`,
                  }
                }}
              >
                {option.label} ({option.count})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Simplified Filters */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'flex-end' }
        }}>
          {/* Client Selection */}
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              size="small"
              options={clients}
              getOptionLabel={(option) => option.fullName}
              value={clients.find(c => c.id === filters.clientId) || null}
              onChange={(_, newValue) => {
                updateFilter('clientId', newValue?.id)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Seleccionar cliente..."
                />
              )}
              noOptionsText="No hay clientes disponibles"
            />
          </Box>
          
          {/* Clear Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              size="small"
              color="error"
              sx={{
                height: 40,
                minWidth: 'auto',
                px: 2,
                fontWeight: 'bold'
              }}
            >
              Limpiar
            </Button>
          )}
        </Box>

        {/* Filter Summary */}
        {(hasActiveFilters || filterStats.notifiedCount > 0) && variant === 'expanded' && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{filterStats.total}</strong> clientes encontrados • 
              Monto total: <strong>${filterStats.totalAmount.toLocaleString('es-AR')}</strong> •
              Vencidas: <strong>{filterStats.byStatus.overdue}</strong> •
              Hoy: <strong>{filterStats.byStatus.today}</strong> •
              Pronto: <strong>{filterStats.byStatus.soon}</strong>
              {filterStats.notifiedCount > 0 && (
                <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                  {' • '}{filterStats.notifiedCount} notificado{filterStats.notifiedCount !== 1 ? 's' : ''}
                </span>
              )}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}