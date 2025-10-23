import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export const supabase = createClientComponentClient<Database>({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Session refresh error:', error);
  }
  return { data, error };
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error);
  }
  return { session, error };
}