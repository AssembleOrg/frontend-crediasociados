import type {
  ApiUserRole,
  UserRole,
  UserResponseDto,
  User,
  CreateUserDto,
  UpdateUserDto,
} from './auth';

// Role mapping between API and Frontend
const ROLE_MAP: Record<ApiUserRole, UserRole> = {
  SUPERADMIN: 'admin',
  ADMIN: 'admin',
  SUBADMIN: 'subadmin',
  MANAGER: 'prestamista',
};

const REVERSE_ROLE_MAP: Record<UserRole, ApiUserRole> = {
  admin: 'SUPERADMIN',
  subadmin: 'SUBADMIN',
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
});

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

  return dto;
};

// Get display role name
export const getRoleDisplayName = (role: UserRole): string => {
  const ROLE_DISPLAY: Record<UserRole, string> = {
    admin: 'Administrador',
    subadmin: 'Sub-Administrador',
    prestamista: 'Prestamista',
    cliente: 'Cliente',
  };
  return ROLE_DISPLAY[role] || 'Usuario';
};
