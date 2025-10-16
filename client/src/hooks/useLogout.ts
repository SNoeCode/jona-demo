"use client"

import { MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';

interface UseLogoutParams {
  setUser: (user: null) => void;
  setShowTimeoutWarning: (show: boolean) => void;
  timeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  warningTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
}

export function useLogout({
  setUser,
  setShowTimeoutWarning,
  timeoutRef,
  warningTimeoutRef,
}: UseLogoutParams) {
  const router = useRouter();

  return async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      localStorage.clear();
      setUser(null);
      setShowTimeoutWarning(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
}