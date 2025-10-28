'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Alert, Tabs, Tab, Chip } from '@mui/material';
import PageHeader from '@/components/ui/PageHeader';
import { useSubLoans } from '@/hooks/useSubLoans';
import LoanTimeline from '@/components/loans/LoanTimeline';
import type { SubLoanWithClientInfo } from '@/services/subloans-lookup.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CobradorCobrosPage() {
  const { allSubLoansWithClient, isLoading, error } = useSubLoans();
  const [selectedTab, setSelectedTab] = useState(0);

  // Group subloans by client (simplificado - sin manager tracking)
  const clientsWithLoans = useMemo(() => {
    const grouped: Record<
      string,
      {
        clientId: string;
        clientName: string;
        subLoans: SubLoanWithClientInfo[];
      }
    > = {};

    allSubLoansWithClient.forEach((subloan) => {
      const clientId = subloan.clientId || 'unknown';
      const clientName = subloan.clientName || 'Cliente Desconocido';

      if (!grouped[clientId]) {
        grouped[clientId] = {
          clientId,
          clientName,
          subLoans: [],
        };
      }

      grouped[clientId].subLoans.push(subloan);
    });

    return Object.values(grouped);
  }, [allSubLoansWithClient]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Reportes de Cobros'
          subtitle='Vista informativa de cobros por cobrador'
        />
        <Typography
          variant='body1'
          color='text.secondary'
          sx={{ mt: 3 }}
        >
          Cargando datos de cobros...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Reportes de Cobros'
          subtitle='Vista informativa de cobros por cobrador'
        />
        <Alert
          severity='error'
          sx={{ mt: 3 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Reportes de Cobros'
        subtitle='Vista informativa de cobros por cobrador'
      />

      {clientsWithLoans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            variant='h6'
            color='text.secondary'
          >
            No hay datos de cobros disponibles
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            Los cobros aparecerán aquí cuando tus cobradores registren pagos
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 0 }}>
          {/* Tabs for each client */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              variant='scrollable'
              scrollButtons='auto'
              sx={{ px: 2 }}
            >
              {clientsWithLoans.map((client, index) => (
                <Tab
                  key={client.clientId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {client.clientName}
                      <Chip
                        label={client.subLoans.length}
                        size='small'
                        color='primary'
                      />
                    </Box>
                  }
                  id={`client-tab-${index}`}
                  aria-controls={`client-tabpanel-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          {clientsWithLoans.map((client, index) => (
            <TabPanel
              key={client.clientId}
              value={selectedTab}
              index={index}
            >
              <Box sx={{ px: 3 }}>
                <Typography
                  variant='h6'
                  gutterBottom
                >
                  {client.clientName}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 3 }}
                >
                  Total de cuotas: {client.subLoans.length}
                </Typography>

                {/* Timeline for client loans */}
                <Box sx={{ mb: 2 }}>
                  <LoanTimeline
                    clientName={client.clientName}
                    subLoans={client.subLoans}
                    compact={false}
                  />
                </Box>
              </Box>
            </TabPanel>
          ))}
        </Paper>
      )}
    </Box>
  );
}
