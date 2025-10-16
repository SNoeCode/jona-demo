// client/src/hooks/useSessionManager.ts
"use client"

import { useCallback, useRef, useState, useEffect } from "react";
import { AuthUser } from "@/types/user/index";
import { supabase } from "@/lib/supabaseClient"; // Fix import path

const AUTH_TIMEOUT = 2 * 60 * 60 * 1000;

export const useSessionManager = (setUser: (user: AuthUser | null) => void) => {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowTimeoutWarning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  }, [setUser]);

  const resetAuthTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, AUTH_TIMEOUT - 10 * 60 * 1000);

    timeoutRef.current = setTimeout(() => {
      handleLogout();
      alert("Session expired due to inactivity.");
    }, AUTH_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const activityHandler = () => resetAuthTimeout();
    window.addEventListener("mousemove", activityHandler);
    window.addEventListener("keydown", activityHandler);
    return () => {
      window.removeEventListener("mousemove", activityHandler);
      window.removeEventListener("keydown", activityHandler);
    };
  }, [resetAuthTimeout]);

  return { showTimeoutWarning, resetAuthTimeout, handleLogout };
};