"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthUserContext";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Lock, ArrowRight, User, Building2, Shield } from "lucide-react";
import Link from "next/link";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const redirect = searchParams.get("redirect");
        const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
        
        const redirectPath = redirect || (role === "admin" ? "/admin/dashboard" : "/dashboard");
        window.location.href = redirectPath;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      if (message.toLowerCase().includes("rate limit")) {
        setCooldown(true);
        setTimeout(() => setCooldown(false), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || cooldown) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/google-signin", { method: "POST" });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      if (message.toLowerCase().includes("rate limit")) {
        setCooldown(true);
        setTimeout(() => setCooldown(false), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-[#1B3A57] dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-[#1B3A57] dark:to-gray-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-[#FF6B35] dark:text-[#FF8C5A]" />
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#00A6A6] absolute -right-2 -bottom-1" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A57] dark:text-white">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Sign in to access your account
          </p>
        </div>

        {/* Login Type Indicator */}
        <div className="mb-6 p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300 text-center flex items-center justify-center gap-1">
            <Shield className="inline h-4 w-4 flex-shrink-0" />
            <span>One login for all roles: User, Admin, Organization, or Tenant</span>
          </p>
        </div>

        {/* Organization Login Link */}
        <div className="mb-6 text-center">
          <Link
            href="/org/login"
            className="inline-flex items-center gap-2 text-sm text-[#00A6A6] hover:text-[#008B8B] dark:text-[#00C8C8] font-medium transition-colors"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sign in to your organization</span>
            <span className="sm:hidden">Organization login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading || cooldown}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading || cooldown}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              />
            </div>
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[#00A6A6] hover:text-[#008B8B] dark:text-[#00C8C8] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown}
            className="w-full bg-[#FF6B35] hover:bg-[#FF5722] dark:bg-[#FF8C5A] dark:hover:bg-[#FF6B35] text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : cooldown ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 sm:my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || cooldown}
          className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 sm:py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
            Sign in with Google
          </span>
        </button>

        {/* Register Link */}
        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#FF6B35] hover:text-[#FF5722] dark:text-[#FF8C5A] font-semibold transition-colors"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Don&apos;t forget to check your email.
          </p>
        </div>
      </div>
    </div>
  );
}
// "use client";
// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useAuth } from "@/context/AuthUserContext";
// import { supabase } from "@/lib/supabaseClient";
// import { Mail, Lock, ArrowRight, User, Building2, Shield } from "lucide-react";
// import Link from "next/link";

// export default function UnifiedLoginPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { signIn, loading: authLoading } = useAuth();

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [cooldown, setCooldown] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (loading || cooldown) return;

//     setLoading(true);
//     setError(null);

//     try {
//       // Use supabase directly instead of context for login
//       const { data, error: signInError } = await supabase.auth.signInWithPassword({
//         email: formData.email,
//         password: formData.password,
//       });

//       if (signInError) {
//         throw signInError;
//       }

//       if (data.user) {
//         console.log('✅ Login successful:', {
//           email: data.user.email,
//           role: data.user.user_metadata?.role,
//           hasSession: !!data.session,
//         });

//         // Wait for session to be fully established
//         await new Promise(resolve => setTimeout(resolve, 300));

//         // Get redirect param or determine based on role
//         const redirect = searchParams.get("redirect");
//         const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
        
//         let redirectPath: string;
//         if (redirect) {
//           redirectPath = redirect;
//         } else if (role === "admin") {
//           redirectPath = "/admin/dashboard";
//         } else {
//           redirectPath = "/dashboard";
//         }

//         console.log('🔄 Redirecting to:', redirectPath);

//         // Force a full page reload with the new session
//         window.location.href = redirectPath;
//       }
//     } catch (err: unknown) {
//       const message =
//         err instanceof Error ? err.message : "Authentication failed";
//       console.error('❌ Login error:', message);
//       setError(message);

//       if (message.toLowerCase().includes("rate limit")) {
//         setCooldown(true);
//         setTimeout(() => setCooldown(false), 5000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     if (loading || cooldown) return;

//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch("/api/auth/google-signin", {
//         method: "POST",
//       });

//       const data = await response.json();

//       if (data.url) {
//         window.location.href = data.url;
//       }
//     } catch (err: unknown) {
//       const message =
//         err instanceof Error ? err.message : "Authentication failed";
//       setError(message);

//       if (message.toLowerCase().includes("rate limit")) {
//         setCooldown(true);
//         setTimeout(() => setCooldown(false), 5000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Show loading while checking auth
//   if (authLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <div className="relative">
//               <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
//               <Building2 className="h-6 w-6 text-blue-500 absolute -right-2 -bottom-1" />
//             </div>
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//             Welcome Back
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-2">
//             Sign in to access your account
//           </p>
//         </div>

//         {/* Login Type Indicator */}
//         <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//           <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
//             <Shield className="inline h-4 w-4 mr-1" />
//             One login for all roles: User, Admin, Organization, or Tenant
//           </p>
//         </div>

//         {/* Organization Login Link */}
//         <div className="mb-6 text-center">
//           <Link
//             href="/org/login"
//             className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
//           >
//             <Building2 className="h-4 w-4" />
//             <span>Sign in to your organization</span>
//             <ArrowRight className="h-4 w-4" />
//           </Link>
//         </div>

//         {/* Login Form */}
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="email"
//                 required
//                 placeholder="you@example.com"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 disabled={loading || cooldown}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
//                 disabled={loading || cooldown}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//               />
//             </div>
//             <div className="mt-2 text-right">
//               <Link
//                 href="/forgot-password"
//                 className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
//               >
//                 Forgot password?
//               </Link>
//             </div>
//           </div>

//           {error && (
//             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading || cooldown}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
//             ) : cooldown ? (
//               <span>Please wait...</span>
//             ) : (
//               <>
//                 <span>Sign In</span>
//                 <ArrowRight className="h-5 w-5" />
//               </>
//             )}
//           </button>
//         </form>

//         {/* Divider */}
//         <div className="relative my-6">
//           <div className="absolute inset-0 flex items-center">
//             <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
//           </div>
//           <div className="relative flex justify-center text-sm">
//             <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
//               Or continue with
//             </span>
//           </div>
//         </div>

//         {/* Google Sign In */}
//         <button
//           type="button"
//           onClick={handleGoogleSignIn}
//           disabled={loading || cooldown}
//           className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           <svg className="h-5 w-5" viewBox="0 0 24 24">
//             <path
//               fill="#4285F4"
//               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//             />
//             <path
//               fill="#34A853"
//               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//             />
//             <path
//               fill="#FBBC05"
//               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//             />
//             <path
//               fill="#EA4335"
//               d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//             />
//           </svg>
//           <span className="text-gray-700 dark:text-gray-300 font-medium">
//             Sign in with Google
//           </span>
//         </button>

//         {/* Register Link */}
//         <div className="mt-6 text-center">
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Don&apos;t have an account?{" "}
//             <Link
//               href="/register"
//               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
//             >
//               Sign up
//             </Link>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
//             Don&apos;t forget to check your email.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }