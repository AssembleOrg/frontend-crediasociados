'use client'

import React, { useState } from 'react'
import {
  Paper,
  Box,
  Button,
  ButtonGroup,
  TextField,
  Typography,
  Divider
} from '@mui/material'
import { Refresh, CalendarToday } from '@mui/icons-material'
import type { TimeFilter } from '@/hooks/useAdminChartData'

interface TemporalFiltersProps {
  currentFilter: TimeFilter
  dateRange: { from: Date; to: Date }
  isLoading?: boolean
  onFilterChange: (filter: TimeFilter) => void
  onCustomDateChange: (dateRange: { from: Date; to: Date }) => void
  onRefresh: () => void
}

const FILTER_LABELS = {
  week: 'Última Semana',
  month: 'Último Mes',
  quarter: 'Últimos 3 Meses',
  custom: 'Personalizado'
}

export default function TemporalFilters({
  currentFilter,
  dateRange,
  isLoading = false,
  onFilterChange,
  onCustomDateChange,
  onRefresh
}: TemporalFiltersProps) {
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

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 3
      }}>
        {/* Filter Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Período
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
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

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
                startIcon={<CalendarToday />}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        )}

        {/* Current Range Display */}
        {currentFilter !== 'custom' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Rango Actual
            </Typography>
            <Typography variant="body2" sx={{
              bgcolor: 'grey.100',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontFamily: 'monospace'
            }}>
              {formatDateRange()}
            </Typography>
          </Box>
        )}

        {/* Refresh Button */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onRefresh}
            disabled={isLoading}
            startIcon={<Refresh />}
          >
            Actualizar
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}