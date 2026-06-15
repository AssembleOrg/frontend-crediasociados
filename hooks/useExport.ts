import { useState, useCallback } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { useClients } from '@/hooks/useClients';
import { useSubLoans } from '@/hooks/useSubLoans';
import { loansService } from '@/services/loans.service';
import type { ExportLoanData, ExportStatus } from '@/types/export';

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
   * Export single loan as PDF reporte
   * Fetches full loan data directly (including embedded subLoans and client)
   * to avoid depending on the global store which may be incomplete.
   */
  const exportLoanToPDF = useCallback(async (loanId: string, filename?: string): Promise<boolean> => {
    try {
      setExportStatus('generating');
      setExportError(null);

      // getLoanById retorna subLoans como objetos completos (el tipo generado dice string[] pero es incorrecto)
      // Los campos numéricos pueden llegar como strings JSON ("8333.33"), por eso usamos Number()
      const loanFull = await loansService.getLoanById(loanId);
      const subLoans = (loanFull as any).subLoans ?? [];
      const clientData = (loanFull as any).client;

      if (!clientData) {
        throw new Error('Cliente no encontrado en los datos del préstamo');
      }

      // Map client to expected Client shape
      const client = {
        id: clientData.id ?? loanFull.clientId,
        fullName: clientData.fullName ?? clientData.name ?? 'Cliente',
        dni: clientData.dni,
        cuit: clientData.cuit,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
        createdAt: clientData.createdAt ? new Date(clientData.createdAt) : new Date(),
        updatedAt: clientData.updatedAt ? new Date(clientData.updatedAt) : new Date(),
      };

      // Number() convierte strings JSON a números para evitar concatenación ("8000" + "8000" = "80008000")
      const totalPaid = subLoans.reduce((sum: number, s: any) => {
        if (s.status === 'PAID') return sum + Number(s.totalAmount ?? 0);
        if (s.status === 'PARTIAL') return sum + Number(s.paidAmount ?? 0);
        return sum;
      }, 0);
      const totalAmount = subLoans.reduce((sum: number, s: any) => sum + Number(s.totalAmount ?? 0), 0) || loanFull.amount;
      const totalInterest = totalAmount - loanFull.amount;

      const exportData: ExportLoanData = {
        loan: loanFull as any,
        client: client as any,
        subLoans: subLoans,
        totalAmount,
        totalInterest,
        totalPayments: subLoans.length || loanFull.totalPayments,
      };

      setExportStatus('downloading');

      // Lazy load export service (includes @react-pdf/renderer)
      const { exportService } = await import('@/services/export.service');

      // Generate PDF
      const pdfBlob = await exportService.generateLoanPDF(exportData);

      // Download file
      const defaultFilename = `reporte-prestamo-${loanFull.loanTrack || loanId}`;
      exportService.downloadFile(pdfBlob, filename || defaultFilename, 'pdf');

      setExportStatus('completed');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar PDF';
      setExportError(errorMessage);
      setExportStatus('error');

      return false;
    }
  }, []);

  /**
   * Export multiple loans to Excel
   * Lazy loads export service and XLSX library only when needed
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

      // Lazy load export service (includes xlsx library)
      const { exportService } = await import('@/services/export.service');

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
   * Lazy loads export service and PDF libraries only when needed
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

      console.log('Form data:', formData)
      console.log('Clients:', clients)
      console.log('Form clientId:', formData.clientId)

      // Primero intentar buscar el cliente en la lista local
      let client = clients.find(c => c.id === formData.clientId);
      
      // Si no se encuentra en la lista local, buscar en el backend
      if (!client) {
        try {
          console.log('Cliente no encontrado en lista local, buscando en backend...');
          // Importación dinámica para evitar problemas de carga
          const { clientsService } = await import('@/services/clients.service');
          const { apiClientToClient } = await import('@/types/transforms');
          
          const clientFromBackend = await clientsService.getClientById(formData.clientId);
          // Transformar el cliente del backend al formato esperado
          client = apiClientToClient(clientFromBackend);
          console.log('Cliente encontrado en backend:', client);
        } catch (error: any) {
          console.error('Error al buscar cliente en backend:', error);
          if (error?.response?.status === 404) {
            throw new Error('Cliente no encontrado');
          }
          throw new Error('Error al buscar el cliente. Por favor, intenta nuevamente.');
        }
      }
      
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
        totalPayments: parseInt(formData.totalPayments),
        firstDueDate: formData.firstDueDate?.toISOString() || simulatedLoans[0]?.dueDate.toISOString(),
        createdAt: new Date().toISOString(),
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

      // Lazy load export service (includes @react-pdf/renderer)
      const { exportService } = await import('@/services/export.service');

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
    // For individual loan PDF: just check the loan exists in the store.
    // The actual fetch happens at export time via loansService.getLoanById.
    return !!getLoanById(loanId);
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