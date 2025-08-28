import type { User, UserRole } from '@/types/auth'

export type { UserRole }

export const ROLE_HIERARCHY = {
  superadmin: 0,
  admin: 1,
  subadmin: 2,
  manager: 3,
  prestamista: 3, // Same level as manager (legacy compatibility)
  cliente: 4
} as const

export const ROLE_DISPLAY_NAMES = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  subadmin: 'Sub Admin',
  manager: 'Manager', 
  prestamista: 'Prestamista',
  cliente: 'Cliente'
} as const

export const ROLE_COLORS = {
  superadmin: '#9c27b0', // Purple
  admin: '#f44336',      // Red
  subadmin: '#ff9800',   // Orange
  manager: '#2196f3',    // Blue
  prestamista: '#2196f3', // Blue (same as manager)
  cliente: '#4caf50'     // Green
} as const

export const DASHBOARD_ROUTES = {
  superadmin: '/dashboard/admin',
  admin: '/dashboard/admin',
  subadmin: '/dashboard/subadmin',
  manager: '/dashboard/prestamista',
  prestamista: '/dashboard/prestamista',
  cliente: null // No dashboard access
} as const

export class RoleUtils {
  static getRoleDisplayName(role: UserRole): string {
    return ROLE_DISPLAY_NAMES[role] || role
  }

  static getRoleColor(role: UserRole): string {
    return ROLE_COLORS[role] || '#757575'
  }

  static getDashboardRoute(role: UserRole): string | null {
    return DASHBOARD_ROUTES[role] || null
  }

  static getRoleHierarchyLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role] ?? 999
  }

  static canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = RoleUtils.getRoleHierarchyLevel(managerRole)
    const targetLevel = RoleUtils.getRoleHierarchyLevel(targetRole)
    
    // Can only manage roles at lower hierarchy levels
    return managerLevel < targetLevel
  }

  static getManageableRoles(userRole: UserRole): UserRole[] {
    const userLevel = RoleUtils.getRoleHierarchyLevel(userRole)
    
    return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(role => {
      const roleLevel = ROLE_HIERARCHY[role]
      return roleLevel > userLevel
    })
  }

  static isValidRole(role: string): role is UserRole {
    return role in ROLE_HIERARCHY
  }

  static hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = RoleUtils.getRoleHierarchyLevel(userRole)
    const requiredLevel = RoleUtils.getRoleHierarchyLevel(requiredRole)
    
    // User has access if their level is equal or higher (lower number)
    return userLevel <= requiredLevel
  }

  static canAccessDashboard(role: UserRole): boolean {
    return DASHBOARD_ROUTES[role] !== null
  }

  static formatUserDisplay(user: User): string {
    const roleName = RoleUtils.getRoleDisplayName(user.role as UserRole)
    return `${user.fullName} (${roleName})`
  }
}