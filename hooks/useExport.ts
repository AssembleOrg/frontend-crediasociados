import { useState, useCallback } from 'react';
import { exportService } from '@/services/export.service';
import { useLoans } from '@/hooks/useLoans';
import { useClients } from '@/hooks/useClients';
import { useSubLoans } from '@/hooks/useSubLoans';
import type { ExportLoanData, ExportFormat, ExportStatus } from '@/types/export';

/**
 * useExport Hook - Business Logic Layer
 * Following ARCHITECTURE_PATTERNS.md - Hooks layer
 * 
 * Responsibilities:
 * - Orchestrate data fetching from multiple sources
 * - Coordinate with export service
 * - Manage export state and loading
 * - Handle errors and user feedback
 */
export function useExport() {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  
  const { getLoanById } = useLoans();
  const { clients } = useClients();
  const { allSubLoans } = useSubLoans();

  /**
   * Export single loan as PDF presupuesto
   */
  const exportLoanToPDF = useCallback(async (loanId: string, filename?: string): Promise<boolean> => {
    try {
      setExportStatus('generating');
      setExportError(null);

      // Orchestrate data gathering
      const loan = getLoanById(loanId);
      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      const client = clients.find(c => c.id === loan.clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      const subLoans = allSubLoans.filter(sl => sl.loanId === loanId);
      if (subLoans.length === 0) {
        throw new Error('No se encontraron cuotas para este préstamo');
      }

      // Use same logic as simulator and modal: amount * (1 + rate)
      // Get the real interest rate from the loan data (already fixed in transforms.ts)
      const baseRate = loan.baseInterestRate && loan.baseInterestRate > 0
        ? (loan.baseInterestRate > 1 ? loan.baseInterestRate / 100 : loan.baseInterestRate)
        : 0;
      
      // Calculate total amount like simulator
      const calculatedTotalAmount = loan.amount * (1 + baseRate);
      const calculatedTotalInterest = calculatedTotalAmount - loan.amount;
      
      // Use calculated values instead of subloans values
      const totalAmount = calculatedTotalAmount;
      const totalInterest = calculatedTotalInterest;
      
      // Keep loan as-is, no need to modify baseInterestRate
      const loanWithCorrectRate = loan;

      const exportData: ExportLoanData = {
        loan: loanWithCorrectRate,
        client,
        subLoans,
        totalAmount,
        totalInterest,
        totalPayments: subLoans.length
      };

      setExportStatus('downloading');
      
      // Generate PDF
      const pdfBlob = await exportService.generateLoanPDF(exportData);
      
      // Download file
      const defaultFilename = `prestamo-${loan.loanTrack || loan.id}-presupuesto`;
      exportService.downloadFile(pdfBlob, filename || defaultFilename, 'pdf');
      
      setExportStatus('completed');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar PDF';
      setExportError(errorMessage);
      setExportStatus('error');
      console.error('Error exporting loan to PDF:', error);
      return false;
    }
  }, [getLoanById, clients, allSubLoans]);

  /**
   * Export multiple loans to Excel
   */
  const exportLoansToExcel = useCallback(async (loanIds: string[], filename?: string): Promise<boolean> => {
    try {
      setExportStatus('generating');
      setExportError(null);

      const exportDataArray: ExportLoanData[] = [];

      // Process each loan
      for (const loanId of loanIds) {
        const loan = getLoanById(loanId);
        if (!loan) continue;

        const client = clients.find(c => c.id === loan.clientId);
        if (!client) continue;

        const subLoans = allSubLoans.filter(sl => sl.loanId === loanId);
        
        // Use same logic as simulator and modal: amount * (1 + rate)
        const baseRate = loan.baseInterestRate && loan.baseInterestRate > 0
          ? (loan.baseInterestRate > 1 ? loan.baseInterestRate / 100 : loan.baseInterestRate)
          : 0;
        
        // Calculate total amount like simulator
        const calculatedTotalAmount = loan.amount * (1 + baseRate);
        const calculatedTotalInterest = calculatedTotalAmount - loan.amount;
        
        // Use calculated values
        const totalAmount = calculatedTotalAmount;
        const totalInterest = calculatedTotalInterest;
        
        // Keep loan as-is
        const loanWithCorrectRate = loan;

        exportDataArray.push({
          loan: loanWithCorrectRate,
          client,
          subLoans,
          totalAmount,
          totalInterest,
          totalPayments: subLoans.length
        });
      }

      if (exportDataArray.length === 0) {
        throw new Error('No hay datos válidos para exportar');
      }

      setExportStatus('downloading');

      // Generate Excel
      const excelBlob = await exportService.generateLoansExcel(exportDataArray);
      
      // Download file
      const defaultFilename = `prestamos-${new Date().toISOString().split('T')[0]}`;
      exportService.downloadFile(excelBlob, filename || defaultFilename, 'excel');
      
      setExportStatus('completed');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar Excel';
      setExportError(errorMessage);
      setExportStatus('error');
      console.error('Error exporting loans to Excel:', error);
      return false;
    }
  }, [getLoanById, clients, allSubLoans]);

  /**
   * Export all loans to Excel
   */
  const exportAllLoansToExcel = useCallback(async (filename?: string): Promise<boolean> => {
    const allLoanIds = allSubLoans.map(sl => sl.loanId).filter((id, index, arr) => arr.indexOf(id) === index);
    return exportLoansToExcel(allLoanIds, filename);
  }, [allSubLoans, exportLoansToExcel]);

  /**
   * Export loan simulation as PDF presupuesto
   * For use with simulation data before loan creation
   */
  const exportSimulationToPDF = useCallback(async (
    simulatedLoans: { paymentNumber: number; amount: number; totalAmount: number; dueDate: Date }[],
    formData: {
      clientId: string;
      amount: string;
      baseInterestRate: string;
      paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      totalPayments: string;
      firstDueDate: Date | null;
      description: string;
    },
    clientName?: string,
    filename?: string
  ): Promise<boolean> => {
    try {
      setExportStatus('generating');
      setExportError(null);

      const client = clients.find(c => c.id === formData.clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      // Calculate totals from simulation
      const totalAmount = simulatedLoans.reduce((sum, loan) => sum + loan.totalAmount, 0);
      const principalAmount = parseFloat(formData.amount);
      const totalInterest = totalAmount - principalAmount;

      // Create mock loan data for export
      const mockLoan = {
        id: 'simulation',
        loanTrack: 'PRESUPUESTO',
        amount: principalAmount,
        baseInterestRate: parseFloat(formData.baseInterestRate),
        paymentFrequency: formData.paymentFrequency,
        numberOfInstallments: parseInt(formData.totalPayments),
        startDate: formData.firstDueDate?.toISOString() || new Date().toISOString(),
        description: formData.description,
        clientId: formData.clientId,
        status: 'SIMULATION'
      };

      // Transform simulation data to SubLoan format
      const mockSubLoans = simulatedLoans.map(sim => ({
        id: `sim-${sim.paymentNumber}`,
        loanId: 'simulation',
        paymentNumber: sim.paymentNumber,
        amount: sim.amount,
        totalAmount: sim.totalAmount,
        dueDate: sim.dueDate.toISOString(),
        status: 'PENDING'
      }));

      const exportData: ExportLoanData = {
        loan: mockLoan as any,
        client,
        subLoans: mockSubLoans as any,
        totalAmount,
        totalInterest,
        totalPayments: simulatedLoans.length
      };

      setExportStatus('downloading');
      
      // Generate PDF
      const pdfBlob = await exportService.generateLoanPDF(exportData);
      
      // Download file
      const defaultFilename = `presupuesto-${client.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
      exportService.downloadFile(pdfBlob, filename || defaultFilename, 'pdf');
      
      setExportStatus('completed');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar presupuesto PDF';
      setExportError(errorMessage);
      setExportStatus('error');
      console.error('Error exporting simulation to PDF:', error);
      return false;
    }
  }, [clients]);

  /**
   * Reset export state
   */
  const resetExportState = useCallback(() => {
    setExportStatus('idle');
    setExportError(null);
  }, []);

  /**
   * Get export status message for UI
   */
  const getStatusMessage = useCallback((): string => {
    switch (exportStatus) {
      case 'generating':
        return 'Generando documento...';
      case 'downloading':
        return 'Preparando descarga...';
      case 'completed':
        return 'Descarga completada';
      case 'error':
        return exportError || 'Error en la exportación';
      default:
        return '';
    }
  }, [exportStatus, exportError]);

  /**
   * Check if can export (has required data)
   */
  const canExport = useCallback((loanId?: string): boolean => {
    if (!loanId) return allSubLoans.length > 0 && clients.length > 0;
    
    const loan = getLoanById(loanId);
    if (!loan) return false;
    
    const client = clients.find(c => c.id === loan.clientId);
    if (!client) return false;
    
    const subLoans = allSubLoans.filter(sl => sl.loanId === loanId);
    return subLoans.length > 0;
  }, [getLoanById, clients, allSubLoans]);

  return {
    // State
    exportStatus,
    exportError,
    isExporting: exportStatus === 'generating' || exportStatus === 'downloading',
    
    // Actions
    exportLoanToPDF,
    exportLoansToExcel,
    exportAllLoansToExcel,
    exportSimulationToPDF,
    resetExportState,
    
    // Helpers
    getStatusMessage,
    canExport
  };
}