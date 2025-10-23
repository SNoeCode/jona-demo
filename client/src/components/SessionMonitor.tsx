'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SessionMonitorProps {
  children: React.ReactNode;
}

export function SessionMonitor({ children }: SessionMonitorProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirectedRef = useRef(false);

  const handleSessionTimeout = useCallback(async () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    await supabase.auth.signOut();
    router.push('/login?timeout=true&message=Your session has expired');
  }, [supabase, router]);

  useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = () => resetTimeout();

    events.forEach(event => {
      document.addEventListener(event, activityHandler);
    });

    resetTimeout();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.push('/login');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        resetTimeout();
      }
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
      subscription.unsubscribe();
    };
  }, [supabase, router, handleSessionTimeout]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Optional: sign out on tab close
      // await supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return <>{children}</>;
}