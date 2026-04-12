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
    updateFilters,
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
      updateFilters({ clientName: undefined, clientId: undefined })
    }
  }, [searchClients, updateFilter])

  // Handle client selection - batch update to prevent double fetch
  const handleClientChange = useCallback((_event: any, newValue: ClientOption | null) => {
    setSelectedClient(newValue)
    if (newValue) {
      updateFilters({ clientId: newValue.id, clientName: newValue.fullName })
    } else {
      updateFilters({ clientId: undefined, clientName: undefined })
    }
  }, [updateFilters])

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
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: hasActiveFilters ? 1 : 0 }}>
            <FilterList sx={{ color: 'primary.main', flexShrink: 0 }} />
            <Typography variant="h6">
              Filtros
            </Typography>
            {isLoading && <CircularProgress size={16} />}
          </Box>
          {hasActiveFilters && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${filterStats.total} resultados`}
                color="primary"
                size="small"
              />
              <Button
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
              >
                Limpiar
              </Button>
            </Box>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {[
              { value: 'ALL', label: 'Todos', color: '#1976d2' },
              { value: 'ACTIVE', label: 'Activos', color: '#2e7d32' },
              { value: 'COMPLETED', label: 'Completados', color: '#757575' },
            ].map((opt) => {
              const isSelected = (filters.loanStatus || 'ALL') === opt.value
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  onClick={() => handleLoanStatusFilter(opt.value as any)}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor: isSelected ? opt.color : 'transparent',
                    color: isSelected ? 'white' : opt.color,
                    border: `1.5px solid ${opt.color}`,
                    '&:hover': { bgcolor: isSelected ? opt.color : `${opt.color}15` },
                  }}
                />
              )
            })}
          </Box>
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
