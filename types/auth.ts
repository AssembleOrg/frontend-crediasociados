// Import types directly from generated API types - Single source of truth
import type { components } from './api-generated';

// API Contract Types - Re-export from generated types
export type ApiUserRole = components['schemas']['CreateUserDto']['role'];
export type LoginDto = components['schemas']['LoginDto'];
export type RefreshTokenDto = components['schemas']['RefreshTokenDto'];
export type CreateUserDto = components['schemas']['CreateUserDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type UserResponseDto = components['schemas']['UserResponseDto']

// Client API Contract Types
export type CreateClientDto = components['schemas']['CreateClientDto']
export type UpdateClientDto = components['schemas']['UpdateClientDto']
export type ClientResponseDto = components['schemas']['ClientResponseDto'];

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
export type UserRole = 'admin' | 'subadmin' | 'prestamista' | 'cliente';

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
