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
  'Tasa Interés (%)': number;
  'Monto Total': number;
  'Frecuencia': string;
  'Cantidad Cuotas': number;
  'Fecha Inicio': string;
  'Estado': string;
  'Descripción': string;
}

export type ExportFormat = 'pdf' | 'excel';
export type ExportStatus = 'idle' | 'generating' | 'downloading' | 'completed' | 'error';