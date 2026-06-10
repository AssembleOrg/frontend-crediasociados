'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  Button,
  SwipeableDrawer,
  Autocomplete,
  TextField,
} from '@mui/material'
import { People, ExpandMore, Assessment } from '@mui/icons-material'
import { useUsers } from '@/hooks/useUsers'
import CollectorReportView from '@/components/reports/CollectorReportView'
import PageHeader from '@/components/ui/PageHeader'

export default function SubadminAnalyticsPage() {
  const { users, isLoading } = useUsers()
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [collectorDrawerOpen, setCollectorDrawerOpen] = useState(false)

  const managers = useMemo(() => {
    return users.filter(user => user.role === 'prestamista')
  }, [users])
  const selectedManagerData = managers.find(m => m.id === selectedManager)

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Cargando cobradores...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: '#F2F2F7' }}>
      <PageHeader
        title="Reportes de Cobradores"
        subtitle="Consulta los reportes detallados de tus cobradores"
      />

      {/* Pill selector de cobrador */}
      <Box sx={{ mb: 2 }}>
        {managers.length === 0 ? (
          <Alert severity="info">
            No hay cobradores registrados aún. Crea un cobrador desde la sección "Cobradores" para ver sus reportes.
          </Alert>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<People sx={{ fontSize: 16 }} />}
            endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
            onClick={() => setCollectorDrawerOpen(true)}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 2 }}
          >
            {selectedManagerData?.fullName ?? 'Seleccionar cobrador'}
          </Button>
        )}
      </Box>

      {/* BottomSheet selector */}
      <SwipeableDrawer
        anchor="bottom"
        open={collectorDrawerOpen}
        onOpen={() => setCollectorDrawerOpen(true)}
        onClose={() => setCollectorDrawerOpen(false)}
        PaperProps={{
          sx: { borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' }
        }}
      >
        <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Seleccionar cobrador
          </Typography>
          <Autocomplete
            options={managers}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            value={selectedManagerData || null}
            onChange={(_, newValue) => {
              setSelectedManager(newValue?.id || null)
              setCollectorDrawerOpen(false)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar cobrador"
                placeholder="Escribe el nombre o email del cobrador"
                variant="outlined"
                autoFocus
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {option.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )
            }}
            noOptionsText="No se encontraron cobradores"
          />
        </Box>
      </SwipeableDrawer>

      {/* Report View */}
      {selectedManager ? (
        <CollectorReportView
          managerId={selectedManager}
          title={`Reporte de ${selectedManagerData?.fullName || 'Cobrador'}`}
          subtitle={`Selecciona un día o un rango de fechas para ver el reporte de ${selectedManagerData?.fullName || 'este cobrador'}`}
        />
      ) : managers.length > 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecciona un cobrador para ver su reporte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usa el selector de arriba para elegir un cobrador y consultar sus reportes
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}
