// utils/roleUtils.ts
import type { UserRole, OrgRole } from "@/types/organization";
import type { AuthUser } from "@/types/user/authUser";

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

export function getPrimaryRole(user: {
  role?: UserRole;
  organizations?: Array<{ role: OrgRole | "recruiter" }>;
  is_admin?: boolean;
  is_tenant_owner?: boolean;
}): UserRole {
  // System admin has highest priority
  if (user.is_admin) {
    return "admin";
  }
  
  // Tenant owner second
  if (user.is_tenant_owner) {
    return "tenant_owner";
  }
  
  if (user.organizations && user.organizations.length > 0) {
    const roles = user.organizations.map((org) => org.role);
    
    // Return highest priority org role
    if (roles.includes("org_admin")) return "org_admin";
    if (roles.includes("org_manager")) return "org_manager";
    if (roles.includes("org_user")) return "org_user";
    if (roles.includes("recruiter")) return "recruiter";
  }
  
  return user.role ?? "user";
}

export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: UserRole[] = [
    "admin",
    "tenant_owner",
    "org_admin",
    "org_manager",
    "org_user",
    "recruiter",
    "unassigned_user",
    "user",
  ];
  
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);
  
  return userIndex !== -1 && requiredIndex !== -1 && userIndex <= requiredIndex;
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "tenant_owner";
}

export function isOrgRole(role: UserRole): boolean {
  return ["org_admin", "org_manager", "org_user"].includes(role);
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: "System Admin",
    tenant_owner: "Tenant Owner",
    org_admin: "Organization Admin",
    org_manager: "Organization Manager",
    org_user: "Organization User",
    recruiter: "Recruiter",
    unassigned_user: "Unassigned User",
    user: "User",
  };
  
  return displayNames[role] || role;
}

export function canTransitionRole(
  fromRole: UserRole,
  toRole: UserRole,
  actorRole: UserRole
): boolean {
  // Only admins can assign admin roles
  if ((toRole === "admin" || toRole === "tenant_owner") && actorRole !== "admin") {
    return false;
  }
  
  // Tenant owners can assign any non-admin role
  if (actorRole === "tenant_owner" && toRole !== "admin") {
    return true;
  }
  
  if (actorRole === "org_admin") {
    return isOrgRole(toRole) || toRole === "recruiter" || toRole === "user";
  }
  
  // Others cannot assign roles
  return false;
}

export function requireAdmin(user: AuthUser | null) {
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return true;
}

export function requireTenantOwner(user: AuthUser | null) {
  if (!user || (user.role !== "admin" && !user.is_tenant_owner)) {
    throw new Error("Tenant owner access required");
  }
  return true;
}
