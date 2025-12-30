import type {
  ApiUserRole,
  UserRole,
  UserResponseDto,
  User,
  CreateUserDto,
  UpdateUserDto,
  ClientResponseDto,
  Client,
  CreateClientDto,
  UpdateClientDto,
  Loan,
  LoanResponseDto,
  CreateLoanDto,
  Wallet,
} from './auth';

// Role mapping between API and Frontend
const ROLE_MAP: Record<ApiUserRole, UserRole> = {
  SUPERADMIN: 'admin',
  ADMIN: 'admin',
  SUBADMIN: 'subadmin',
  MANAGER: 'prestamista',
};

const REVERSE_ROLE_MAP: Record<UserRole, ApiUserRole> = {
  superadmin: 'SUPERADMIN',
  admin: 'ADMIN',
  subadmin: 'SUBADMIN',
  manager: 'MANAGER',
  prestamista: 'MANAGER',
  cliente: 'MANAGER',
};

// Transform API user to frontend user
export const apiUserToUser = (apiUser: UserResponseDto): User => ({
  id: apiUser.id,
  email: apiUser.email,
  fullName: apiUser.fullName,
  phone: typeof apiUser.phone === 'string' ? apiUser.phone : undefined,
  role: ROLE_MAP[apiUser.role] || 'prestamista',
  dni: typeof apiUser.dni === 'string' ? apiUser.dni : undefined,
  cuit: typeof apiUser.cuit === 'string' ? apiUser.cuit : undefined,
  createdAt: new Date(apiUser.createdAt),
  updatedAt: new Date(apiUser.updatedAt),
  wallet:
    (apiUser as UserResponseDto & { wallet?: Wallet }).wallet ?? undefined,
  clientQuota: apiUser.clientQuota !== undefined ? apiUser.clientQuota : undefined,
  usedClientQuota: apiUser.usedClientQuota !== undefined ? apiUser.usedClientQuota : undefined,
  availableClientQuota: apiUser.availableClientQuota !== undefined ? apiUser.availableClientQuota : undefined,
  commission: (apiUser as any).commission !== undefined ? (apiUser as any).commission : undefined,
});

// Transform frontend user to API create DTO
export const userToCreateDto = (
  user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }
): CreateUserDto => ({
  email: user.email,
  password: user.password,
  fullName: user.fullName,
  phone: user.phone,
  role: REVERSE_ROLE_MAP[user.role] || 'MANAGER',
  clientQuota: (user as any)?.clientQuota,
  commission: user.commission,
} as CreateUserDto);

// Transform frontend user to API update DTO
export const userToUpdateDto = (
  user: Partial<User> & { password?: string }
): UpdateUserDto => {
  const dto: UpdateUserDto = {};

  if (user.email !== undefined) dto.email = user.email;
  if (user.password !== undefined) dto.password = user.password;
  if (user.fullName !== undefined) dto.fullName = user.fullName;
  if (user.phone !== undefined) dto.phone = user.phone;
  if (user.role !== undefined)
    dto.role = REVERSE_ROLE_MAP[user.role] || 'MANAGER';
  if (user.clientQuota !== undefined) dto.clientQuota = user.clientQuota;
  if (user.commission !== undefined) (dto as any).commission = user.commission;

  return dto;
};

// Get display role name
export const getRoleDisplayName = (role: UserRole): string => {
  const ROLE_DISPLAY: Record<UserRole, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    subadmin: 'Cobrador',
    manager: 'Manager',
    prestamista: 'Prestamista',
    cliente: 'Cliente',
  };
  return ROLE_DISPLAY[role] || 'Usuario';
};

// CLIENT TRANSFORMS - Following same pattern as User transforms

// Transform API client to frontend client
export const apiClientToClient = (apiClient: ClientResponseDto): Client => ({
  id: apiClient.id,
  fullName: apiClient.fullName,
  dni: apiClient.dni || undefined,
  cuit: apiClient.cuit || undefined,
  phone: apiClient.phone || undefined,
  email: apiClient.email || undefined,
  address: apiClient.address || undefined,
  job: apiClient.job || undefined,
  work: (apiClient as any).work || undefined,
  description: (apiClient as any).description || undefined,
  verified: (apiClient as any).verified !== undefined ? (apiClient as any).verified : undefined,
  createdAt: new Date(apiClient.createdAt),
  updatedAt: new Date(apiClient.updatedAt),
});

