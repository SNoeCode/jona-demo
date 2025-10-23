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

    // Step 2: Wait for session
    console.log('🔍 Step 2: Waiting for session...');
    let session = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!session && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        session = currentSession;
        break;
      }
      attempts++;
    }

    if (!session?.access_token) throw new Error('Session not established after signin');
    console.log('✅ Session established');

    // Step 3: Fetch organizations with token
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
// // client/src/app/org/login/page.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabaseClient';
// import Link from 'next/link';
// import { Building2, Mail, Lock, ArrowRight, Shield } from 'lucide-react';

// export default function OrgLoginPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [debugInfo, setDebugInfo] = useState<string[]>([]);
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     organizationSlug: '',
//   });

//   const addDebug = (message: string) => {
//     console.log('🔍', message);
//     setDebugInfo(prev => [...prev, message]);
//   };

//   // Helper function to add timeout to promises
//   const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
//     return Promise.race([
//       promise,
//       new Promise<T>((_, reject) =>
//         setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
//       ),
//     ]);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (loading) return;

//     setLoading(true);
//     setError(null);
//     setDebugInfo([]);

//     try {
//       addDebug('Step 1: Signing in user...');
      
//       // Add 10 second timeout to sign in
//       const signInPromise = supabase.auth.signInWithPassword({
//         email: formData.email.trim(),
//         password: formData.password,
//       });

//       const { data, error: signInError } = await withTimeout(
//         signInPromise,
//         10000,
//         'Sign in timed out after 10 seconds'
//       );

//       if (signInError) {
//         addDebug(`❌ Sign in error: ${signInError.message}`);
//         throw signInError;
//       }
      
//       if (!data.user) {
//         addDebug('❌ No user returned from sign in');
//         throw new Error('Sign in failed - no user returned');
//       }

//       addDebug(`✅ User signed in: ${data.user.email}`);

//       if (!data.session) {
//         addDebug('❌ No session returned');
//         throw new Error('No session established');
//       }

//       const accessToken = data.session.access_token;
//       addDebug('✅ Session established');

//       // Small delay to ensure session is fully established
//       await new Promise(resolve => setTimeout(resolve, 300));

//       addDebug('Step 2: Verifying organization membership...');
      
//       const verifyPromise = fetch('/api/org/verify-membership', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           organizationSlug: formData.organizationSlug.toLowerCase().trim(),
//           userId: data.user.id,
//         }),
//       });

//       const response = await withTimeout(
//         verifyPromise,
//         10000,
//         'Organization verification timed out'
//       );

//       if (!response.ok) {
//         const result = await response.json();
//         addDebug(`❌ Verification failed: ${result.message}`);
//         throw new Error(result.message || 'Not a member of this organization');
//       }

//       const verifyResult = await response.json();
      
//       if (!verifyResult.success) {
//         addDebug(`❌ Verification unsuccessful: ${verifyResult.message}`);
//         throw new Error(verifyResult.message || 'Organization verification failed');
//       }

//       addDebug(`✅ Verified membership - Role: ${verifyResult.memberRole}`);

//       addDebug('Step 3: Updating current organization...');
      
//       const updatePromise = fetch('/api/user/update-current-org', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${accessToken}`,
//         },
//         credentials: 'include',
//         body: JSON.stringify({
//           organizationId: verifyResult.organizationId,
//         }),
//       });

//       const updateResponse = await withTimeout(
//         updatePromise,
//         5000,
//         'Update current org timed out'
//       );

//       if (!updateResponse.ok) {
//         addDebug('⚠️ Failed to update current org, but continuing...');
//       } else {
//         addDebug('✅ Current organization updated');
//       }

//       // Step 4: Route based on role
//       const role = verifyResult.memberRole.toLowerCase();
//       const slug = formData.organizationSlug.toLowerCase().trim();
      
//       let dashboardPath = '';
      
//       addDebug(`Step 4: Routing for role: ${role}`);
      
