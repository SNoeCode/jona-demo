// client/src/middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/org/login",
    "/org/register",
  ];

  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // 🔒 Redirect unauthenticated users away from protected routes
  if (!session && !isPublicRoute) {
    console.log(`🔒 No session - redirecting to login from: ${path}`);
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // 🔁 Redirect authenticated users away from public auth pages
  if (session && isPublicRoute) {
    console.log(`🔁 Session exists on public route: ${path}`);
    
    try {
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("id, is_admin, is_tenant_owner, is_org_owner")
        .eq("id", session.user.id)
        .maybeSingle();

      if (userError) {
        console.error("❌ Error fetching user profile:", userError);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      if (!userProfile) {
        console.warn("⚠️ No user profile found for session user");
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // System Admin - highest priority
      if (userProfile.is_admin) {
        console.log("✅ Admin user - redirecting to admin dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }

      // Tenant Owner
      if (userProfile.is_tenant_owner) {
        console.log("✅ Tenant owner - redirecting to tenant dashboard");
        return NextResponse.redirect(new URL("/tenant/dashboard", req.url));
      }

      // Check organization membership
      const { data: memberships, error: memberError } = await supabase
        .from("organization_members")
        .select(`
          organization_id, 
          role, 
          is_active,
          organizations!inner(id, name, slug)
        `)
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (memberError) {
        console.error("❌ Error fetching memberships:", memberError);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // If user has organization memberships
      if (memberships && memberships.length > 0) {
        const membership = memberships[0];
        const org = membership.organizations;

        if (org && typeof org === 'object' && 'slug' in org) {
          const role = membership.role;
          let dashboardPath = '';
          
          console.log(`✅ User has org membership - Role: ${role}, Org: ${org.slug}`);
          
          switch (role) {
            case 'owner':
              dashboardPath = `/org/owner/${org.slug}/dashboard`;
              break;
            case 'admin':
              dashboardPath = `/org/admin/${org.slug}/dashboard`;
              break;
            case 'manager':
              dashboardPath = `/org/manager/${org.slug}/dashboard`;
              break;
            case 'member':
            case 'user':
              dashboardPath = `/org/member/${org.slug}/dashboard`;
              break;
            case 'recruiter':
              dashboardPath = `/org/recruiter/${org.slug}/dashboard`;
              break;
            default:
              console.warn(`⚠️ Unknown role: ${role}`);
              dashboardPath = `/org/${org.slug}/dashboard`;
          }
          
          console.log(`➡️ Redirecting to: ${dashboardPath}`);
          return NextResponse.redirect(new URL(dashboardPath, req.url));
        }
      }

      // No org membership — fallback to generic dashboard
      console.log("ℹ️ No org membership - redirecting to generic dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
      
    } catch (error) {
      console.error("❌ Middleware error:", error);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Verify user has access to role-specific routes
  if (session && path.startsWith('/org/')) {
    const pathParts = path.split('/');
    // Path structure: /org/{role}/{slug}/...
    if (pathParts.length >= 4) {
      const routeRole = pathParts[2]; // 'owner', 'admin', 'manager', 'member', 'recruiter'
      const orgSlug = pathParts[3];
      
      // Skip verification for non-role routes (like /org/login, /org/register)
      const roleRoutes = ['owner', 'admin', 'manager', 'member', 'recruiter'];
      if (!roleRoutes.includes(routeRole)) {
        return res;
      }

      try {
        // Verify user has the correct role for this route
        const { data: memberships, error: memberError } = await supabase
          .from("organization_members")
          .select(`
            role,
            organizations!inner(slug)
          `)
          .eq("user_id", session.user.id)
          .eq("is_active", true);

        if (memberError) {
          console.error("❌ Error verifying membership:", memberError);
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Find the membership for this specific org
        const membership = memberships?.find((m) => {
          const org = m.organizations;
          return org && typeof org === 'object' && 'slug' in org && org.slug === orgSlug;
        });

        if (!membership) {
          console.warn(`⚠️ User not member of org: ${orgSlug}`);
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        const org = membership.organizations;
        if (org && typeof org === 'object' && 'slug' in org && org.slug !== orgSlug) {
          console.warn(`⚠️ Org slug mismatch`);
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Verify role matches the route
        const userRole = membership.role;
        
        // Map 'member' route to both 'member' and 'user' db roles
        if (routeRole === 'member' && (userRole === 'member' || userRole === 'user')) {
          return res;
        }
        
        if (userRole !== routeRole) {
          console.warn(`⚠️ Role mismatch: user has ${userRole}, trying to access ${routeRole}`);
          // Redirect to correct dashboard for their role
          let correctPath = '';
          switch (userRole) {
            case 'owner':
              correctPath = `/org/owner/${orgSlug}/dashboard`;
              break;
            case 'admin':
              correctPath = `/org/admin/${orgSlug}/dashboard`;
              break;
            case 'manager':
              correctPath = `/org/manager/${orgSlug}/dashboard`;
              break;
            case 'member':
            case 'user':
              correctPath = `/org/member/${orgSlug}/dashboard`;
              break;
            case 'recruiter':
              correctPath = `/org/recruiter/${orgSlug}/dashboard`;
              break;
            default:
              correctPath = `/org/${orgSlug}/dashboard`;
          }
          return NextResponse.redirect(new URL(correctPath, req.url));
        }
      } catch (error) {
        console.error("❌ Role verification error:", error);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};