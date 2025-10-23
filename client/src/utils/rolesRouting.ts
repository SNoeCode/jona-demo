export type DatabaseRole = 'owner' | 'admin' | 'manager' | 'member' | 'user' | 'recruiter';

export function getRoleDashboardPath(role: DatabaseRole | string, orgSlug: string): string {
  switch (role) {
    case 'owner':
      return `/org/owner/${orgSlug}/dashboard`;
    case 'admin':
      return `/org/admin/${orgSlug}/dashboard`;
    case 'manager':
      return `/org/manager/${orgSlug}/dashboard`;
    case 'member':
    case 'user':
      return `/org/member/${orgSlug}/dashboard`;
    case 'recruiter':
      return `/org/recruiter/${orgSlug}/dashboard`;
    default:
      console.warn(`Unknown role: ${role}, redirecting to default dashboard`);
      return `/org/${orgSlug}/dashboard`;
  }
}

export function getSystemRoleDashboardPath(
  isAdmin: boolean,
  isTenantOwner: boolean,
  isOrgOwner: boolean,
  orgSlug?: string
): string {
  if (isAdmin) {
    return '/admin/dashboard';
  }
  
  if (isTenantOwner) {
    return '/tenant/dashboard';
  }
  
  if (isOrgOwner && orgSlug) {
    return `/org/owner/${orgSlug}/dashboard`;
  }
  return '/dashboard';
}

export function mapDatabaseRoleToUserRole(
  dbRole: string,
  isAdmin: boolean,
  isTenantOwner: boolean
): string {
  if (isAdmin) return 'admin';
  if (isTenantOwner) return 'tenant_owner';
  
  switch (dbRole) {
    case 'owner':
      return 'org_admin'; 
    case 'admin':
      return 'org_admin';
    case 'manager':
      return 'org_manager';
    case 'member':
    case 'user':
      return 'org_user';
    case 'recruiter':
      return 'recruiter';
    default:
      return 'user';
  }
}