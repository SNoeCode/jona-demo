// lib/organizationForUser.ts
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