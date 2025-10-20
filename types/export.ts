import type { Loan, Client } from './auth';
import type { components } from './api-generated';

type SubLoanResponseDto = components['schemas']['SubLoanResponseDto'];

export interface ExportLoanData {
  loan: Loan;
  client: Client;
  subLoans: SubLoanResponseDto[];
  totalAmount: number;
  totalInterest: number;
  totalPayments: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  filename?: string;
  includeDetails?: boolean;
}

export interface LoanPDFData {
  // Loan Information
  loanId: string;
  loanTrack?: string;
  amount: number;
  baseInterestRate: number;
  totalAmount: number;
  paymentFrequency: string;
  numberOfInstallments: number;
  startDate: string;
  description?: string;
  
  // Client Information
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientDNI?: string;
  clientCUIT?: string;
  clientAddress?: string;
  
  // Payment Schedule
  paymentSchedule: {
    paymentNumber: number;
    dueDate: string;
    principalAmount: number;
    totalAmount: number;
    status: string;
  }[];
  
  // Summary
  summary: {
    totalPrincipal: number;
    totalInterest: number;
    totalAmount: number;
    numberOfPayments: number;
    frequency: string;
    remainingBalance: number;
  };

  // Metadata
  generatedAt: string;
  generatedBy: string;
}

export interface ExcelLoanData {
  'ID Préstamo': string;
  'Código Seguimiento': string;
  'Cliente': string;
  'DNI/CUIT': string;
  'Monto Prestado': number;
  'Monto Total': number;
  'Resta Abonar': number;
  'Frecuencia': string;
  'Cantidad Cuotas': number;
  'Fecha Inicio': string;
  'Estado': string;
  'Descripción': string;
}

export type ExportFormat = 'pdf' | 'excel';
export type ExportStatus = 'idle' | 'generating' | 'downloading' | 'completed' | 'error';

// Admin Reports Types
export interface AdminReportsData {
  totalUsers: number;
  totalClients: number;
  totalLoans: number;
  totalAmountLent: number;
  totalAmountPending: number;
  averageCollectionRate: number;
  subadmins: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalClients: number;
    totalLoans: number;
    totalAmountLent: number;
    totalAmountPending: number;
    collectionRate: number;
    createdAt: string;
  }[];
}

export interface AdminReportsPDFData {
  // Report Information
  reportTitle: string;
  reportType: string;
  generatedAt: string;
  generatedBy: string;

  // Summary
  summary: {
    totalSubadmins: number;
    totalManagers: number;
    totalClients: number;
    totalLoans: number;
    totalAmountLent: number;
    averagePerSubadmin: number;
  };

  // Subadmins data
  subadmins: {
    name: string;
    email: string;
    managersCount: number;
    clientsCount: number;
    loansCount: number;
    totalAmount: number;
    createdAt: string;
  }[];
}

// Subadmin Reports Types
export interface SubadminReportsData {
  totalManagers: number;
  totalClients: number;
  totalLoans: number;
  totalAmountLent: number;
  managers: {
    id: string;
    name: string;
    email: string;
    totalClients: number;
    totalLoans: number;
    totalAmountLent: number;
    createdAt: string;
  }[];
}

export interface SubadminReportsPDFData {
  // Report Information
  reportTitle: string;
  reportType: string;
  generatedAt: string;
  generatedBy: string;
  subadminName: string;

  // Summary
  summary: {
    totalManagers: number;
    totalClients: number;
    totalLoans: number;
    totalAmountLent: number;
    averagePerManager: number;
  };

  // Managers data
  managers: {
    name: string;
    email: string;
    clientsCount: number;
    loansCount: number;
    totalAmount: number;
    createdAt: string;
  }[];
}