// jona-demo\client\src\app\org\layout.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = cookies().get('next-url')?.value || '';

  // ✅ Allow unauthenticated access to /org/login
  if (pathname === '/org/login') {
    return <>{children}</>;
  }

  if (!session) {
    redirect('/org/login');
  }

  return <>{children}</>;
}

