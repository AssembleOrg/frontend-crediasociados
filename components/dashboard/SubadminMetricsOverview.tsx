'use client'

import React from 'react'
import { Grid, Box } from '@mui/material'
import { People, PersonOutline, AccountBalance, AttachMoney } from '@mui/icons-material'
import { StatsCard } from '@/components/dashboard/StatsCard'
import type { SubadminAnalytics } from '@/services/analytics.service'

interface AsociadoMetricsOverviewProps {
  analytics: SubadminAnalytics | null
  isLoading?: boolean
}

export default function AsociadoMetricsOverview({ analytics, isLoading = false }: AsociadoMetricsOverviewProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Cobradores"
            value={analytics?.totalManagers || 0}
            subtitle="cobradores bajo tu gestión"
            icon={<People />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Clientes"
            value={analytics?.totalClients || 0}
            subtitle="clientes activos"
            icon={<PersonOutline />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Préstamos"
            value={analytics?.totalLoans || 0}
            subtitle="préstamos activos"
            icon={<AccountBalance />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Dinero Prestado"
            value={`$${(analytics?.totalAmountLent || 0).toLocaleString()}`}
            subtitle="total en circulación"
            icon={<AttachMoney />}
            color="warning"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  )
}