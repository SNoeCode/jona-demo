// "use client";

// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthUserContext";
// import { useTheme } from "@/context/ThemeContext";
// import type { User } from "@supabase/supabase-js";
// import type { AuthUser } from "@/types/user/index";
// import RegistrationForm from "./register/RegisterForm";
// import { useState } from "react";

// export interface AuthFormProps {
//   mode: "login" | "register";
//   onSuccessAction: (user?: AuthUser) => void;
//   setCurrentPageAction: (page: "login" | "register") => void;
// }

// export default function AuthForm({
//   mode,
//   onSuccessAction,
//   setCurrentPageAction,
// }: AuthFormProps) {
//   const { login, signInWithGoogle } = useAuth();
//   const router = useRouter();
//   const { darkMode } = useTheme();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [cooldown, setCooldown] = useState(false);

//   const transformToAuthUser = (user: User): AuthUser => ({
//     id: user.id,
//     email: user.email ?? "",
//     role: user.user_metadata?.role || "user",
//     aud: user.aud ?? "",
//     created_at: user.created_at ?? "",
//     app_metadata: user.app_metadata ?? {},
//     user_metadata: user.user_metadata ?? {},
//   });

//   const handleLoginSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (loading || cooldown) return;

//     setLoading(true);
//     setError("");

//     try {
//       const user = await login(email, password);
//       if (user) {
//         const role = user.user_metadata?.role || user.app_metadata?.role || "user";
//         const authUser = transformToAuthUser(user);
        
//         // Call success handler first
//         onSuccessAction(authUser);
        
//         // Then navigate based on role
//         const targetPath = role === "admin" ? "/admin/dashboard" : "/dashboard";
//         router.push(targetPath);
//       }
//     } catch (err: any) {
//       const message = err.message || "Authentication failed";
//       setError(message);

//       // Handle rate limiting with progressive backoff
//       if (message.toLowerCase().includes("rate limit") || 
//           message.toLowerCase().includes("too many requests")) {
//         setCooldown(true);
//         setTimeout(() => setCooldown(false), 10000); // 10-second cooldown for rate limits
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     if (loading || cooldown) return;

//     setLoading(true);
//     setError("");

//     try {
//       const redirectTo = `${window.location.origin}/dashboard`;
//       await signInWithGoogle(redirectTo);
//     } catch (err: any) {
//       const message = err.message || "Google sign in failed";
//       setError(message);

//       if (message.toLowerCase().includes("rate limit")) {
//         setCooldown(true);
//         setTimeout(() => setCooldown(false), 10000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRegistrationSuccess = (user: User) => {
//     const authUser = transformToAuthUser(user);
//     onSuccessAction(authUser);
//   };

//   const themeClasses = darkMode 
//     ? "bg-gray-900 text-white" 
//     : "bg-gray-50 text-gray-900";

//   const inputClasses = darkMode
//     ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
//     : "bg-white text-gray-900 border-gray-300 placeholder-gray-500";

//   return (
//     <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${themeClasses}`}>
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold">
//             {mode === "login"
//               ? "Sign in to your account"
//               : "Create your account"}
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             {mode === "login" ? (
//               <>
//                 Don't have an account?{" "}
//                 <button
//                   onClick={() => setCurrentPageAction("register")}
//                   className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
//                   disabled={loading}
//                 >
//                   Sign up
//                 </button>
//               </>
//             ) : (
//               <>
//                 Already have an account?{" "}
//                 <button
//                   onClick={() => setCurrentPageAction("login")}
//                   className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
//                   disabled={loading}
//                 >
//                   Sign in
//                 </button>
//               </>
//             )}
//           </p>
//         </div>

//         {mode === "login" && (
//           <form className="space-y-6" onSubmit={handleLoginSubmit}>
//             <div className="space-y-4">
//               <div>
//                 <label
//                   htmlFor="email"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Email address
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   disabled={loading || cooldown}
//                   className={`mt-1 block w-full px-3 py-2 border rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50 ${inputClasses}`}
//                   placeholder="Enter your email"
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="password"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Password
//                 </label>
//                 <input
//                   id="password"
//                   name="password"
//                   type="password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   disabled={loading || cooldown}
//                   className={`mt-1 block w-full px-3 py-2 border rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50 ${inputClasses}`}
//                   placeholder="Enter your password"
//                 />
//               </div>
//             </div>

//             {error && (
//               <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
//                 {error}
//                 {error.toLowerCase().includes("rate limit") && (
//                   <div className="mt-1 text-xs">
//                     Please wait before trying again.
//                   </div>
//                 )}
//               </div>
//             )}

//             <div>
//               <button
//                 type="submit"
//                 disabled={loading || cooldown}
//                 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading 
//                   ? "Signing in..." 
//                   : cooldown 
//                   ? "Please wait (rate limited)..." 
//                   : "Sign In"
//                 }
//               </button>
//             </div>

//             <div className="text-center">
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300" />
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-2 bg-gray-50 text-gray-500">Or</span>
//                 </div>
//               </div>
              
//               <button
//                 type="button"
//                 onClick={handleGoogleSignIn}
//                 disabled={loading || cooldown}
//                 className="mt-4 w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24">
//                   <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                   <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                   <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                   <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//                 </svg>
//                 {loading ? "Connecting..." : "Sign in with Google"}
//               </button>
//             </div>
//           </form>
//         )}

//         {mode === "register" && (
//           <RegistrationForm onSuccess={handleRegistrationSuccess} />
//         )}
//       </div>
//     </div>
//   );
// }
