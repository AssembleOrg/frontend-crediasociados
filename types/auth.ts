// Import types directly from generated API types - Single source of truth
import type { components } from './api-generated';

// API Contract Types - Re-export from generated types
export type ApiUserRole = components['schemas']['CreateUserDto']['role'];
export type LoginDto = components['schemas']['LoginDto'];
export type RefreshTokenDto = components['schemas']['RefreshTokenDto'];
export type CreateUserDto = components['schemas']['CreateUserDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type UserResponseDto = components['schemas']['UserResponseDto'];

// Client API Contract Types
export type CreateClientDto = components['schemas']['CreateClientDto'];
export type UpdateClientDto = components['schemas']['UpdateClientDto'];
export type ClientResponseDto = components['schemas']['ClientResponseDto'];

// Loan API Contract Types
export type CreateLoanDto = components['schemas']['CreateLoanDto'];
export type CreateLoanResponseDto =
  components['schemas']['CreateLoanResponseDto'];
export type LoanChartDataDto = components['schemas']['LoanChartDataDto'];
export type LoanTrackingResponseDto =
  components['schemas']['LoanTrackingResponseDto'];
// Since getAllLoans doesn't have a specific response type, we'll use LoanChartDataDto
export type LoanListResponseDto = LoanChartDataDto;
export type LoanResponseDto = CreateLoanResponseDto;

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: 'ARS';
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'LOAN_DISBURSEMENT'
    | 'LOAN_PAYMENT'
    | 'TRANSFER_TO_MANAGER'
    | 'TRANSFER_FROM_SUBADMIN';
  amount: number;
  currency: 'ARS';
  description: string;
  relatedUserId?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  subLoanId: string;
  amount: number;
  currency: 'ARS';
  paymentDate: Date;
  description?: string;
  createdAt: Date;
}

export interface PaymentDistribution {
  subLoanId: string;
  distributedAmount: number;
  newStatus: 'PARTIAL' | 'PAID';
}

export interface LoginResponse {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Frontend domain types - Internal representation
export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'subadmin'
  | 'manager'
  | 'prestamista'
  | 'cliente';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  dni?: string;
  cuit?: string;
  createdAt: Date;
  updatedAt: Date;
  wallet?: Wallet;

  clientQuota?: number;
  usedClientQuota?: number;
  availableClientQuota?: number;
}

// Frontend domain type for Clients
export interface Client {
  id: string;
  fullName: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  job?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend Loan type (normalized from API)
export interface Loan {
  id: string;
  clientId: string;
  amount: number;
  baseInterestRate: number;
  penaltyInterestRate: number;
  currency: 'ARS';
  paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  paymentDay?:
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';
  totalPayments: number;
  firstDueDate?: Date;
  loanTrack: string;
  description?: string;
  notes?: string;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'DEFAULTED';
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  client?: Client;
}

// Auth state for store
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// API Error types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Transform utilities type
export type ApiUserToUser = (apiUser: UserResponseDto) => User;
export type UserToCreateDto = (
  user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
) => CreateUserDto;

// Client transform utilities
export type ApiClientToClient = (apiClient: ClientResponseDto) => Client;
export type ClientToCreateDto = (
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
) => CreateClientDto;

// Loan transform utilities
export type ApiLoanToLoan = (apiLoan: LoanResponseDto) => Loan;
export type LoanToCreateDto = (
  loan: Omit<
    Loan,
    | 'id'
    | 'status'
    | 'requestDate'
    | 'approvedDate'
    | 'completedDate'
    | 'createdAt'
    | 'updatedAt'
    | 'client'
  >
) => CreateLoanDto;
