'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";

export default function HandleOAuthRedirect() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      // Only run if we're actually on a redirect page
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get("code");
      const error = urlParams.get("error");
      
      // Exit early if no OAuth parameters are present
      if (!authCode && !error) {
        return;
      }

      // Handle OAuth error
      if (error) {
        console.error("🚫 OAuth error:", error);
        router.push("/login?error=" + encodeURIComponent(error));
        return;
      }

      // Only proceed if we have an auth code
      if (!authCode) {
        return;
      }

      setIsProcessing(true);
      
      try {
        // Let Supabase handle the OAuth flow automatically
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);

        if (exchangeError) {
          console.error("❌ Supabase exchange error:", exchangeError.message);
          router.push("/login?error=" + encodeURIComponent(exchangeError.message));
          return;
        }

        if (data?.session?.user) {
          console.log("✅ OAuth Session established");
          
          // Get user role and redirect accordingly
          const role = data.session.user.user_metadata?.role || 
                      data.session.user.app_metadata?.role || 'user';
          
          if (role === 'admin') {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/dashboard";
          }
        }
      } catch (err) {
        console.error("❌ Unexpected OAuth error:", err);
        router.push("/login?error=oauth_failed");
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [router]);

  // Show loading state only if we're actually processing OAuth
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Completing sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}