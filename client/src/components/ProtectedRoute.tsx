// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthUserContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireOrgAccess?: boolean;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireOrgAccess = false,
  redirectTo = '/login',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, organization } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role permissions
    if (isAuthenticated && user && allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role || user.role;
      if (!allowedRoles.includes(userRole)) {
        console.warn(`Access denied: User role "${userRole}" not in allowed roles:`, allowedRoles);
        
        // Redirect to appropriate dashboard based on role
        const roleRedirects: Record<string, string> = {
          admin: '/admin/dashboard',
          tenant_owner: '/admin/tenant',
          org_admin: '/org/admin',
          org_manager: '/org/manage',
          org_user: '/org/dashboard',
          recruiter: '/recruit',
          user: '/dashboard',
          unassigned_user: '/onboarding',
        };
        
        const redirectPath = roleRedirects[userRole] || '/dashboard';
        router.push(redirectPath);
        return;
      }
    }

    // Check organization access
    if (isAuthenticated && user && requireOrgAccess) {
      const hasOrgAccess = 
        user.is_org_owner ||
        user.current_organization_id ||
        organization?.organization?.id;

      if (!hasOrgAccess) {
        console.warn('Access denied: User does not have organization access');
        router.push('/dashboard');
        return;
      }
    }
  }, [
    user,
    isAuthenticated,
    loading,
    allowedRoles,
    requireOrgAccess,
    organization,
    router,
    redirectTo,
    requireAuth,
  ]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user should have access
  const hasAccess = () => {
    if (requireAuth && !isAuthenticated) return false;
    
    if (allowedRoles && user) {
      const userRole = user.role;
      if (!allowedRoles.includes(userRole)) return false;
    }

    if (requireOrgAccess && user) {
      const hasOrgAccess = 
        user.is_org_owner ||
        user.current_organization_id ||
        organization?.organization?.id;
      if (!hasOrgAccess) return false;
    }

    return true;
  };
  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}