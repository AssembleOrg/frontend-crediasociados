import api from './api';
import type { PaginationParams, PaginatedResponse } from '@/types/auth';

/**
 * Manager-specific endpoints interfaces
 * Based on new backend API schema from creditos.md
 */
export interface ClientFiltersDto {
  fullName?: string;
  dni?: string;
  cuit?: string;
  email?: string;
  phone?: string;
  job?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface LoanFiltersDto {
  clientId?: string;
  loanTrack?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  currency?: 'ARS';
  paymentFrequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  minAmount?: number;
  maxAmount?: number;
  createdFrom?: string;
  createdTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface ClientChartDataDto {
  id: string;
  fullName: string;
  dni?: string;
  cuit?: string;
  totalLoans: number;
  totalAmount: number;
  activeLoans: number;
  activeAmount: number;
  createdAt: string;
  lastLoanDate?: string;
}

export interface LoanChartDataDto {
  id: string;
  loanTrack: string;
  amount: number;
  originalAmount: number;
  status: string;
  currency: string;
  paymentFrequency: string;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  nextDueDate?: string;
  client: {
    id: string;
    fullName: string;
    dni?: string;
  };
}

/**
 * THE MESSENGER - Manager Service
 * Simple, testable functions that only communicate with the API.
 * No state management, no complex logic - just API calls.
 *
 * Implements new backend endpoints from creditos.md
 */
class ManagerService {
  /**
   * Get clients for a specific manager with pagination and filters
   */
  async getManagerClients(
    managerId: string,
    params: PaginationParams & ClientFiltersDto = {}
  ): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();

    // Pagination
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    // Client filters
    if (params.fullName) searchParams.append('fullName', params.fullName);
    if (params.dni) searchParams.append('dni', params.dni);
    if (params.cuit) searchParams.append('cuit', params.cuit);
    if (params.email) searchParams.append('email', params.email);
    if (params.phone) searchParams.append('phone', params.phone);
    if (params.job) searchParams.append('job', params.job);
    if (params.createdFrom)
      searchParams.append('createdFrom', params.createdFrom);
    if (params.createdTo) searchParams.append('createdTo', params.createdTo);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${managerId}/clients?${queryString}`
      : `/users/${managerId}/clients`;

    const response = await api.get(url);

    return {
      data: response.data.data.data,
      meta: response.data.data.meta,
    };
  }

  /**
   * Get chart-optimized client data for a specific manager
   * No pagination - optimized for dashboards
   */
  async getManagerClientsChart(
    managerId: string,
    filters: ClientFiltersDto = {}
  ): Promise<ClientChartDataDto[]> {
    const searchParams = new URLSearchParams();

    // Client filters
    if (filters.fullName) searchParams.append('fullName', filters.fullName);
    if (filters.dni) searchParams.append('dni', filters.dni);
    if (filters.cuit) searchParams.append('cuit', filters.cuit);
    if (filters.email) searchParams.append('email', filters.email);
    if (filters.phone) searchParams.append('phone', filters.phone);
    if (filters.job) searchParams.append('job', filters.job);
    if (filters.createdFrom)
      searchParams.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) searchParams.append('createdTo', filters.createdTo);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${managerId}/clients/chart?${queryString}`
      : `/users/${managerId}/clients/chart`;

    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Get loans for a specific manager with pagination and filters
   */
  async getManagerLoans(
    managerId: string,
    params: PaginationParams & LoanFiltersDto = {}
  ): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();

    // Pagination
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    // Loan filters
    if (params.clientId) searchParams.append('clientId', params.clientId);
    if (params.loanTrack) searchParams.append('loanTrack', params.loanTrack);
    if (params.status) searchParams.append('status', params.status);
    if (params.currency) searchParams.append('currency', params.currency);
    if (params.paymentFrequency)
      searchParams.append('paymentFrequency', params.paymentFrequency);
    if (params.minAmount)
      searchParams.append('minAmount', params.minAmount.toString());
    if (params.maxAmount)
      searchParams.append('maxAmount', params.maxAmount.toString());
    if (params.createdFrom)
      searchParams.append('createdFrom', params.createdFrom);
    if (params.createdTo) searchParams.append('createdTo', params.createdTo);
    if (params.dueDateFrom)
      searchParams.append('dueDateFrom', params.dueDateFrom);
    if (params.dueDateTo) searchParams.append('dueDateTo', params.dueDateTo);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${managerId}/loans?${queryString}`
      : `/users/${managerId}/loans`;

    const response = await api.get(url);

    return {
      data: response.data.data.data,
      meta: response.data.data.meta,
    };
  }

  /**
   * Get chart-optimized loan data for a specific manager
   * No pagination - optimized for dashboards
   */
  async getManagerLoansChart(
    managerId: string,
    filters: LoanFiltersDto = {}
  ): Promise<LoanChartDataDto[]> {
    const searchParams = new URLSearchParams();

    // Loan filters
    if (filters.clientId) searchParams.append('clientId', filters.clientId);
    if (filters.loanTrack) searchParams.append('loanTrack', filters.loanTrack);
    if (filters.status) searchParams.append('status', filters.status);
    if (filters.currency) searchParams.append('currency', filters.currency);
    if (filters.paymentFrequency)
      searchParams.append('paymentFrequency', filters.paymentFrequency);
    if (filters.minAmount)
      searchParams.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount)
      searchParams.append('maxAmount', filters.maxAmount.toString());
    if (filters.createdFrom)
      searchParams.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) searchParams.append('createdTo', filters.createdTo);
    if (filters.dueDateFrom)
      searchParams.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) searchParams.append('dueDateTo', filters.dueDateTo);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${managerId}/loans/chart?${queryString}`
      : `/users/${managerId}/loans/chart`;

    const response = await api.get(url);
    return response.data.data;
  }
}

export const managerService = new ManagerService();
