
import type { User, Session } from "@supabase/supabase-js";
import { OrganizationMember } from "../organization";

// Supabase primitives
export type SupabaseUser = User;
export type SupabaseSession = Session;

// Role typing
export type UserRole =
  | "user"
  | "admin"
  | "tenant_owner"
  | "org_admin"
  | "org_manager"
  | "org_user"
  | "recruiter"
  | "unassigned_user";

export type SuperUserRole = Extract<UserRole, "tenant_owner">;

// Metadata typing
export type MetadataValue = string | number | boolean | null | undefined;

export interface UserMetadata {
  full_name?: string;
  role?: UserRole;
  is_org_owner?: boolean;
  is_tenant_owner?: boolean;
  current_organization_id?: string;
  [key: string]: MetadataValue;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  aud: string;
  created_at: string;
  last_sign_in_at?: string;
  full_name?: string;
  resume_url?: string;
  subscription_type?: string;

  app_metadata: Record<string, unknown>;
  user_metadata: UserMetadata;

  joined_date?: string;
  last_login?: string | null;
  status?: string;
  applications_sent?: number;
  resumes_uploaded?: number;
  jobs_saved?: number;

  current_organization_id?: string;
  is_admin?: boolean;
  is_org_owner?: boolean;
  is_tenant_owner?: boolean;
  organizations?: OrganizationMember[];
}

export interface PublicUser {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface SlimUser {
  id: string;
  email?: string;
}

export type UserType = Pick<PublicUser, "id" | "email" | "name"> | null;

const validRoles: UserRole[] = [
  "user",
  "admin",
  "tenant_owner",
  "org_admin",
  "org_manager",
  "org_user",
  "recruiter",
  "unassigned_user",
];

export function toAuthUser(user: SupabaseUser | null): AuthUser | null {
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
    aud: user.aud ?? "",
    created_at: user.created_at ?? "",
    last_sign_in_at:
      "last_sign_in_at" in user && typeof user.last_sign_in_at === "string"
        ? user.last_sign_in_at
        : "",

    full_name: userMeta.full_name ?? userMeta.name,
    resume_url: userMeta.resume_url as string | undefined,
    subscription_type: userMeta.subscription_type as string | undefined,

    app_metadata: appMeta,
    user_metadata: userMeta,

    current_organization_id: userMeta.current_organization_id ?? undefined,
    is_admin: role === "admin",
    is_org_owner: userMeta.is_org_owner === true,
    is_tenant_owner: userMeta.is_tenant_owner === true,

    organizations: (user as any).organizations ?? [],
  };
}

export function toAuthUserRequired(user: SupabaseUser | null): AuthUser {
  const authUser = toAuthUser(user);
  if (!authUser) {
    throw new Error("Invalid or missing user data");
  }
  return authUser;
}
export function toSerializableAuthUser(user: User): AuthUser {
  const appMeta = user.app_metadata ?? {};
  const userMeta = user.user_metadata ?? {};
  
  const rawRole = appMeta.role ?? userMeta.role;
  const role: UserRole = validRoles.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : "user";

  return {
    id: user.id,
    email: user.email ?? "",
    role,  // ✅ Added
    aud: user.aud ?? "",  // ✅ Added
    user_metadata: userMeta,
    app_metadata: appMeta,
    created_at: user.created_at ?? "",
    last_sign_in_at: user.last_sign_in_at ?? "",
  };
}
/**
 * Type guard to check if a user is an admin
 */
export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.user_metadata?.role === 'admin';
}

/**
 * Type guard to check if a user has a pro subscription
 */
export function isPro(user: AuthUser | null | undefined): boolean {
  return user?.user_metadata?.subscription_type === 'enterprise';
}