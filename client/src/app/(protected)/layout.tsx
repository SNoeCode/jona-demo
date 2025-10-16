// app/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
 
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('🔍 Protected Layout Check:', {
    hasSession: !!session,
    email: session?.user?.email,
    role: session?.user?.user_metadata?.role,
  });

  // Redirect to login if no session
  if (!session) {
    console.log('❌ No session in protected layout, redirecting to login');
    redirect('/login');
  }

  console.log('✅ Protected layout passed, rendering children');
  return <>{children}</>;
}