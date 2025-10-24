'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthUserContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function OrgLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setLoading(true);
//   setError(null);

//   try {
//     console.log('🔍 Step 1: Signing in user...');

//     const { user, error: signInError } = await signIn(email, password);

//     if (signInError) throw new Error(signInError.message || 'Failed to sign in');
//     if (!user?.id) throw new Error('User ID not returned from signin');

//     console.log('✅ User signed in:', user.email);

//     // Step 2: Wait for session
//     console.log('🔍 Step 2: Waiting for session...');
//     let session = null;
//     let attempts = 0;
//     const maxAttempts = 10;

//     while (!session && attempts < maxAttempts) {
//       await new Promise(resolve => setTimeout(resolve, 300));
//       const { data: { session: currentSession } } = await supabase.auth.getSession();
//       if (currentSession?.access_token) {
//         session = currentSession;
//         break;
//       }
//       attempts++;
//     }

//     if (!session?.access_token) throw new Error('Session not established after signin');
//     console.log('✅ Session established');

//     // Step 3: Fetch organizations with token
//     console.log('🔍 Step 3: Fetching user organizations...');

//     const orgsResponse = await fetch('/api/org/user-organizations', {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${session.access_token}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!orgsResponse.ok) {
//       const errorText = await orgsResponse.text();
//       console.error('Organizations fetch failed:', errorText);
//       throw new Error('Failed to fetch organizations');
//     }

//     const orgsData = await orgsResponse.json();

//     if (!orgsData.success) {
//       throw new Error(orgsData.message || 'Failed to fetch organizations');
//     }

//     const organizations = orgsData.organizations || [];
//     console.log(`✅ Found ${organizations.length} organizations`);

//     if (organizations.length === 0) {
//       console.log('No organizations found, redirecting to create page');
//       router.push('/org/register');
//       return;
//     }

//     console.log('✅ Redirecting to organization select page');
//     router.push('/org/select');

//   } catch (err: any) {
//     console.error('❌ Login error:', err);
//     setError(err.message || 'Failed to sign in');
//   } finally {
//     setLoading(false);
//   }
// };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    console.log('🔍 Step 1: Signing in user...');

    const { user, error: signInError } = await signIn(email, password);

    if (signInError) throw new Error(signInError.message || 'Failed to sign in');
    if (!user?.id) throw new Error('User ID not returned from signin');

    console.log('✅ User signed in:', user.email);

    console.log('🔍 Step 2: Waiting for session...');
    let session = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!session && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token && currentSession?.refresh_token) {
        session = currentSession;
        break;
      }
      attempts++;
    }

    if (!session?.access_token || !session?.refresh_token) {
      throw new Error('Session not established after signin');
    }

    console.log('✅ Session established');

    // ✅ Set cookie for SSR
    try {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      console.log('✅ Supabase cookie set — waiting for context to stabilize...');
    } catch (err) {
      console.error('❌ setSession threw:', err);
      throw new Error('Failed to persist session');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // ✅ Step 3: Fetch organizations
    console.log('🔍 Step 3: Fetching user organizations...');

    const orgsResponse = await fetch('/api/org/user-organizations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orgsResponse.ok) {
      const errorText = await orgsResponse.text();
      console.error('Organizations fetch failed:', errorText);
      throw new Error('Failed to fetch organizations');
    }

    const orgsData = await orgsResponse.json();

    if (!orgsData.success) {
      throw new Error(orgsData.message || 'Failed to fetch organizations');
    }

    const organizations = orgsData.organizations || [];
    console.log(`✅ Found ${organizations.length} organizations`);

    if (organizations.length === 0) {
      console.log('No organizations found, redirecting to create page');
      router.push('/org/register');
      return;
    }

    console.log('✅ Redirecting to organization select page');
    router.push('/org/select');

  } catch (err: any) {
    console.error('❌ Login error:', err);
    setError(err.message || 'Failed to sign in');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In to Organization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access your team workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Email
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an organization?{' '}
            <Link
              href="/org/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}