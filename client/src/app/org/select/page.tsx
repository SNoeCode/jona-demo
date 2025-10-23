'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Briefcase, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 
interface Organization {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  user_role: string;
  member_count: number;
  active_jobs: number;
}

export default function OrgSelectPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);
const fetchOrganizations = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('No valid session found');
    }

    const response = await fetch('/api/org/user-organizations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Organizations fetch failed:', errorText);
      throw new Error('Failed to fetch organizations');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch organizations');
    }

    setOrganizations(data.organizations || []);
  } catch (err: any) {
    console.error('Failed to fetch organizations:', err);
    setError(err.message || 'Failed to load organizations');
  } finally {
    setLoading(false);
  }
};
const selectOrganization = async (org: Organization) => {
  setSelecting(org.organization_id);
  setError(null);

  try {
    // 🔐 Get the current session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('No valid session found');
    }

    // ✅ Pass the token in the Authorization header
    const response = await fetch('/api/org/update-current-org', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: org.organization_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update org failed:', errorText);
      throw new Error('Failed to set current organization');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to set current organization');
    }

    // Redirect based on role
    if (org.user_role === 'owner') {
      router.push(`/org/owner/${org.organization_slug}/dashboard`);
    } else {
      router.push(`/org/${org.organization_slug}/dashboard`);
    }
  } catch (err: any) {
    console.error('Failed to select organization:', err);
    setError(err.message || 'Failed to select organization');
    setSelecting(null);
  }
};



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Select Organization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose which organization you want to access
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {organizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You're not a member of any organizations yet.
            </p>
            <button
              onClick={() => router.push('/org/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <button
                key={org.organization_id}
                onClick={() => selectOrganization(org)}
                disabled={selecting !== null}
                className="w-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {org.organization_name}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {org.user_role}
                        </span>
                        
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                        </span>
                        
                        <span className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {org.active_jobs} {org.active_jobs === 1 ? 'job' : 'jobs'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {selecting === org.organization_id ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/org/register')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            + Create New Organization
          </button>
        </div>
      </div>
    </div>
  );
}