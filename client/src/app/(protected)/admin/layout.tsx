// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('🔍 Admin Layout Check:', {
    hasSession: !!session,
    email: session?.user?.email,
    role: session?.user?.user_metadata?.role,
  });

  if (!session) {
    console.log('❌ No session in admin layout, redirecting to login');
    redirect('/login?redirect=/admin/dashboard');
  }

  const role = session.user.user_metadata?.role || session.user.app_metadata?.role;
  
  if (role !== 'admin') {
    console.warn(`❌ Non-admin role "${role}" blocked from admin area`);
    redirect('/dashboard');
  }

  console.log('✅ Admin layout passed, rendering children');
  return <>{children}</>;
}