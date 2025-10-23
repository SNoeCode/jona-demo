// app/onboarding/page.tsx
'use client';
import { useAuth } from '@/context/AuthUserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {

      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user?.role) {
        const role = user.role;
        
        const roleRoutes: Record<string, string> = {
          admin: '/admin/dashboard',
          tenant_owner: '/admin/tenant',
          org_admin: '/org/admin',
          org_manager: '/org/manage',
          org_user: '/org/dashboard',
          recruiter: '/recruit',
          user: '/dashboard',
        };

        const redirectTo = roleRoutes[role] || '/dashboard';
        router.push(redirectTo);
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to JONA!
          </h1>
          <p className="text-gray-600">
            Your account has been created successfully
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800 mb-1">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Account ID:</strong> {user?.id.slice(0, 8)}...
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">
              🔔 Pending Setup
            </h3>
            <p className="text-sm text-yellow-800">
              Your account is ready, but you dont have any roles assigned yet.
              Please contact your administrator to:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 ml-2">
              <li>Assign you to an organization</li>
              <li>Set your role and permissions</li>
              <li>Grant access to platform features</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens next?
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>An administrator will review your account</li>
              <li>You will be assigned to an organization</li>
              <li>Your role and permissions will be configured</li>
              <li>You will receive access to your dashboard</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              View Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}