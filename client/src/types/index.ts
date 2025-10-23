import type { User } from "@supabase/supabase-js";
export type UserRole =
  | "admin"           // System admin - HIGHEST privilege
  | "tenant_owner"    // Tenant owner
  | "org_admin"       // Org admin
  | "org_manager"     // Org manager
  | "org_user"        // Org member
  | "recruiter"       // Recruiter
  | "unassigned_user" // No org
  | "user";           // Default user

export type MetadataValue = string | number | boolean | null | undefined;

export interface UserMetadata {
  full_name?: string;
  name?: string;
  role?: UserRole;
  is_admin?: boolean;
  is_org_owner?: boolean;
  is_tenant_owner?: boolean;
  current_organization_id?: string;
  location?: string;
  resume_url?: string;
  subscription_type?: "free" | "pro" | "enterprise";
  [key: string]: MetadataValue;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tenant_id?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: "admin" | "manager" | "member" | "recruiter";
  is_active: boolean;
  joined_at: string;
  organization?: Organization;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  aud: string;
  created_at: string;
  last_sign_in_at?: string;

  app_metadata: Record<string, unknown>;
  user_metadata: UserMetadata;

  is_admin: boolean;
  is_org_owner: boolean;
  is_tenant_owner: boolean;

  current_organization_id?: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    is_active: boolean;
  }>;

  full_name?: string;
  location?: string;
  resume_url?: string;
  subscription_type?: "free" | "pro" | "enterprise";
   accessToken?: string;
}
export interface AdminUser extends AuthUser {
  role: "admin";
  is_admin: true;
  joined_date: string;
  last_login: string | null;
  status: "active" | "inactive";
  applications_sent: number;
  resumes_uploaded: number;
  jobs_saved: number;
  profile_completed: boolean;
  is_active: boolean;
  subscription_status: "active" | "inactive";
  plan_name: string;
  total_jobs_scraped: number;
  total_applications: number;
}

export interface PublicUser {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface SlimUser {
  id: string;
  email: string;
}
const validRoles: UserRole[] = [
  "admin",
  "tenant_owner",
  "org_admin",
  "org_manager",
  "org_user",
  "recruiter",
  "unassigned_user",
  "user",
];

export function toAuthUser(user: User | null): AuthUser | null {
  if (!user?.id || !user?.email) return null;

  const appMeta = user.app_metadata ?? {};
  const userMeta = user.user_metadata ?? {};

  const rawRole = appMeta.role ?? userMeta.role;
  const role: UserRole = validRoles.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : "user";

  return {
    id: user.id,
    email: user.email,
    role,
    roles: [role], 
    aud: user.aud ?? "",
    created_at: user.created_at ?? "",
    last_sign_in_at: user.last_sign_in_at,

    app_metadata: appMeta,
    user_metadata: userMeta as UserMetadata,

    is_admin: role === "admin" || userMeta.is_admin === true,
    is_org_owner: userMeta.is_org_owner === true,
    is_tenant_owner: role === "tenant_owner" || userMeta.is_tenant_owner === true,

    current_organization_id: userMeta.current_organization_id,
    organizations: [],

    full_name: userMeta.full_name ?? userMeta.name,
    location: userMeta.location,
    resume_url: userMeta.resume_url,
    subscription_type: userMeta.subscription_type as any,
  };
}

export function toAuthUserRequired(user: User | null): AuthUser {
  const authUser = toAuthUser(user);
  if (!authUser) {
    throw new Error("Invalid or missing user data");
  }
  return authUser;
}

export function toSerializableAuthUser(user: User): AuthUser {
  const authUser = toAuthUser(user);
  if (!authUser) {
    throw new Error("Cannot serialize invalid user");
  }
  return authUser;
}
export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.is_admin === true || user?.role === "admin";
}

export function isTenantOwner(user: AuthUser | null | undefined): boolean {
  return user?.is_tenant_owner === true || user?.role === "tenant_owner";
}

export function isOrgAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "org_admin";
}

export function hasOrgAccess(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.organizations.length > 0;
}

export function isPro(user: AuthUser | null | undefined): boolean {
  return user?.subscription_type === "enterprise" || user?.subscription_type === "pro";
}
export function toAdminUser(user: AuthUser): AdminUser {
  if (!isAdmin(user)) {
    throw new Error("User is not an admin");
  }

  return {
    ...user,
    role: "admin",
    is_admin: true,
    joined_date: user.created_at,
    last_login: user.last_sign_in_at ?? null,
    status: "active",
    applications_sent: 0,
    resumes_uploaded: 0,
    jobs_saved: 0,
    profile_completed: false,
    is_active: true,
    subscription_status: "active",
    plan_name: user.subscription_type ?? "free",
    total_jobs_scraped: 0,
    total_applications: 0,
  };
}