//       // Map database roles to dashboard routes
//       switch (role) {
//         case 'owner':
//           dashboardPath = `/org/owner/${slug}/dashboard`;
//           break;
//         case 'admin':
//           dashboardPath = `/org/admin/${slug}/dashboard`;
//           break;
//         case 'manager':
//           dashboardPath = `/org/manager/${slug}/dashboard`;
//           break;
//         case 'member':
//         case 'user':
//           dashboardPath = `/org/member/${slug}/dashboard`;
//           break;
//         case 'recruiter':
//           dashboardPath = `/org/recruiter/${slug}/dashboard`;
//           break;
//         default:
//           addDebug(`⚠️ Unknown role: ${role}, using fallback`);
//           dashboardPath = `/org/${slug}/dashboard`;
//       }

//       addDebug(`✅ Redirecting to: ${dashboardPath}`);
      
//       // Small delay to show the debug info
//       await new Promise(resolve => setTimeout(resolve, 800));
      
//       // Force full page reload to ensure auth state is updated
//       window.location.href = dashboardPath;
      
//     } catch (err: any) {
//       console.error('❌ Login error:', err);
//       addDebug(`❌ Error: ${err.message}`);
//       setError(err.message || 'Failed to login');
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-[#1B3A57] dark:to-gray-900 py-12 px-4">
//       <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <Building2 className="h-12 w-12 text-[#FF6B35] dark:text-[#FF8C5A]" />
//           </div>
//           <h1 className="text-3xl font-bold text-[#1B3A57] dark:text-white">
//             Organization Login
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-2">
//             Sign in to your organization workspace
//           </p>
//         </div>

//         {/* Role Information */}
//         <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
//           <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-2 flex items-center gap-2">
//             <Shield className="h-4 w-4" />
//             Organization Roles:
//           </p>
//           <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1 ml-6">
//             <li>• <strong>Owner:</strong> Full access + invitations</li>
//             <li>• <strong>Admin:</strong> Organization management</li>
//             <li>• <strong>Manager:</strong> Team management + analytics</li>
//             <li>• <strong>Member:</strong> Basic access</li>
//             <li>• <strong>Recruiter:</strong> Job management</li>
//           </ul>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Organization ID
//             </label>
//             <div className="relative">
//               <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 required
//                 placeholder="your-org-slug"
//                 value={formData.organizationSlug}
//                 onChange={(e) =>
//                   setFormData({ ...formData, organizationSlug: e.target.value.toLowerCase().trim() })
//                 }
//                 disabled={loading}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
//               />
//             </div>
//             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//               Enter your organization's unique identifier
//             </p>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="email"
//                 required
//                 placeholder="you@company.com"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 disabled={loading}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="password"
//                 required
//                 placeholder="••••••••"
//                 value={formData.password}
//                 onChange={(e) =>
//                   setFormData({ ...formData, password: e.target.value })
//                 }
//                 disabled={loading}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
//               />
//             </div>
//           </div>

//           {/* Debug Info */}
//           {debugInfo.length > 0 && (
//             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-h-40 overflow-y-auto">
//               <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
//                 Debug Info:
//               </p>
//               {debugInfo.map((info, idx) => (
//                 <p key={idx} className="text-xs text-blue-700 dark:text-blue-400 font-mono">
//                   {info}
//                 </p>
//               ))}
//             </div>
//           )}

//           {error && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#FF6B35] hover:bg-[#FF5722] dark:bg-[#FF8C5A] dark:hover:bg-[#FF6B35] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//           >
//             {loading ? (
//               <>
//                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
//                 <span>Signing in...</span>
//               </>
//             ) : (
//               <>
//                 <span>Sign In</span>
//                 <ArrowRight className="h-5 w-5" />
//               </>
//             )}
//           </button>
//         </form>

//         <div className="mt-6 text-center space-y-2">
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Don't have an organization?{' '}
//             <Link
//               href="/org/register"
//               className="text-[#FF6B35] hover:text-[#FF5722] dark:text-[#FF8C5A] font-semibold"
//             >
//               Create one
//             </Link>
//           </p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Personal account?{' '}
//             <Link
//               href="/login"
//               className="text-[#00A6A6] hover:text-[#008B8B] dark:text-[#00C8C8] font-semibold"
//             >
//               Sign in here
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }