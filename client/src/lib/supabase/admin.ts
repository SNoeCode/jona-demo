
'use server';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';
import { toAuthUser, AuthUser } from '@/types/user';
import { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// ✅ Validates admin using bearer token without triggering refresh logic
export async function validateAdminAuth(request: NextRequest): Promise<AuthUser | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const supabase = await getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  const role = user.user_metadata?.role || user.app_metadata?.role;
  if (role !== 'admin') return null;

  return toAuthUser(user);
}

// ✅ Returns error response without triggering session refresh
export async function createAuthResponse(
  message: string,
  status: number
): Promise<NextResponse> {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ✅ Middleware avoids unnecessary refresh unless session is explicitly needed
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Only hydrate session if needed downstream
  // const { data: { session } } = await supabase.auth.getSession();

  return res;
}