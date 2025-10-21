'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  PictureAsPdf,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useExport } from '@/hooks/useExport';

interface SubLoan {
  paymentNumber: number;
  amount: number;
  totalAmount: number;
  dueDate: Date;
}

interface SimulationExportButtonsProps {
  simulatedLoans: SubLoan[];
  formData: {
    clientId: string;
    amount: string;
    baseInterestRate: string;
    paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    totalPayments: string;
    firstDueDate: Date | null;
    description: string;
  };
  clientName?: string;
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export function SimulationExportButtons({
  simulatedLoans,
  formData,
  clientName = 'Cliente',
  variant = 'default',
  showLabels = true,
  className
}: SimulationExportButtonsProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const {
    exportStatus,
    exportError,
    isExporting,
    exportSimulationToPDF,
    getStatusMessage,
    resetExportState
  } = useExport();

  const handlePDFExport = async () => {
    if (simulatedLoans.length === 0) return;
    
    const success = await exportSimulationToPDF(simulatedLoans, formData, clientName);
    if (success) {
      setShowSnackbar(true);
      setTimeout(resetExportState, 2000);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
    resetExportState();
  };

  const canExportSimulation = simulatedLoans.length > 0 && formData.clientId && formData.amount;

  // Render loading state
  if (isExporting) {
    return (
      <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {getStatusMessage()}
        </Box>
      </Box>
    );
  }

  // Render error state
  if (exportStatus === 'error') {
    return (
      <Alert 
        severity="error" 
        icon={<ErrorIcon />}
        action={
          <Button size="small" onClick={resetExportState}>
            Reintentar
          </Button>
        }
        sx={{ mb: 2 }}
      >
        {exportError}
      </Alert>
    );
  }

  // Compact variant (icon button only)
  if (variant === 'compact') {
    return (
      <Box className={className} sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Exportar Presupuesto PDF">
          <span>
            <Button
              variant="outlined"
              size="small"
              onClick={handlePDFExport}
              disabled={!canExportSimulation}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              <PictureAsPdf fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  }

  // Default variant (full button)
  return (
    <Box className={className}>
      <ButtonGroup variant="outlined" size="medium">
        <Tooltip title="Generar presupuesto en PDF para enviar al cliente">
          <span>
            <Button
              startIcon={<PictureAsPdf />}
              onClick={handlePDFExport}
              disabled={!canExportSimulation}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.50',
                  borderColor: 'error.main',
                  color: 'error.main'
                }
              }}
            >
              {showLabels ? 'Generar Presupuesto' : ''}
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar && exportStatus === 'completed'}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success"
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          {getStatusMessage()}
        </Alert>
      </Snackbar>
    </Box>
  );
}