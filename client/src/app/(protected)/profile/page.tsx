// app/(protected)/profile/page.tsx
import { requireUserAuth } from "@/lib/supabase/auth-server";
import { fetchEnhancedProfile } from "@/app/actions/getEnchancedUserProfile";
import { getCurrentSubscription } from "@/app/actions/getCurrentSubscription";
import { getUserUsage } from "@/app/services/server-user/server_user_usage";
import Profile from "@/components/profile/Profile";
import { getSubscriptionPlans } from '@/app/actions/getSubscriptionPlans';

export default async function ProfilePage() {
  // Get authenticated user (will redirect to login if not authenticated)
  const authUser = await requireUserAuth();
 
  // Fetch all profile data with error handling
  const [enhancedProfile, plans, currentSubscription, userUsage] = await Promise.allSettled([
    fetchEnhancedProfile(authUser.id),
    getSubscriptionPlans(),
    getCurrentSubscription(authUser.id),
    getUserUsage(authUser.id),
  ]);

  // Extract values or use defaults
  const profileData = enhancedProfile.status === 'fulfilled' 
    ? enhancedProfile.value 
    : {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: typeof authUser.user_metadata?.avatar_url === 'string' ? authUser.user_metadata.avatar_url : undefined,
        phone: undefined,
        location: undefined,
        bio: undefined,
        skills: [],
        experience_level: undefined,
        preferred_job_types: [],
        preferred_locations: [],
        salary_expectation_min: undefined,
        salary_expectation_max: undefined,
        availability: undefined,
        linkedin_url: undefined,
        github_url: undefined,
        portfolio_url: undefined,
        resume_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
  
  const plansData = plans.status === 'fulfilled' ? plans.value : [];
  const subscriptionData = currentSubscription.status === 'fulfilled' ? currentSubscription.value : null;
  const usageData = userUsage.status === 'fulfilled' ? userUsage.value : null;

  // Log any errors for debugging
  if (enhancedProfile.status === 'rejected') {
    console.error('Error fetching enhanced profile:', enhancedProfile.reason);
  }
  if (plans.status === 'rejected') {
    console.error('Error fetching subscription plans:', plans.reason);
  }
  if (currentSubscription.status === 'rejected') {
    console.error('Error fetching current subscription:', currentSubscription.reason);
  }
  if (userUsage.status === 'rejected') {
    console.error('Error fetching user usage:', userUsage.reason);
  }

  return (
    <Profile
      user={authUser}
      enhancedUserProfile={profileData}
      subscriptionPlans={plansData}
      subscription={subscriptionData}
      usage={usageData}
    />
  );
}