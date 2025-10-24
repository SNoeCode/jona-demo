import type { UserRole, OrgRole } from "@/types/org/organization";
import type { AuthUser } from "@/types/user/authUser";

const ROLE_HIERARCHY: UserRole[] = [
  'admin',
  'tenant_owner',
  'org_admin',
  'org_manager',
  'org_user',
  'recruiter',
  'unassigned_user',
  'user',
]

interface UserRoleData {
  is_admin?: boolean
  is_tenant_owner?: boolean
  organizations?: Array<{
    role: string
  }>
}
export function normalizeAppRole(raw?: string): UserRole {
  if (!raw) return "unassigned_user";
  
  const normalized = raw.toLowerCase().replace(/\s+/g, "_");
  
  switch (normalized) {
    case "admin":
      return "admin";
    case "tenant_owner":
    case "tenant":
      return "tenant_owner";
    case "org_admin":
    case "org admin":
      return "org_admin";
    case "org_manager":
    case "org manager":
      return "org_manager";
    case "org_user":
    case "org user":
      return "org_user";
    case "recruiter":
      return "recruiter";
    case "user":
      return "user";
    case "unassigned_user":
    case "unassigned":
      return "unassigned_user";
    default:
      console.warn(`Unknown role "${raw}", defaulting to unassigned_user`);
      return "unassigned_user";
  }
}
interface UserRoleData {
  is_admin?: boolean
  is_tenant_owner?: boolean
  organizations?: Array<{
    role: string
  }>
}

export function getPrimaryRole(userData: UserRoleData): UserRole {
  if (userData.is_admin) {
    return 'admin'
  }

  if (userData.is_tenant_owner) {
    return 'tenant_owner'
  }

  if (userData.organizations && userData.organizations.length > 0) {
    const orgRoles = userData.organizations.map(org => org.role)
    if (orgRoles.includes('admin')) return 'org_admin'
    if (orgRoles.includes('manager')) return 'org_manager'
    if (orgRoles.includes('recruiter')) return 'recruiter'
    if (orgRoles.includes('member')) return 'org_user'
  }
  return 'unassigned_user'
}

export function getAllRoles(userData: UserRoleData): UserRole[] {
  const roles: UserRole[] = []

  if (userData.is_admin) {
    roles.push('admin')
  }

  if (userData.is_tenant_owner) {
    roles.push('tenant_owner')
  }

  if (userData.organizations && userData.organizations.length > 0) {
    const orgRoles = userData.organizations.map(org => org.role)

    if (orgRoles.includes('admin')) roles.push('org_admin')
    if (orgRoles.includes('manager')) roles.push('org_manager')
    if (orgRoles.includes('recruiter')) roles.push('recruiter')
    if (orgRoles.includes('member')) roles.push('org_user')
  }

  if (roles.length === 0) {
    roles.push('unassigned_user')
  }

  return roles
}

export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  
  return userIndex <= requiredIndex
}

export function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role)
}

export function hasAnyRole(userRoles: UserRole[], roles: UserRole[]): boolean {
  return roles.some(role => userRoles.includes(role))
}

export function hasAllRoles(userRoles: UserRole[], roles: UserRole[]): boolean {
  return roles.every(role => userRoles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole, orgSlug?: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'tenant_owner':
      return '/tenant/dashboard'
    case 'org_admin':
      return orgSlug ? `/org/${orgSlug}/admin/dashboard` : '/dashboard'
    case 'org_manager':
      return orgSlug ? `/org/${orgSlug}/manager/dashboard` : '/dashboard'
    case 'org_user':
      return orgSlug ? `/org/${orgSlug}/member/dashboard` : '/dashboard'
    case 'recruiter':
      return orgSlug ? `/org/${orgSlug}/recruit` : '/recruit'
    case 'unassigned_user':
    case 'user':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

export function requiresOrgContext(role: UserRole): boolean {
  return ['org_admin', 'org_manager', 'org_user'].includes(role)
}

export function isSystemAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageOrganizations(role: UserRole): boolean {
  return ['admin', 'tenant_owner', 'org_admin'].includes(role)
}

export function canManageUsers(role: UserRole): boolean {
  return ['admin', 'tenant_owner', 'org_admin', 'org_manager'].includes(role)
}

export function canViewAnalytics(role: UserRole): boolean {
  return ['admin', 'tenant_owner', 'org_admin', 'org_manager'].includes(role)
}