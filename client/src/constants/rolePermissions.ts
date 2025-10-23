export type UserRole =
  | "admin"
  | "tenant_owner"
  | "org_admin"
  | "org_manager"
  | "org_user"
  | "recruiter"
  | "unassigned_user"
  | "user";


export type RolePermissionsKey = {
  canViewAllOrgs: boolean;
  canManageOrg: boolean;
  canManageUsers: boolean;
  canViewUserData: boolean;
  canManageJobs: boolean;
  canViewJobs: boolean;
  requiresOrgId: boolean;
  canViewOwnUserData: boolean;
  canManageSettings: boolean;
  canManageProfile: boolean;
  canApplyToJobs: boolean;
  canManageSystem: boolean; 
  canViewAuditLogs: boolean; 
};

// Organization-level permissions
export type OrgPermissions = {
  canManageMembers: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canViewAnalytics: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
};

// System-level role permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionsKey> = {
  admin: {
    canViewAllOrgs: true,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: true,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSystem: true,
    canViewAuditLogs: true,
  },
  tenant_owner: {
    canViewAllOrgs: true,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: false,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSystem: false,
    canViewAuditLogs: true,
  },
  org_admin: {
    canViewAllOrgs: false,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: true,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  org_manager: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: true,
    canViewUserData: true,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  org_user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  recruiter: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  unassigned_user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: false,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
};

export const ORG_ROLE_PERMISSIONS: Record<UserRole, OrgPermissions> = {
  admin: {
    canManageMembers: true,
    canManageSettings: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canInviteMembers: true,
    canRemoveMembers: true,
  },
  tenant_owner: {
    canManageMembers: true,
    canManageSettings: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canInviteMembers: true,
    canRemoveMembers: true,
  },
  org_admin: {
    canManageMembers: true,
    canManageSettings: true,
    canManageBilling: false,
    canViewAnalytics: true,
    canInviteMembers: true,
    canRemoveMembers: true,
  },
  org_manager: {
    canManageMembers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: true,
    canInviteMembers: true,
    canRemoveMembers: false,
  },
  org_user: {
    canManageMembers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
  recruiter: {
    canManageMembers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
  unassigned_user: {
    canManageMembers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
  user: {
    canManageMembers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canInviteMembers: false,
    canRemoveMembers: false,
  },
};

export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissionsKey
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function hasOrgPermission(
  role: UserRole,
  permission: keyof OrgPermissions
): boolean {
  return ORG_ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function getRouteForRole(
  role: UserRole,
  organizationId?: string
): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "tenant_owner":
      return "/tenant/dashboard";
    case "org_admin":
      return `/org/${organizationId}/admin`;
    case "org_manager":
      return `/org/${organizationId}/manage`;
    case "org_user":
      return `/org/${organizationId}/dashboard`;
    case "recruiter":
      return organizationId ? `/org/${organizationId}/recruit` : "/recruit";
    case "unassigned_user":
      return "/dashboard";
    case "user":
      return "/dashboard";
    default:
      return "/";
  }
}

export function isSystemAdmin(role: UserRole): boolean {
  return role === "admin";
}
