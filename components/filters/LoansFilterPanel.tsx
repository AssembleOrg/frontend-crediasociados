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
} from '@mui/material'
import { 
  FilterList, 
  Clear
} from '@mui/icons-material'
import { useLoansFilters } from '@/hooks/useLoansFilters'

interface LoansFilterPanelProps {
  variant?: 'expanded' | 'compact'
  onClose?: () => void
}

export function LoansFilterPanel({ variant: _variant = 'expanded', onClose }: LoansFilterPanelProps) {
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

  const handleLoanStatusFilter = (loanStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL' | null) => {
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

        {/* Loan Status Filter */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5, fontWeight: 600 }}>
            Estado de Cuotas
          </Typography>
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Chip
              label="Todos"
              onClick={() => handleLoanStatusFilter('ALL')}
              color={filters.loanStatus === 'ALL' || !filters.loanStatus ? 'primary' : 'default'}
              variant={filters.loanStatus === 'ALL' || !filters.loanStatus ? 'filled' : 'outlined'}
              sx={{
                fontWeight: filters.loanStatus === 'ALL' || !filters.loanStatus ? 600 : 400,
                cursor: 'pointer'
              }}
            />
            <Chip
              label="Pendiente"
              onClick={() => handleLoanStatusFilter('PENDING')}
              color={filters.loanStatus === 'PENDING' ? 'warning' : 'default'}
              variant={filters.loanStatus === 'PENDING' ? 'filled' : 'outlined'}
              sx={{
                fontWeight: filters.loanStatus === 'PENDING' ? 600 : 400,
                cursor: 'pointer'
              }}
            />
            <Chip
              label="Pago Parcial"
              onClick={() => handleLoanStatusFilter('PARTIAL')}
              color={filters.loanStatus === 'PARTIAL' ? 'info' : 'default'}
              variant={filters.loanStatus === 'PARTIAL' ? 'filled' : 'outlined'}
              sx={{
                fontWeight: filters.loanStatus === 'PARTIAL' ? 600 : 400,
                cursor: 'pointer'
              }}
            />
            <Chip
              label="Pagado"
              onClick={() => handleLoanStatusFilter('PAID')}
              color={filters.loanStatus === 'PAID' ? 'success' : 'default'}
              variant={filters.loanStatus === 'PAID' ? 'filled' : 'outlined'}
              sx={{
                fontWeight: filters.loanStatus === 'PAID' ? 600 : 400,
                cursor: 'pointer'
              }}
            />
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