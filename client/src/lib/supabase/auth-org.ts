// lib/supabase/auth-org.ts
'use server'
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { toSerializableAuthUser, type AuthUser } from "@/types/user/authUser";
export interface OrgAuthResult {
  user: AuthUser;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  memberRole: string;
  role?: string; // alias for callers expecting `role`
  membership: {
    id: string;
    role: string;
    department: string | null;
    position: string | null;
    joined_at: string;
  };
}

export async function requireOrgAuth(organizationSlug: string): Promise<OrgAuthResult> {
  const supabase = await createClient();
  

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ No authenticated user for org access');
    redirect(`/login?redirect=/org/${organizationSlug}`);
  }
  
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', organizationSlug)
    .single();
  
  if (orgError || !org) {
    console.error('❌ Organization not found:', organizationSlug);
    redirect('/dashboard?error=org-not-found');
  }
  
  // Check membership
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  
  if (memberError) {
    console.error('❌ Membership lookup error:', memberError);
    redirect('/dashboard?error=membership-error');
  }
  
  if (!membership) {
    console.warn(`❌ User ${user.email} not a member of ${organizationSlug}`);
    redirect('/dashboard?error=not-a-member');
  }
  
  console.log('✅ Org auth verified:', {
    user: user.email,
    org: org.name,
    role: membership.role
  });
  
  return {
    user: toSerializableAuthUser(user),
    organizationId: org.id,
    organizationSlug: org.slug,
    organizationName: org.name,
    memberRole: membership.role,
    membership: {
      id: membership.id,
      role: membership.role,
      department: membership.department,
      position: membership.position,
      joined_at: membership.joined_at,
    },
  };
}

// Optional: Check if user has specific role in org
export async function requireOrgRole(
  organizationSlug: string,
  allowedRoles: string[]
): Promise<OrgAuthResult> {
  const orgAuth = await requireOrgAuth(organizationSlug);
  
  if (!allowedRoles.includes(orgAuth.memberRole)) {
    console.warn(`❌ User role ${orgAuth.memberRole} not in allowed roles:`, allowedRoles);
    redirect(`/org/${organizationSlug}?error=insufficient-permissions`);
  }
  
  return orgAuth;
}

// Check if user is org admin
export async function requireOrgAdmin(organizationSlug: string): Promise<OrgAuthResult> {
  return requireOrgRole(organizationSlug, ['admin', 'owner']);
}

// Just check auth without redirecting (for API routes)
export async function validateOrgMembership(
  organizationSlug: string,
  userId?: string
): Promise<OrgAuthResult | null> {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;
      targetUserId = user.id;
    }
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', organizationSlug)
      .single();
    
    if (orgError || !org) return null;
    
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', org.id)
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (memberError || !membership) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
   return {
  user: toSerializableAuthUser(user),
  organizationId: org.id,
  organizationSlug: org.slug,
  organizationName: org.name,
  memberRole: membership.role,
  role: membership.role, // alias
  membership: {
    id: membership.id,
    role: membership.role,
    department: membership.department,
    position: membership.position,
    joined_at: membership.joined_at,
  },
};
  } catch (error) { 
    console.error('Org membership validation error:', error);
    return null;
  }
}


import { supabase } from "@/lib/supabaseClient";
import { ORG_ROLE_PERMISSIONS } from "@/constants/rolePermissions";
import type {
  OrganizationContext,
  Organization,
  OrganizationMember,
  UserRole,
} from "@/types/organization";

export async function fetchOrganizationForUser(
  userId: string
): Promise<OrganizationContext | null> {
  const { data: membership } = await supabase
    .from("organization_members")
    .select("*, organizations (*)")
    .eq("user_id", userId)
    .single();

  if (membership?.organizations) {
    const role = membership.role as UserRole;
    
    // Use ORG_ROLE_PERMISSIONS instead of ROLE_PERMISSIONS
    const permissions = ORG_ROLE_PERMISSIONS[role] ?? ORG_ROLE_PERMISSIONS["user"];

    return {
      organization: membership.organizations as Organization,
      membership: membership as OrganizationMember,
      permissions,
    };
  }

  return null;
}