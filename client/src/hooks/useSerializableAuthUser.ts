'use client'
import { useRef, useMemo } from 'react';
import { AuthUser } from '@/types/user';
export function useSerializableAuthUser(user: AuthUser | null): AuthUser | null {
  const lastSerializedRef = useRef<AuthUser | null>(null);

  return useMemo(() => {
    if (!user) return null;

    const last = lastSerializedRef.current;
    const isSame =
      last &&
      user.id === last.id &&
      user.email === last.email &&
      user.role === last.role &&
      user.current_organization_id === last.current_organization_id;

    if (isSame) return last;

    const serialized = {
      id: user.id,
      email: user.email,
      role: user.role,
      aud: user.aud,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      full_name: user.full_name,
      resume_url: user.resume_url,
      subscription_type: user.subscription_type,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      current_organization_id: user.current_organization_id,
      is_admin: user.is_admin,
      is_org_owner: user.is_org_owner,
      is_tenant_owner: user.is_tenant_owner,
      organizations: user.organizations,
    };

    lastSerializedRef.current = serialized;
    return serialized;
  }, [user]);
}
