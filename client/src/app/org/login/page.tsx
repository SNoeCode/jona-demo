// client/src/app/org/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthUserContext';
import Link from 'next/link';
import { Building2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function OrgLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organizationSlug: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Sign in the user
      const { user, error: signInError } = await signIn(
        formData.email,
        formData.password
      );

      if (signInError) throw signInError;
      if (!user) throw new Error('Sign in failed');

      // Step 2: Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Verify organization membership
      const verifyResponse = await fetch('/api/org/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          organizationSlug: formData.organizationSlug,
          userId: user.id,
        }),
      });

      if (!verifyResponse.ok) {
        const result = await verifyResponse.json();
        throw new Error(result.message || 'Not a member of this organization');
      }

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        throw new Error(verifyResult.message || 'Organization verification failed');
      }

      // Step 4: Update current organization
      const updateResponse = await fetch('/api/user/update-current-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          organizationId: verifyResult.organizationId,
        }),
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update current org, but continuing...');
      }

      // Step 5: Redirect to the correct organization dashboard using SLUG
      console.log('Redirecting to:', `/org/${formData.organizationSlug}/dashboard`);
      router.push(`/org/${formData.organizationSlug}/dashboard`);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organization Login
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to your organization workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization ID
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="your-org-slug"
                value={formData.organizationSlug}
                onChange={(e) =>
                  setFormData({ ...formData, organizationSlug: e.target.value.toLowerCase().trim() })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your organization's unique identifier (e.g., org-this)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an organization?{' '}
            <Link
              href="/org/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              Create one
            </Link>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Looking for personal account?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthUserContext';
// import Link from 'next/link';
// import { Building2, Mail, Lock, ArrowRight } from 'lucide-react';

// export default function OrgLoginPage() {
//   const router = useRouter();
//   const { signIn } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     organizationSlug: '',
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       // Sign in the user
//       const { user, error: signInError } = await signIn(
//         formData.email,
//         formData.password
//       );

//       if (signInError) throw signInError;
//       if (!user) throw new Error('Sign in failed');

//       // IMPORTANT: Wait a moment for auth state to propagate
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // Verify organization membership
//       const response = await fetch('/api/org/verify-membership', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include', // ✅ IMPORTANT: Include cookies
//         body: JSON.stringify({
//           organizationSlug: formData.organizationSlug,
//           userId: user.id,
//         }),
//       });

//       if (!response.ok) {
//         const result = await response.json();
//         throw new Error(result.message || 'Organization verification failed');
//       }

//       const result = await response.json();

//       if (!result.success) {
//         throw new Error(result.message || 'Organization verification failed');
//       }

//       // Update current organization
//       const updateResponse = await fetch('/api/user/update-current-org', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include', // ✅ IMPORTANT: Include cookies
//         body: JSON.stringify({
//           organizationId: result.organizationId,
//         }),
//       });

//       if (!updateResponse.ok) {
//         console.warn('Failed to update current org, but continuing...');
//       }

//       // Navigate to the organization dashboard using the slug
//       router.push(`/org/${formData.organizationSlug}/dashboard`);
      
//     } catch (err: any) {
//       console.error('Login error:', err);
//       setError(err.message || 'Failed to login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
//       <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//             Organization Login
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-2">
//             Sign in to your organization workspace
//           </p>
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
//                   setFormData({ ...formData, organizationSlug: e.target.value })
//                 }
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//               />
//             </div>
//           </div>

//           {error && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
//               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
//             >
//               Create one
//             </Link>
//           </p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Looking for personal account?{' '}
//             <Link
//               href="/login"
//               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
//             >
//               Sign in here
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
// // client/src/app/org/login/page.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthUserContext';
// import Link from 'next/link';
// import { Building2, Mail, Lock, ArrowRight, Users } from 'lucide-react';

// export default function OrgLoginPage() {
//   const router = useRouter();
//   const { signIn } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     organizationSlug: '',
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       // Sign in the user
//       const { user, error: signInError } = await signIn(
//         formData.email,
//         formData.password
//       );

//       if (signInError) throw signInError;

//       // Verify organization membership
//       const response = await fetch('/api/org/verify-membership', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           organizationSlug: formData.organizationSlug,
//           userId: user?.id,
//         }),
//       });

//       const result = await response.json();

//       if (!result.success) {
//         throw new Error(result.message || 'Organization verification failed');
//       }

//       // Update current organization
//       await fetch('/api/user/update-current-org', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           organizationId: result.organizationId,
//         }),
//       });

//       router.push('/org/dashboard');
//     } catch (err: any) {
//       setError(err.message || 'Failed to login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
//       <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//             Organization Login
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-2">
//             Sign in to your organization workspace
//           </p>
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
//                   setFormData({ ...formData, organizationSlug: e.target.value })
//                 }
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//               />
//             </div>
//           </div>

//           {error && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
//               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
//             >
//               Create one
//             </Link>
//           </p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Looking for personal account?{' '}
//             <Link
//               href="/login"
//               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
//             >
//               Sign in here
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
