"use client";
import React, {
  createContext,
  useContext,
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

export const AuthUserContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isOrgOwner: false,
  isTenantOwner: false,
  organization: null,
  signIn: async () => ({ user: null, error: null }),
  signUp: async () => ({ user: null, error: null }),
  signOut: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  switchOrganization: async () => {},
});

export const useAuth = () => useContext(AuthUserContext);

export const AuthUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationContext | null>(
    null
  );
  const router = useRouter();

  const normalizeRole = (role: string | undefined): UserRole => {
    const allowed: UserRole[] = [
      "user",
      "admin",
      "tenant_owner",
      "org_admin",
      "org_manager",
      "org_user",
      "recruiter",
      "unassigned_user",
    ];
    return allowed.includes(role as UserRole) ? (role as UserRole) : "user";
  };

  const checkUser = useCallback(async () => {
    try {
      // CRITICAL: Get both user and session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setUser(null);
        setAuthUser(null);
        setOrganization(null);
        return;
      }

      if (!session?.user) {
        setUser(null);
        setAuthUser(null);
        setOrganization(null);
        return;
      }

      const supabaseUser = session.user;

      // Set authUser
      setAuthUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        role: normalizeRole(
          supabaseUser.user_metadata?.role || supabaseUser.app_metadata?.role
        ),
        aud: supabaseUser.aud ?? "",
        created_at: supabaseUser.created_at ?? "",
        app_metadata: supabaseUser.app_metadata ?? {},
        user_metadata: supabaseUser.user_metadata ?? {},
      });

      // Fetch organization membership
      try {
        const { data: membership, error: orgError } = await supabase
          .from("organization_members")
          .select("*, organizations (*)")
          .eq("user_id", supabaseUser.id)
          .eq("is_active", true)
          .maybeSingle();

        if (orgError) {
          console.error("Organization fetch error:", orgError);
        } else if (membership?.organizations) {
          const role = membership.role;
          const context: OrganizationContext = {
            organization: membership.organizations,
            membership,
            permissions: {
              canManageMembers: ["org_admin", "owner", "admin"].includes(role),
              canManageSettings: ["org_admin", "owner", "admin"].includes(role),
              canManageBilling: ["owner"].includes(role),
              canViewAnalytics: ["org_admin", "org_manager", "owner", "admin", "manager"].includes(role),
              canInviteMembers: ["org_admin", "org_manager", "owner", "admin", "manager"].includes(role),
              canRemoveMembers: ["org_admin", "owner", "admin"].includes(role),
            },
          };
          setOrganization(context);
        }
      } catch (orgErr) {
        console.error("Organization query failed:", orgErr);
        setOrganization(null);
      }

      // Set main user
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        role: normalizeRole(
          supabaseUser.user_metadata?.role || supabaseUser.app_metadata?.role
        ),
        aud: supabaseUser.aud ?? "",
        created_at: supabaseUser.created_at ?? "",
        app_metadata: supabaseUser.app_metadata ?? {},
        user_metadata: supabaseUser.user_metadata ?? {},
        is_org_owner: supabaseUser.user_metadata?.is_org_owner || false,
        is_tenant_owner: supabaseUser.user_metadata?.is_tenant_owner || false,
      });
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
      setAuthUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkUser();
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await checkUser();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setAuthUser(null);
          setOrganization(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [checkUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { user: null, error: error as Error };
      }

      if (data.session && data.user) {
        // CRITICAL: Wait for session to be fully established
        // The onAuthStateChange listener will trigger checkUser()
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("✅ Sign in successful:", data.user.email);
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error("Sign in exception:", err);
      return { user: null, error: err as Error };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { user: null, error: error as Error };
      }

      if (data.user) {
        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email ?? "",
          role: (metadata?.role as string) || "user",
          is_org_owner: (metadata?.is_org_owner as boolean) || false,
          is_tenant_owner: (metadata?.is_tenant_owner as boolean) || false,
        });

        await checkUser();
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err as Error };
    }
  }, [checkUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
    setOrganization(null);
    router.push("/login");
  }, [router]);

  const switchOrganization = useCallback(async (orgId: string) => {
    try {
      // Ensure we have a session before making API call
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No session available for organization switch");
        return;
      }

      const response = await fetch("/api/user/update-current-org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the session token if needed by your API
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        await checkUser();
        router.push("/org/dashboard");
      } else {
        const errorText = await response.text();
        console.error("Failed to switch organization:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error switching organization:", error);
    }
  }, [checkUser, router]);

  const value = useMemo(
    () => ({
      user,
      authUser,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isOrgOwner: !!user?.is_org_owner,
      isTenantOwner: !!user?.is_tenant_owner,
      organization,
      signIn,
      signUp,
      signOut,
      logout: signOut,
      refreshUser: checkUser,
      switchOrganization,
    }),
    [
      user,
      authUser,
      loading,
      organization,
      signIn,
      signUp,
      signOut,
      checkUser,
      switchOrganization,
    ]
  );

  return (
    <AuthUserContext.Provider value={value}>
      {children}
    </AuthUserContext.Provider>
  );
};