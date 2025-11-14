'use client'

import React, { useState, useMemo } from 'react'
import { 
  Box, 
  Alert, 
  CircularProgress, 
  Typography, 
  Paper,
  Autocomplete,
  TextField,
  Divider
} from '@mui/material'
import { People, Assessment } from '@mui/icons-material'
import { useUsers } from '@/hooks/useUsers'
import CollectorReportView from '@/components/reports/CollectorReportView'
import PageHeader from '@/components/ui/PageHeader'

export default function SubadminAnalyticsPage() {
  const { users, isLoading } = useUsers()
  const [selectedManager, setSelectedManager] = useState<string | null>(null)

  // Filter managers (prestamistas)
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
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Reportes de Cobradores"
        subtitle="Consulta los reportes detallados de tus cobradores"
      />

      {/* Manager Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Assessment sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Selecciona un Cobrador
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        {managers.length === 0 ? (
          <Alert severity="info">
            No hay cobradores registrados aún. Crea un cobrador desde la sección "Cobradores" para ver sus reportes.
          </Alert>
        ) : (
          <Autocomplete
            options={managers}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            value={selectedManagerData || null}
            onChange={(_, newValue) => setSelectedManager(newValue?.id || null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar cobrador"
                placeholder="Escribe el nombre o email del cobrador"
                variant="outlined"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {option.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText="No se encontraron cobradores"
          />
        )}
      </Paper>

      {/* Report View */}
      {selectedManager ? (
        <CollectorReportView
          managerId={selectedManager}
          title={`Reporte de ${selectedManagerData?.fullName || 'Cobrador'}`}
          subtitle={`Selecciona un día o un rango de fechas para ver el reporte de ${selectedManagerData?.fullName || 'este cobrador'}`}
        />
      ) : managers.length > 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecciona un cobrador para ver su reporte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usa el selector de arriba para elegir un cobrador y consultar sus reportes semanales
          </Typography>
        </Paper>
      ) : null}
    </Box>
  )
}