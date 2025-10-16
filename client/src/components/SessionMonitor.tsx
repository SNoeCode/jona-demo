'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SessionMonitorProps {
  children: React.ReactNode;
}

export function SessionMonitor({ children }: SessionMonitorProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSessionTimeout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login?timeout=true&message=Your session has expired');
  }, [supabase, router]);

  useEffect(() => {
    // Session timeout: 30 minutes (1800000ms)
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = () => resetTimeout();

    events.forEach(event => {
      document.addEventListener(event, activityHandler);
    });

    // Initialize timeout
    resetTimeout();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        resetTimeout();
      }
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
      subscription.unsubscribe();
    };
  }, [supabase, router, handleSessionTimeout]);

  // Handle window/tab close - trigger sign out
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Optional: Sign out on window close (remove this if you want persistent sessions)
      // await supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [supabase]);

  return <>{children}</>;
}