'use client'

import React, { useState, memo } from 'react'
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
import { FileDownload, FilterList, Clear, PictureAsPdf } from '@mui/icons-material'
import { DateTime } from 'luxon'
import { ensureLuxonConfigured } from '@/lib/luxon-config'
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
  onExportExcel: () => void
  onExportPdf: () => void

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

const AdminFiltersAndExport = memo(function AdminFiltersAndExport({
  currentFilter,
  dateRange,
  onFilterChange,
  onCustomDateChange,
  selectedSubadmin,
  subadminOptions,
  onSubadminChange,
  onExportExcel,
  onExportPdf,
  isLoading = false,
  dataCount
}: AdminFiltersAndExportProps) {
  // Ensure Luxon is configured (lazy loaded)
  ensureLuxonConfigured()

  const [customFrom, setCustomFrom] = useState(
    DateTime.fromJSDate(dateRange.from).toISODate() || ''
  )
  const [customTo, setCustomTo] = useState(
    DateTime.fromJSDate(dateRange.to).toISODate() || ''
  )

  const handleCustomDateSubmit = () => {
    const fromDt = DateTime.fromISO(customFrom)
    const toDt = DateTime.fromISO(customTo)

    if (!fromDt.isValid || !toDt.isValid) {
      alert('Fechas inválidas. Por favor ingrese fechas válidas.')
      return
    }

    if (fromDt > toDt) {
      alert('La fecha "desde" no puede ser mayor que la fecha "hasta"')
      return
    }

    onCustomDateChange({ from: fromDt.toJSDate(), to: toDt.toJSDate() })
  }

  const clearSubadminFilter = () => {
    onSubadminChange(null)
  }

  const formatDateRange = () => {
    const fromDt = DateTime.fromJSDate(dateRange.from)
    const toDt = DateTime.fromJSDate(dateRange.to)

    if (!fromDt.isValid || !toDt.isValid) {
      return 'Período no válido'
    }

    const from = fromDt.toLocaleString(DateTime.DATE_SHORT, { locale: 'es-AR' })
    const to = toDt.toLocaleString(DateTime.DATE_SHORT, { locale: 'es-AR' })
    return `${from} - ${to}`
  }

  const getSelectedSubadminName = () => {
    const subadmin = subadminOptions.find(s => s.id === selectedSubadmin)
    return subadmin?.name || ''
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6">
            Filtros y Exportación
          </Typography>
        </Box>
        {dataCount && (
          <Box sx={{
            width: { xs: '100%', md: 'auto' },
            display: 'flex',
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            mt: { xs: 1, md: -3 },
            ml: { md: 'auto' }
          }}>
            <Chip
              label={`${dataCount.totalSubadmins} cobradores | ${dataCount.totalManagers} prestamistas | ${dataCount.totalClients} clientes`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: { xs: '100%', lg: 'auto' } }}>
            <Typography variant="subtitle2" color="text.secondary">
              Rango Personalizado
            </Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <TextField
                type="date"
                size="medium"
                label="Desde"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: { xs: '100%', sm: 170 },
                  '& input': {
                    fontSize: { xs: '14px', sm: '13px' }
                  }
                }}
              />
              <TextField
                type="date"
                size="medium"
                label="Hasta"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: { xs: '100%', sm: 170 },
                  '& input': {
                    fontSize: { xs: '14px', sm: '13px' }
                  }
                }}
              />
              <Button
                variant="contained"
                size="medium"
                onClick={handleCustomDateSubmit}
                disabled={isLoading}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        )}

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

        {/* Cobrador Filter */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Filtrar por Cobrador
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Cobrador</InputLabel>
              <Select
                value={selectedSubadmin || ''}
                onChange={(e) => onSubadminChange(e.target.value || null)}
                label="Cobrador"
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>Todos</em>
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={onExportExcel}
              disabled={isLoading}
              startIcon={<FileDownload />}
              sx={{ minWidth: 110 }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={onExportPdf}
              disabled={isLoading}
              startIcon={<PictureAsPdf />}
              color="secondary"
              sx={{ minWidth: 110 }}
            >
              PDF
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {selectedSubadmin
              ? 'Solo datos del cobrador seleccionado'
              : 'Todos los datos detallados'
            }
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

export default AdminFiltersAndExport