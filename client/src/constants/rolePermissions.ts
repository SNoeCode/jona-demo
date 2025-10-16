// constants/rolePermissions.ts

// Core role definitions - MUST match across all files
export type UserRole =
  | "admin"           // System admin - HIGHEST privilege
  | "tenant_owner"    // Tenant owner
  | "org_admin"       // Org admin
  | "org_manager"     // Org manager
  | "org_user"        // Org member
  | "recruiter"       // Recruiter
  | "unassigned_user" // No org
  | "user";           // Default user

// System-level permissions
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
  canManageSystem: boolean;      // NEW: System-level management
  canViewAuditLogs: boolean;     // NEW: View audit logs
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
    // SYSTEM ADMIN - FULL ACCESS TO EVERYTHING
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
    canViewUserData: false, // Cannot see org user data
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

// Organization-level permissions
export const ORG_ROLE_PERMISSIONS: Record<UserRole, OrgPermissions> = {
  admin: {
    // Admin has full org permissions
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

// Helper to check system-level permissions
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissionsKey
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Helper to check org-level permissions
export function hasOrgPermission(
  role: UserRole,
  permission: keyof OrgPermissions
): boolean {
  return ORG_ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Route determination helper
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

// Helper to check if user is admin
export function isSystemAdmin(role: UserRole): boolean {
  return role === "admin";
}
