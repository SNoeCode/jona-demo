// lib/supabase/auth-server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { toSerializableAuthUser, type AuthUser } from "@/types/user/authUser";
import { Database } from '@/types/database';

export async function requireAdminAuth(): Promise<AuthUser> {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('🔐 requireAdminAuth check:', {
    hasSession: !!session,
    email: session?.user?.email,
    role: session?.user?.user_metadata?.role,
  });

  if (!session) {
    console.log('❌ No session, redirecting to login');
    redirect('/login?redirect=/admin/dashboard');
  }

  const role = session.user.user_metadata?.role || session.user.app_metadata?.role;

  if (role !== 'admin') {
    console.warn(`❌ Non-admin role "${role}" attempted admin access`);
    redirect('/dashboard');
  }

  console.log('✅ Admin auth verified');

  // Map to AuthUser type
  const authUser: AuthUser = {
    id: session.user.id,
    email: session.user.email!,
    role: role as any,
    aud: session.user.aud,
    created_at: session.user.created_at!,
    app_metadata: session.user.app_metadata,
    user_metadata: session.user.user_metadata,
    is_admin: role === 'admin',
  };

  return authUser;
}

export async function getServerSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireUserAuth(): Promise<AuthUser> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Auth error in requireUserAuth:', error);
    redirect("/login");
  }

  return toSerializableAuthUser(user);
}