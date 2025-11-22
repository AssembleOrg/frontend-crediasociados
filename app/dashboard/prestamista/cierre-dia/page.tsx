'use client'

import React, { useState } from 'react'
import { Box, Grid, Typography, Card, CardContent } from '@mui/material'
import { Add, Receipt } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import CreateClosureModal from '@/components/closures/CreateClosureModal'
import ClosureHistoryTable from '@/components/closures/ClosureHistoryTable'

export default function DailyClosurePage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Cierre del Día"
        subtitle="Registra cobros y gastos del día"
        actions={[
          {
            label: 'Nuevo Cierre',
            onClick: () => setCreateModalOpen(true),
            variant: 'contained',
            startIcon: <Add />
          }
        ]}
      />

      <Grid container spacing={3}>
        {/* Instructions Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Receipt color="info" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main' }}>
                  ¿Cómo usar?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Usa esta sección para registrar el cierre del día. Ingresa el monto total cobrado, categoriza los gastos (combustible, consumo, reparaciones, otros) y guarda el registro. Podrás ver todo el historial y descargar reportes.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* History Table */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Historial de Cierres
          </Typography>
          <ClosureHistoryTable
            refreshTrigger={refreshTrigger}
            onViewDetail={(closure) => {
              // View detail
              // TODO: Abrir modal de detalle
            }}
          />
        </Grid>
      </Grid>

      {/* Create Modal */}
      <CreateClosureModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  )
}
