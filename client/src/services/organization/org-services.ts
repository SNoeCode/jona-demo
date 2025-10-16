// types/organization.ts
import { OrgPermissions } from "@/constants/rolePermissions";

export type OrgSize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "paused";

// Use this for organization membership roles only
export type OrgRole = "org_admin" | "org_manager" | "org_user";

// Use this for app-wide user roles
export type UserRole =
  | "admin"           // System admin - FIRST in hierarchy
  | "tenant_owner"    // Tenant owner
  | "org_admin"       // Org admin
  | "org_manager"     // Org manager
  | "org_user"        // Org member
  | "recruiter"       // Recruiter
  | "unassigned_user" // No org
  | "user";           // Default

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: OrgSize;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  settings?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizations?: Organization[];
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  department?: string;
  position?: string;
  joined_at: string;
  invited_by?: string;
  invitation_accepted: boolean;
  invitation_token?: string;
  invitation_expires_at?: string;
  permissions?: Record<string, unknown>;
  is_active: boolean;
  users?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
  };
  organizations?: Organization;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  organizations?: Organization;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id?: string;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  seats_included: number;
  seats_used: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUsage {
  id: string;
  organization_id: string;
  month: string;
  jobs_scraped: number;
  resumes_processed: number;
  applications_sent: number;
  api_calls: number;
  storage_used_mb: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationAuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserOrgRole {
  id: string;
  user_id: string;
  organization_id?: string;
  tenant_id?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
}

export interface UserWithOrgRole {
  id: string;
  email: string;
  role: UserRole;
  organization?: Organization;
  tenant?: Tenant;
  is_active: boolean;
}

export interface UserWithOrganization {
  id: string;
  email: string;
  role: UserRole;
  current_organization_id?: string;
  is_admin?: boolean;              // ADDED
  is_org_owner?: boolean;
  is_tenant_owner?: boolean;
  current_organization?: Organization;
  organization_members?: OrganizationMember[];
  owned_tenants?: Tenant[];
}

// Organization context for components
export interface OrganizationContext {
  organization: Organization;
  membership: OrganizationMember;
  permissions: OrgPermissions;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  aud: string;
  created_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: {
    full_name?: string;
    role?: string;
    name?: string;
    is_admin?: boolean;              // ADDED
    is_org_owner?: boolean;
    is_tenant_owner?: boolean;
    current_organization_id?: string;
  };
  current_organization_id?: string;
  is_admin?: boolean;                // ADDED
  is_org_owner?: boolean;
  is_tenant_owner?: boolean;
  organizations?: OrganizationMember[];
}

// Access control helper - UPDATED
export function canAccessOrganization(
  userRole: UserRole,
  userOrgId?: string,
  targetOrgId?: string,
  userTenantId?: string,
  targetTenantId?: string,
  isAdmin?: boolean,
  isTenantOwner?: boolean
): boolean {
  // System admin can access everything
  if (isAdmin) {
    return true;
  }

  // Tenant owner can access all orgs in their tenant
  if (isTenantOwner || userRole === "tenant_owner") {
    return userTenantId === targetTenantId;
  }

  // Org roles need matching org ID
  if (["org_admin", "org_manager", "org_user"].includes(userRole)) {
    return userOrgId === targetOrgId;
  }

  // Recruiter can access their org
  if (userRole === "recruiter") {
    return userOrgId === targetOrgId;
  }

  // Unassigned users and regular users cannot access orgs
  return false;
}

// Helper to check if user can manage organization
export function canManageOrganization(
  userRole: UserRole,
  isAdmin?: boolean,
  isTenantOwner?: boolean,
  isOrgOwner?: boolean
): boolean {
  if (isAdmin || isTenantOwner) return true;
  if (isOrgOwner || userRole === "org_admin") return true;
  return false;
}

// Helper to check if user can view organization data
export function canViewOrganizationData(
  userRole: UserRole,
  isAdmin?: boolean,
  isTenantOwner?: boolean
): boolean {
  if (isAdmin) return true;
  // Tenant owner can see org data but NOT user data
  if (isTenantOwner) return true;
  if (["org_admin", "org_manager"].includes(userRole)) return true;
  return false;
}
