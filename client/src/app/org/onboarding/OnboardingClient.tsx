'use client';

import { useAuth } from '@/context/AuthUserContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OnboardingClient() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to the Platform!
          </h1>
          <p className="text-gray-600 mb-8">
            Your account has been created. Please complete your profile or contact an administrator
            to assign you to an organization.
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Account Status:</strong> Pending role assignment
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-800">
                You currently don’t have any roles assigned. Please contact your administrator
                to get access to the platform features.
              </p>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700">
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}