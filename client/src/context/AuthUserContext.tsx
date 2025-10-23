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
  OrganizationMember,
} from "@/types/organization";
import { supabase } from "@/lib/supabaseClient";
import { getPrimaryRole } from "@/utils/roleUtils";

interface AuthContextType {

  user: AuthUser | null;
  authUser: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  

  isAdmin: boolean;
  isOrgOwner: boolean;
  isTenantOwner: boolean;
  
  roles?: UserRole[];
  is_admin?: boolean;
  is_tenant_owner?: boolean;
   organization: OrganizationContext | null;
  organizations?: OrganizationMember[];
  current_organization_id?: string;
  

  accessToken?: string;
  
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
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [accessToken, setAccessToken] = useState<string | undefined>();
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

  const fetchUserProfile = useCallback(async (
    supabaseUser: User,
    token: string
  ) => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id, email, is_admin, is_tenant_owner")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error(
          "Profile fetch error:",
          profileError || "No user profile found"
        );
        return null;
      }
    const userRoles: UserRole[] = [];
      
      if (userProfile.is_admin) {
        userRoles.push("admin");
      }
      
      if (userProfile.is_tenant_owner) {
        userRoles.push("tenant_owner");
      }

       const { data: memberships, error: orgError } = await supabase
        .from("organization_members")
        .select(`
          *,
          organizations (*),
          users!organization_members_user_id_fkey (
            id,
            email,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq("user_id", supabaseUser.id)
        .eq("is_active", true);

      if (orgError) {
        console.error("Organization fetch error:", orgError);
      }

       const orgMemberships: OrganizationMember[] = memberships || [];
      
      if (orgMemberships?.length) {
     
        for (const membership of orgMemberships) {
          if (membership.role === "org_admin") userRoles.push("org_admin");
          else if (membership.role === "org_manager") userRoles.push("org_manager");
          else if (membership.role === "org_user") userRoles.push("org_user");
        }
      }

      if (userRoles.length === 0) {
        userRoles.push("unassigned_user");
      }
  let primaryRole: UserRole;
      if (typeof getPrimaryRole === 'function') {
        primaryRole = getPrimaryRole({
          is_admin: userProfile.is_admin,
          is_tenant_owner: userProfile.is_tenant_owner,
          organizations: orgMemberships.map((org) => ({ role: org.role })),
        });
      } else {
        primaryRole = normalizeRole(
          supabaseUser.user_metadata?.role || 
          supabaseUser.app_metadata?.role ||
          userRoles[0]
        );
      }

      const currentOrg = orgMemberships?.[0];
      if (currentOrg?.organizations) {
        const context: OrganizationContext = {
          organization: currentOrg.organizations,
          membership: currentOrg,
          permissions: {
            canManageMembers: ["org_admin"].includes(currentOrg.role),
            canManageSettings: ["org_admin"].includes(currentOrg.role),
            canManageBilling: false, // Only tenant owners can manage billing
            canViewAnalytics: ["org_admin", "org_manager"].includes(currentOrg.role),
            canInviteMembers: ["org_admin", "org_manager"].includes(currentOrg.role),
            canRemoveMembers: ["org_admin"].includes(currentOrg.role),
          },
        };
        setOrganization(context);
      }

      setOrganizations(orgMemberships);
      setRoles(userRoles);
      setAccessToken(token);

      return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        role: primaryRole,
        roles: userRoles,
        aud: supabaseUser.aud ?? "",
        created_at: supabaseUser.created_at ?? "",
        app_metadata: supabaseUser.app_metadata ?? {},
        user_metadata: supabaseUser.user_metadata ?? {},
        is_admin: userProfile.is_admin || false,
        is_org_owner: orgMemberships.some((m) => m.role === "org_admin"),
        is_tenant_owner: userProfile.is_tenant_owner || false,
        current_organization_id: orgMemberships[0]?.organization_id,
        organizations: orgMemberships,
        accessToken: token,
      };
    } catch (error) {
      console.error("Unexpected error fetching user profile:", error);
      return null;
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
     
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setUser(null);
        setAuthUser(null);
        setOrganization(null);
        setOrganizations([]);
        setRoles([]);
        setAccessToken(undefined);
        return;
      }

      if (!session?.user) {
        setUser(null);
        setAuthUser(null);
        setOrganization(null);
        setOrganizations([]);
        setRoles([]);
        setAccessToken(undefined);
        return;
      }

      const supabaseUser = session.user;
      const fullUser = await fetchUserProfile(supabaseUser, session.access_token);
      
      if (fullUser) {
     
        setUser(fullUser);
        setAuthUser(fullUser);
      } else {
       
        const basicUser = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          role: normalizeRole(
            supabaseUser.user_metadata?.role || supabaseUser.app_metadata?.role
          ),
          aud: supabaseUser.aud ?? "",
          created_at: supabaseUser.created_at ?? "",
          app_metadata: supabaseUser.app_metadata ?? {},
          user_metadata: supabaseUser.user_metadata ?? {},
        };
        
        setUser(basicUser);
        setAuthUser(basicUser);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
      setAuthUser(null);
      setOrganization(null);
      setOrganizations([]);
      setRoles([]);
      setAccessToken(undefined);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

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
          setOrganizations([]);
          setRoles([]);
          setAccessToken(undefined);
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
          is_admin: (metadata?.is_admin as boolean) || false,
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
    try {
      console.log('🔴 Starting logout process...');
      
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
      
      } else {
        console.log('✅ Supabase session cleared');
      }
      
      setUser(null);
      setAuthUser(null);
      setOrganization(null);
      setOrganizations([]);
      setRoles([]);
      setAccessToken(undefined);
      

      localStorage.clear();
      
      console.log('🔄 Redirecting to login...');
      

      router.push("/login");
      
   
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
    } catch (err) {
      console.error('❌ Logout exception:', err);
            setUser(null);
      setAuthUser(null);
      setOrganization(null);
      setOrganizations([]);
      setRoles([]);
      setAccessToken(undefined);
      
      window.location.href = '/login';
    }
  }, [router]);

  const switchOrganization = useCallback(async (orgId: string) => {
    try {
     
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
        },
        credentials: "include",
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
      
 
      isAdmin: user?.role === "admin" || user?.is_admin || false,
      isOrgOwner: !!user?.is_org_owner,
      isTenantOwner: !!user?.is_tenant_owner,

      roles,
      is_admin: user?.is_admin,
      is_tenant_owner: user?.is_tenant_owner,

      organization,
      organizations,
      current_organization_id: user?.current_organization_id,
      
   
      accessToken,
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
      organizations,
      roles,
      accessToken,
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
export const AuthProvider = AuthUserProvider;