'use client'

import React, { useState } from 'react'
import {
  Paper,
  Box,
  Button,
  ButtonGroup,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip
} from '@mui/material'
import { FileDownload, FilterList, Clear } from '@mui/icons-material'
import type { TimeFilter } from '@/hooks/useOptimizedAdminDashboard'

interface AdminFiltersAndExportProps {
  // Time filters
  currentFilter: TimeFilter
  dateRange: { from: Date; to: Date }
  onFilterChange: (filter: TimeFilter) => void
  onCustomDateChange: (dateRange: { from: Date; to: Date }) => void

  // Subadmin filter
  selectedSubadmin: string | null
  subadminOptions: Array<{ id: string; name: string }>
  onSubadminChange: (subadminId: string | null) => void

  // Actions
  onExport: () => void

  // State
  isLoading?: boolean
  dataCount?: {
    totalSubadmins: number
    totalManagers: number
    totalClients: number
  }
}

const FILTER_LABELS = {
  week: 'Última Semana',
  month: 'Último Mes',
  quarter: 'Últimos 3 Meses',
  custom: 'Personalizado'
}

export default function AdminFiltersAndExport({
  currentFilter,
  dateRange,
  onFilterChange,
  onCustomDateChange,
  selectedSubadmin,
  subadminOptions,
  onSubadminChange,
  onExport,
  isLoading = false,
  dataCount
}: AdminFiltersAndExportProps) {
  const [customFrom, setCustomFrom] = useState(
    dateRange.from.toISOString().split('T')[0]
  )
  const [customTo, setCustomTo] = useState(
    dateRange.to.toISOString().split('T')[0]
  )

  const handleCustomDateSubmit = () => {
    const from = new Date(customFrom)
    const to = new Date(customTo)

    if (from > to) {
      alert('La fecha "desde" no puede ser mayor que la fecha "hasta"')
      return
    }

    onCustomDateChange({ from, to })
  }

  const clearSubadminFilter = () => {
    onSubadminChange(null)
  }

  const formatDateRange = () => {
    const from = dateRange.from.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const to = dateRange.to.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return `${from} - ${to}`
  }

  const getSelectedSubadminName = () => {
    const subadmin = subadminOptions.find(s => s.id === selectedSubadmin)
    return subadmin?.name || ''
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <FilterList color="primary" />
        <Typography variant="h6">
          Filtros y Exportación
        </Typography>
        {dataCount && (
          <Chip
            label={`${dataCount.totalSubadmins} sub-admins | ${dataCount.totalManagers} managers | ${dataCount.totalClients} clientes`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        alignItems: { xs: 'stretch', lg: 'flex-start' }
      }}>
        {/* Time Period Filters */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Período Temporal
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            {(Object.keys(FILTER_LABELS) as TimeFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={currentFilter === filter ? 'contained' : 'outlined'}
                onClick={() => onFilterChange(filter)}
                disabled={isLoading}
                sx={{ minWidth: 100 }}
              >
                {FILTER_LABELS[filter]}
              </Button>
            ))}
          </ButtonGroup>

          {/* Current Range Display */}
          {currentFilter !== 'custom' && (
            <Typography variant="caption" color="text.secondary" sx={{
              bgcolor: 'grey.100',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              textAlign: 'center'
            }}>
              {formatDateRange()}
            </Typography>
          )}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

        {/* Custom Date Range */}
        {currentFilter === 'custom' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Rango Personalizado
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                type="date"
                size="small"
                label="Desde"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleCustomDateSubmit}
                disabled={isLoading}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        )}

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

        {/* Subadmin Filter */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Filtrar por Sub-Admin
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Seleccionar Sub-Admin</InputLabel>
              <Select
                value={selectedSubadmin || ''}
                onChange={(e) => onSubadminChange(e.target.value || null)}
                label="Seleccionar Sub-Admin"
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>Todos los Sub-Admins</em>
                </MenuItem>
                {subadminOptions.map((subadmin) => (
                  <MenuItem key={subadmin.id} value={subadmin.id}>
                    {subadmin.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedSubadmin && (
              <Button
                size="small"
                onClick={clearSubadminFilter}
                startIcon={<Clear />}
                disabled={isLoading}
              >
                Limpiar
              </Button>
            )}
          </Box>
          {selectedSubadmin && (
            <Chip
              label={`Filtrado: ${getSelectedSubadminName()}`}
              size="small"
              color="primary"
              onDelete={clearSubadminFilter}
            />
          )}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: { lg: 'auto' } }}>
          <Typography variant="subtitle2" color="text.secondary">
            Exportación
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={onExport}
            disabled={isLoading}
            startIcon={<FileDownload />}
            sx={{ minWidth: 150 }}
          >
            Exportar Excel
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {selectedSubadmin
              ? 'Excel: Solo datos del sub-admin seleccionado'
              : 'Excel: Todos los datos detallados'
            }
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}