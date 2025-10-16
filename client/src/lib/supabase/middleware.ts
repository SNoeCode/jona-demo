import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AuthUser } from '@/types/user';
export function checkAdminAccess(user: AuthUser | null): boolean {
  return !!user && (user.role === 'admin' || user.user_metadata?.role === 'admin');
}