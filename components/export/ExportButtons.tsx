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
  TableChart,
  Download,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useExport } from '@/hooks/useExport';

interface ExportButtonsProps {
  loanId?: string;
  filteredLoans?: { id: string }[]; // When filters are active, export only these loans
  variant?: 'default' | 'compact' | 'fab';
  showLabels?: boolean;
  className?: string;
}

/**
 * ExportButtons Component
 * Following ARCHITECTURE_PATTERNS.md - Components layer
 * 
 * Pure render component with export actions
 * Only handles UI interactions, delegates business logic to hook
 */
export function ExportButtons({ 
  loanId, 
  filteredLoans,
  variant = 'default',
  showLabels = true,
  className 
}: ExportButtonsProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const {
    exportStatus,
    exportError,
    isExporting,
    exportLoanToPDF,
    exportAllLoansToExcel,
    exportLoansToExcel,
    getStatusMessage,
    canExport,
    resetExportState
  } = useExport();

  const handlePDFExport = async () => {
    if (!loanId || !canExport(loanId)) return;
    
    const success = await exportLoanToPDF(loanId);
    if (success) {
      setShowSnackbar(true);
      setTimeout(resetExportState, 2000);
    }
  };

  const handleExcelExport = async () => {
    let success: boolean;
    
    if (filteredLoans && filteredLoans.length > 0) {
      // Export only filtered loans
      const loanIds = filteredLoans.map(loan => loan.id);
      success = await exportLoansToExcel(loanIds);
    } else {
      // Export all loans
      success = await exportAllLoansToExcel();
    }
    
    if (success) {
      setShowSnackbar(true);
      setTimeout(resetExportState, 2000);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
    resetExportState();
  };

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

  // Compact variant (icon buttons only)
  if (variant === 'compact') {
    return (
      <Box className={className} sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Exportar PDF">
          <span>
            <Button
              variant="outlined"
              size="small"
              onClick={handlePDFExport}
              disabled={!loanId || !canExport(loanId)}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              <PictureAsPdf fontSize="small" />
            </Button>
          </span>
        </Tooltip>
        
        <Tooltip title={filteredLoans && filteredLoans.length > 0 
          ? `Exportar ${filteredLoans.length} préstamos filtrados a Excel`
          : "Exportar todos los préstamos a Excel"
        }>
          <span>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExcelExport}
              disabled={!canExport()}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              <TableChart fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  }

  // Default variant (full buttons)
  return (
    <Box className={className}>
      {loanId ? (
        // Single loan: show both PDF and Excel
        <ButtonGroup variant="outlined" size="medium">
          <Tooltip title="Generar presupuesto en PDF">
            <span>
              <Button
                startIcon={<PictureAsPdf />}
                onClick={handlePDFExport}
                disabled={!canExport(loanId)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.50',
                    borderColor: 'error.main',
                    color: 'error.main'
                  }
                }}
              >
                {showLabels ? 'Exportar PDF' : ''}
              </Button>
            </span>
          </Tooltip>
          
          <Tooltip title={filteredLoans && filteredLoans.length > 0 
            ? `Exportar ${filteredLoans.length} préstamos filtrados a Excel`
            : "Exportar todos los préstamos a Excel"
          }>
            <span>
              <Button
                startIcon={<TableChart />}
                onClick={handleExcelExport}
                disabled={!canExport()}
                sx={{
                  '&:hover': {
                    backgroundColor: 'success.50',
                    borderColor: 'success.main',
                    color: 'success.main'
                  }
                }}
              >
                {showLabels ? 'Exportar Excel' : ''}
              </Button>
            </span>
          </Tooltip>
        </ButtonGroup>
      ) : (
        // No specific loan: show only Excel
        <Tooltip title={filteredLoans && filteredLoans.length > 0 
          ? `Exportar ${filteredLoans.length} préstamos filtrados a Excel`
          : "Exportar todos los préstamos a Excel"
        }>
          <span>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={handleExcelExport}
              disabled={!canExport()}
              sx={{
                '&:hover': {
                  backgroundColor: 'success.50',
                  borderColor: 'success.main',
                  color: 'success.main'
                }
              }}
            >
              {showLabels ? 'Exportar Excel' : ''}
            </Button>
          </span>
        </Tooltip>
      )}

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