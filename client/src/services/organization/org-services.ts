'use server';

import { createClient } from '@/lib/supabase/server';
import type { OrgRole, Organization } from '@/types/org/organization';
import type { Database } from '@/types/database';
import { ROLE_PERMISSIONS } from '@/constants/rolePermissions'; 

type UserOrgRole = Database['public']['Tables']['user_org_roles']['Row'];

export class OrgService {
  static async getUserOrgRole(userId: string): Promise<UserOrgRole | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_org_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching user org role:', error);
      return null;
    }

    return data;
  }

  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    const supabase = await createClient();
    const userRole = await this.getUserOrgRole(userId);
    if (!userRole) return [];

    // tenant_id does not exist on userRole, so we cannot filter by it
    if (userRole.role === 'tenant_owner') {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        // You may want to filter by a tenant_id if you have it elsewhere
        // .eq('tenant_id', someTenantId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching tenant organizations:', error);
        return [];
      }

      return data || [];
    }

    if (userRole.organization_id) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userRole.organization_id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching user organization:', error);
        return [];
      }

      return data ? [data] : [];
    }

    return [];
  }

  static async canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const supabase = await createClient();
    const userRole = await this.getUserOrgRole(userId);
    if (!userRole) return false;

    // tenant_id does not exist on userRole, so we cannot filter by it
    if (userRole.role === 'tenant_owner') {
      const { data } = await supabase
        .from('organizations')
        .select('tenant_id')
        .eq('id', organizationId)
        .single();

      // Fix: data may be null or not have tenant_id, so check for data and compare with userRole.organization_id
      if (data && typeof data === 'object' && data !== null && (data as { tenant_id?: string }).tenant_id !== undefined) {
        return (data as { tenant_id: string }).tenant_id === userRole.organization_id;
      }
      return false;
    }

    return userRole.organization_id === organizationId;
  }

  static async getOrganizationUsers(
    organizationId: string,
    requestingUserId: string
  ): Promise<UserOrgRole[]> {
    const supabase = await createClient();
    const canAccess = await this.canAccessOrganization(
      requestingUserId,
      organizationId
    );

    if (!canAccess) {
      throw new Error('Unauthorized: Cannot access this organization');
    }

    const { data, error } = await supabase
      .from('user_org_roles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching organization users:', error);
      return [];
    }

    return data || [];
  }

  static async assignRole(
    userId: string,
    role: OrgRole,
    organizationId?: string,
    tenantId?: string
  ): Promise<UserOrgRole | null> {
    const supabase = await createClient();

    const payload: Partial<UserOrgRole> = {
      user_id: userId,
      role,
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_org_roles' as any)
      .insert(payload as any)
      .select()
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      return null;
    }

    return data;
  }

  static async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from('user_org_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error removing user from organization:', error);
      return false;
    }

    return true;
  }

  static async hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    const userRole = await this.getUserOrgRole(userId);
    if (!userRole) return false;

    const permissions = ROLE_PERMISSIONS[userRole.role as keyof typeof ROLE_PERMISSIONS];
    return permissions?.[permission as keyof typeof permissions] === true;
  }
}
