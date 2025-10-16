// lib/auth/convertToAuthUser.ts

import { User } from '@supabase/supabase-js';
import { AuthUser, UserRole, MetadataValue } from '@/types/user/index';
export function convertToAuthUser(supabaseUser: User | null): AuthUser {
  if (!supabaseUser || !supabaseUser.id || !supabaseUser.email) {
    throw new Error('Invalid Supabase user object');
  }

  const appMeta = supabaseUser.app_metadata ?? {};
  const userMeta = supabaseUser.user_metadata ?? {};

  const rawRole = userMeta.role ?? appMeta.role;
  const role: UserRole =
    rawRole === 'admin' || rawRole === 'user' || rawRole === 'job_seeker'
      ? rawRole
      : 'user';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role,
    aud: supabaseUser.aud ?? '',
    created_at: supabaseUser.created_at ?? '',
    app_metadata: appMeta as Record<string, MetadataValue>,
    user_metadata: userMeta,
  };
}
