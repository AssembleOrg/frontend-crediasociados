'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress
} from '@mui/material'
import { 
  FilterList, 
  Clear
} from '@mui/icons-material'
import { useLoansFilters } from '@/hooks/useLoansFilters'
import { clientsService } from '@/services/clients.service'
import { useState, useCallback, useMemo } from 'react'

interface LoansFilterPanelProps {
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

export function LoansFilterPanel({ variant: _variant = 'expanded', onClose }: LoansFilterPanelProps) {
  const {
    filters,
    filterOptions,
    filterStats,
    hasActiveFilters,
    isLoading,
    updateFilter,
    clearAllFilters
  } = useLoansFilters()

  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)

  // Search clients asynchronously
  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setClientOptions([])
      return
    }

    setIsSearchingClients(true)
    try {
      const results = await clientsService.searchClients(query, 20)
      setClientOptions(results)
    } catch (error) {
      console.error('Error searching clients:', error)
      setClientOptions([])
    } finally {
      setIsSearchingClients(false)
    }
  }, [])

  // Handle client search input change
  const handleClientInputChange = useCallback((_event: any, newValue: string) => {
    setClientSearchQuery(newValue)
    if (newValue.length >= 2) {
      searchClients(newValue)
    } else {
      setClientOptions([])
      setSelectedClient(null)
      updateFilter('clientName', undefined)
      updateFilter('clientId', undefined)
    }
  }, [searchClients, updateFilter])

  // Handle client selection
  const handleClientChange = useCallback((_event: any, newValue: ClientOption | null) => {
    setSelectedClient(newValue)
    if (newValue) {
      updateFilter('clientId', newValue.id)
      updateFilter('clientName', newValue.fullName)
    } else {
      updateFilter('clientId', undefined)
      updateFilter('clientName', undefined)
    }
  }, [updateFilter])

  // Initialize selected client from filter
  useMemo(() => {
    if (filters.clientId && filters.clientName && !selectedClient) {
      setSelectedClient({
        id: filters.clientId,
        fullName: filters.clientName,
        dni: null,
        phone: null,
        email: null
      })
      setClientSearchQuery(filters.clientName)
    } else if (!filters.clientId && selectedClient) {
      setSelectedClient(null)
      setClientSearchQuery('')
    }
  }, [filters.clientId, filters.clientName, selectedClient])

  const handleClearFilters = () => {
    clearAllFilters()
    setClientSearchQuery('')
    setSelectedClient(null)
    setClientOptions([])
    onClose?.()
  }

  const handleLoanStatusFilter = (loanStatus: 'ACTIVE' | 'COMPLETED' | 'ALL' | null) => {
    updateFilter('loanStatus', loanStatus || undefined)
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Filtros de Préstamos
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${filterStats.total} resultados`}
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
            {isLoading && (
              <CircularProgress size={16} sx={{ ml: 2 }} />
            )}
          </Box>
          {hasActiveFilters && (
            <Button
              startIcon={<Clear />}
              onClick={handleClearFilters}
              size="small"
            >
              Limpiar
            </Button>
          )}
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)' 
          }, 
          gap: 2 
        }}>
          {/* Client Filter - Async Search */}
          <Box>
            <Autocomplete
              size="small"
              options={clientOptions}
              getOptionLabel={(option) => option.fullName || ''}
              value={selectedClient}
              inputValue={clientSearchQuery}
              onInputChange={handleClientInputChange}
              onChange={handleClientChange}
              loading={isSearchingClients}
              filterOptions={(x) => x} // Disable client-side filtering, we use server-side
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Buscar por nombre (mín. 2 caracteres)..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearchingClients ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* Payment Frequency */}
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Frecuencia</InputLabel>
              <Select
                value={filters.paymentFrequency || ''}
                onChange={(e) => updateFilter('paymentFrequency', e.target.value || undefined)}
                label="Frecuencia"
              >
                <MenuItem value="">
                  <em>Todas las frecuencias</em>
                </MenuItem>
                {filterOptions.paymentFrequencies.map((freq) => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Loan Status Filter */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Estado del Préstamo
          </Typography>
          <ToggleButtonGroup
            value={filters.loanStatus || 'ALL'}
            exclusive
            onChange={(_, value) => handleLoanStatusFilter(value)}
            size="small"
            fullWidth
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: '1px solid',
                px: 2,
                py: 1,
                flex: '1 1 auto',
                minWidth: 'auto'
              }
            }}
          >
            <ToggleButton
              value="ALL"
              sx={{
                color: 'primary.main',
                borderColor: 'primary.main',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              Todos
            </ToggleButton>
            <ToggleButton
              value="ACTIVE"
              sx={{
                color: 'info.main',
                borderColor: 'info.main',
                '&.Mui-selected': {
                  backgroundColor: 'info.main',
                  color: 'white'
                }
              }}
            >
              Activo
            </ToggleButton>
            <ToggleButton
              value="COMPLETED"
              sx={{
                color: 'success.main',
                borderColor: 'success.main',
                '&.Mui-selected': {
                  backgroundColor: 'success.main',
                  color: 'white'
                }
              }}
            >
              Completado
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{filterStats.total}</strong> préstamos encontrados • 
              Monto total: <strong>${filterStats.totalAmount.toLocaleString('es-AR')}</strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
