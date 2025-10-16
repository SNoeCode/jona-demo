'use client'
import { useContext } from 'react'
import { AuthUserContext } from '@/context/AuthUserContext'
"use client";
import React, {
  createContext,

  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type {
  AuthUser,
  UserRole,
  OrganizationContext,
} from "@/types/organization";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: AuthUser | null;
  authUser: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrgOwner: boolean;
  isTenantOwner: boolean;
  organization: OrganizationContext | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthUserProvider");
  }
  return context;
};