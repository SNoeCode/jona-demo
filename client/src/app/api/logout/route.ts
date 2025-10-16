// /app/api/logout/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout failed:', error);
  }

  return NextResponse.redirect(new URL('/login', request.url));
}