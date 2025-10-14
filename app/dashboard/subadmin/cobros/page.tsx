'use client'

import { useState, useMemo } from 'react'
import { 
  Box, 
  Typography, 
  Paper,
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material'
import { Info } from '@mui/icons-material'
import PageHeader from '@/components/ui/PageHeader'
import { useSubLoans } from '@/hooks/useSubLoans'
import { useAuth } from '@/hooks/useAuth'
import LoanTimeline from '@/components/loans/LoanTimeline'
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function CobradorCobrosPage() {
  const { user } = useAuth()
  const { allSubLoansWithClient, isLoading, error } = useSubLoans()
  const [selectedTab, setSelectedTab] = useState(0)

  // Group subloans by manager (prestamista)
  const subLoansByManager = useMemo(() => {
    const grouped: Record<string, {
      managerId: string
      managerName: string
      subLoans: SubLoanWithClientInfo[]
    }> = {}

    allSubLoansWithClient.forEach(subloan => {
      const managerId = subloan.managerId || 'unknown'
      const managerName = subloan.managerName || 'Cobrador Desconocido'

      if (!grouped[managerId]) {
        grouped[managerId] = {
          managerId,
          managerName,
          subLoans: []
        }
      }

      grouped[managerId].subLoans.push(subloan)
    })

    return Object.values(grouped)
  }, [allSubLoansWithClient])

  // Group subloans by client for timeline display
  const getSubLoansByClient = (managerSubLoans: SubLoanWithClientInfo[]) => {
    const grouped: Record<string, SubLoanWithClientInfo[]> = {}

    managerSubLoans.forEach(subloan => {
      const clientId = subloan.clientId || 'unknown'
      if (!grouped[clientId]) {
        grouped[clientId] = []
      }
      grouped[clientId].push(subloan)
    })

    return Object.values(grouped)
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Reportes de Cobros"
          subtitle="Vista informativa de cobros por cobrador"
        />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          Cargando datos de cobros...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Reportes de Cobros"
          subtitle="Vista informativa de cobros por cobrador"
        />
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Reportes de Cobros"
        subtitle="Vista informativa de cobros por cobrador"
      />

  
      {subLoansByManager.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No hay datos de cobros disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los cobros aparecerán aquí cuando tus cobradores registren pagos
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 0 }}>
          {/* Tabs for each manager */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedTab} 
              onChange={(_, newValue) => setSelectedTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2 }}
            >
              {subLoansByManager.map((manager, index) => (
                <Tab 
                  key={manager.managerId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {manager.managerName}
                      <Chip 
                        label={manager.subLoans.length} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  }
                  id={`manager-tab-${index}`}
                  aria-controls={`manager-tabpanel-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          {subLoansByManager.map((manager, index) => {
            const clientGroups = getSubLoansByClient(manager.subLoans)

            return (
              <TabPanel key={manager.managerId} value={selectedTab} index={index}>
                <Box sx={{ px: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Cobros de {manager.managerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Total de cuotas: {manager.subLoans.length}
                  </Typography>

                  {/* Timeline for each client */}
                  {clientGroups.map((clientSubLoans, clientIndex) => {
                    const clientName = clientSubLoans[0]?.clientName || 'Cliente Desconocido'
                    
                    return (
                      <Box key={clientIndex} sx={{ mb: 4 }}>
                        <LoanTimeline
                          clientName={clientName}
                          subLoans={clientSubLoans}
                          compact={false}
                        />
                      </Box>
                    )
                  })}
                </Box>
              </TabPanel>
            )
          })}
        </Paper>
      )}
    </Box>
  )
}

