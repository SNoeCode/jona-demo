'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthUserContext';

export default function HomePage() {
  const router = useRouter();
  const { authUser, isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;

    hasRedirected.current = true;

    if (isAuthenticated && authUser) {
      const targetPath = authUser.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.replace(targetPath);
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, loading]); // Only depend on these

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}