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
  TextField
} from '@mui/material'
import { 
  FilterList, 
  Clear
} from '@mui/icons-material'
import { useLoansFilters } from '@/hooks/useLoansFilters'
import { getFrequencyLabel } from '@/lib/formatters'

interface LoansFilterPanelProps {
  variant?: 'expanded' | 'compact'
  onClose?: () => void
}

export function LoansFilterPanel({ variant = 'expanded', onClose }: LoansFilterPanelProps) {
  const {
    filters,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    clearAllFilters
  } = useLoansFilters()

  const handleClearFilters = () => {
    clearAllFilters()
    onClose?.()
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
          {/* Client Filter */}
          <Box>
            <Autocomplete
              size="small"
              options={filterOptions.clients}
              getOptionLabel={(option) => option.label}
              value={filterOptions.clients.find(c => c.value === filters.clientId) || null}
              onChange={(_, newValue) => {
                updateFilter('clientId', newValue?.value)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Seleccionar cliente..."
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