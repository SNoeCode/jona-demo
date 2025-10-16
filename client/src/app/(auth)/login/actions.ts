'use server';
export const dynamic = 'force-dynamic';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function handleLogin(formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    console.error('Login failed:', error?.message);
    redirect('/login?error=invalid_credentials');
  }

  const role =
    data.user.user_metadata?.role ||
    data.user.app_metadata?.role ||
    'user';

  redirect(role === 'admin' ? '/admin/dashboard' : '/dashboard');
}