// Transform frontend client to API create DTO
export const clientToCreateDto = (
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): CreateClientDto => ({
  fullName: client.fullName,
  dni: client.dni,
  cuit: client.cuit,
  phone: client.phone,
  email: client.email,
  address: client.address,
  job: client.job,
  work: client.work,
  description: client.description,
} as CreateClientDto);

// Transform frontend client to API update DTO
export const clientToUpdateDto = (client: Partial<Client>): UpdateClientDto => {
  const dto: UpdateClientDto = {};

  if (client.fullName !== undefined) dto.fullName = client.fullName;
  if (client.dni !== undefined) dto.dni = client.dni;
  if (client.cuit !== undefined) dto.cuit = client.cuit;
  if (client.phone !== undefined) dto.phone = client.phone;
  if (client.email !== undefined) dto.email = client.email;
  if (client.address !== undefined) dto.address = client.address;
  if (client.job !== undefined) dto.job = client.job;
  if (client.work !== undefined) (dto as any).work = client.work;
  if (client.description !== undefined) (dto as any).description = client.description;

  return dto;
};

// ========================
// LOAN TRANSFORMATIONS
// ========================

// Transform API loan response to frontend loan
// Note: Using actual baseInterestRate and penaltyInterestRate from API response
export const apiLoanToLoan = (apiLoan: LoanResponseDto): Loan => ({
  id: apiLoan.id,
  clientId: apiLoan.clientId, // Available in CreateLoanResponseDto
  amount: apiLoan.amount,
  originalAmount: (apiLoan as any).originalAmount, // Monto original prestado (sin intereses)
  baseInterestRate: (apiLoan as any).baseInterestRate !== undefined && (apiLoan as any).baseInterestRate !== null 
    ? (apiLoan as any).baseInterestRate 
    : 0, // Use API value, default to 0 if not provided
  penaltyInterestRate: (apiLoan as any).penaltyInterestRate !== undefined && (apiLoan as any).penaltyInterestRate !== null 
    ? (apiLoan as any).penaltyInterestRate 
    : 0, // Use API value, default to 0 if not provided
  currency: 'ARS' as const,
  paymentFrequency: apiLoan.paymentFrequency as
    | 'DAILY'
    | 'WEEKLY'
    | 'BIWEEKLY'
    | 'MONTHLY',
  paymentDay: [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ].includes((apiLoan as unknown as { paymentDay?: string }).paymentDay || '')
    ? ((apiLoan as unknown as { paymentDay?: string }).paymentDay as unknown as
        | 'MONDAY'
        | 'TUESDAY'
        | 'WEDNESDAY'
        | 'THURSDAY'
        | 'FRIDAY'
        | 'SATURDAY'
        | 'SUNDAY')
    : undefined,
  totalPayments: apiLoan.totalPayments,
  firstDueDate: apiLoan.firstDueDate
    ? new Date(apiLoan.firstDueDate)
    : undefined,
  loanTrack: apiLoan.loanTrack,
  description: apiLoan.description || undefined,
  notes: undefined, // Not available in current API response
  status: 'ACTIVE', // Default, not available in current API response
  requestDate: new Date(apiLoan.createdAt), // Use createdAt as requestDate
  approvedDate: undefined, // Not available in current API response
  completedDate: undefined, // Not available in current API response
  createdAt: new Date(apiLoan.createdAt),
  updatedAt: new Date(apiLoan.createdAt), // Use createdAt as updatedAt placeholder
  // client: apiLoan.client ? {...} : undefined, // Available but empty Record<string, never>
});

// Transform frontend loan to API create DTO
export const loanToCreateDto = (
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
): CreateLoanDto => ({
  clientId: loan.clientId,
  amount: loan.amount,
  baseInterestRate: loan.baseInterestRate,
  penaltyInterestRate: loan.penaltyInterestRate,
  currency: loan.currency,
  paymentFrequency: loan.paymentFrequency,
  paymentDay:
    loan.paymentFrequency === 'DAILY'
      ? undefined
      : [
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
        ].includes((loan.paymentDay as string) || '')
      ? (loan.paymentDay as
          | 'MONDAY'
          | 'TUESDAY'
          | 'WEDNESDAY'
          | 'THURSDAY'
          | 'FRIDAY'
          | 'SATURDAY')
      : undefined,
  totalPayments: loan.totalPayments,
  firstDueDate: loan.firstDueDate?.toISOString(),
  loanTrack: loan.loanTrack,
  description: loan.description,
  notes: loan.notes,
});
