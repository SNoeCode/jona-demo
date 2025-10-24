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

    if (loading) return;


    if (requireAuth && !isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isAuthenticated && user && allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role || user.role;
      if (!allowedRoles.includes(userRole)) {
        console.warn(`Access denied: User role "${userRole}" not in allowed roles:`, allowedRoles);
        

        const roleRedirects: Record<string, string> = {
          admin: '/admin/dashboard',
          tenant_owner: '/admin/tenant',
          org_admin: '/org/select', // Let user select organization
          org_manager: '/org/select', // Let user select organization
          org_user: '/org/select', // Let user select organization
          recruiter: '/recruit',
          user: '/dashboard',
          unassigned_user: '/onboarding',
        };
        
        const redirectPath = roleRedirects[userRole] || '/dashboard';
        router.push(redirectPath);
        return;
      }
    }

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