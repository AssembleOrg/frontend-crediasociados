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
  Autocomplete,
  CircularProgress
} from '@mui/material'
import {
  FilterList,
  Clear
} from '@mui/icons-material'
import { useCobrosFilters } from '@/hooks/useCobrosFilters'
import { clientsService } from '@/services/clients.service'
import { useCallback, useEffect, useState } from 'react'

interface CobrosFilterPanelProps {
  variant?: 'expanded' | 'compact'
  onClose?: () => void
}

interface ClientOption {
  id: string
  fullName: string
  dni?: string | null
  phone?: string | null
  email?: string | null
}

export function CobrosFilterPanel({ variant = 'expanded', onClose }: CobrosFilterPanelProps) {
  const {
    filters,
    globalStats,
    hasActiveFilters,
    statusFilterOptions,
    updateFilter,
    clearAllFilters
  } = useCobrosFilters()
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const baseClientOptions: ClientOption[] = []

  const handleClearFilters = () => {
    clearAllFilters()
    setClientSearchQuery('')
    setSelectedClient(null)
    setClientOptions(baseClientOptions)
    onClose?.()
  }

  const handleStatusFilter = (status: 'overdue' | 'today' | 'soon' | 'future' | 'all' | null) => {
    updateFilter('urgency', status || undefined)
  }

  const handlePaymentStatusFilter = (paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'ALL' | null) => {
    updateFilter('paymentStatus', (paymentStatus === 'ALL' ? undefined : paymentStatus) || undefined)
  }

  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setClientOptions(baseClientOptions)
      return
    }

    setIsSearchingClients(true)
    try {
      const results = await clientsService.searchClients(query, 20)
      setClientOptions(results)
    } catch (_error) {
      setClientOptions([])
    } finally {
      setIsSearchingClients(false)
    }
  }, [baseClientOptions])

  useEffect(() => {
    if (clientSearchQuery.length < 2) {
      setClientOptions(baseClientOptions)
      return
    }

    const timer = setTimeout(() => {
      searchClients(clientSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [clientSearchQuery, searchClients, baseClientOptions])

  useEffect(() => {
    if (!filters.clientId) {
      if (selectedClient) setSelectedClient(null)
      return
    }

    const selected = clientOptions.find(c => c.id === filters.clientId)
      || baseClientOptions.find(c => c.id === filters.clientId)

    if (selected && selected.id !== selectedClient?.id) {
      setSelectedClient(selected)
      setClientSearchQuery(selected.fullName)
    }
  }, [filters.clientId, clientOptions, baseClientOptions, selectedClient])

  // Payment status filter options
  const paymentStatusOptions = [
    {
      key: 'ALL',
      label: 'Todos',
      color: 'default',
      count: 0
    },
    {
      key: 'PENDING',
      label: 'Pendiente',
      color: 'default',
      count: 0
    },
    {
      key: 'PARTIAL',
      label: 'Pago Parcial',
      color: 'info',
      count: 0
    },
    {
      key: 'PAID',
      label: 'Pagado',
      color: 'success',
      count: 0
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
                label={`${globalStats.total} resultados`}
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
            value={filters.urgency || ''}
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
                  color: option.color,
                  borderColor: option.color,
                  '&.Mui-selected': {
                    backgroundColor: option.color,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: option.color,
                    }
                  },
                  '&:hover': {
                    backgroundColor: `${option.color}20`,
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
              options={clientOptions}
              getOptionLabel={(option) => option.fullName}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(x) => x}
              value={selectedClient}
              inputValue={clientSearchQuery}
              onInputChange={(_, newValue, reason) => {
                // MUI emits "reset" on value sync; ignore to avoid overwriting typing.
                if (reason === 'reset') return

                if (reason === 'clear') {
                  setClientSearchQuery('')
                  setSelectedClient(null)
                  updateFilter('clientId', undefined)
                  setClientOptions(baseClientOptions)
                  return
                }

                setClientSearchQuery(newValue)
                if (selectedClient) {
                  setSelectedClient(null)
                  updateFilter('clientId', undefined)
                }
              }}
              onChange={(_, newValue) => {
                setSelectedClient(newValue)
                updateFilter('clientId', newValue?.id)
                if (newValue) {
                  setClientSearchQuery(newValue.fullName)
                } else {
                  setClientSearchQuery('')
                  setClientOptions(baseClientOptions)
                }
              }}
              loading={isSearchingClients}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Buscar cliente (mín. 2 caracteres)..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearchingClients ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={clientSearchQuery.length < 2 ? 'Escribí al menos 2 caracteres' : 'No hay clientes disponibles'}
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
        {hasActiveFilters && variant === 'expanded' && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{globalStats.total}</strong> clientes encontrados •
              Vencidas: <strong>{globalStats.overdue}</strong> •
              Hoy: <strong>{globalStats.today}</strong> •
              Pronto: <strong>{globalStats.soon}</strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}