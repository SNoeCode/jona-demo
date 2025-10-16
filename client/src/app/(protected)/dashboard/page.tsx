// client/src/app/(protected)/dashboard/page.tsx
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { toAuthUser, type AuthUser } from '@/types/user/authUser';
import {
  getJobApplications,
  getAllJobs,
  getUserResumes,
  getJobStatistics,
} from '@/app/services/server-user/server_user';
import Dashboard from '@/components/dashboard/Dashboard';

export interface UserDashboardStats {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  pendingJobs: number;
  interviewJobs: number;
  offerJobs: number;
  rejectedJobs: number;
  matchRate: number;
  matchScore: number;
  totalResumes: number;
  totalApplications: number;
  // Subscription stats
  currentPlan: string;
  subscriptionStatus: string;
  usageThisMonth: {
    jobsScraped: number;
    applicationsSent: number;
    resumesUploaded: number;
  };
  limits: {
    maxJobs: number;
    maxResumes: number;
    maxApplicationsPerDay: number;
  };
}

async function getServerAuth(): Promise<{ user: AuthUser | null; error: Error | null }> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies: () => cookies() });

    const {
      data: { user: rawUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('getServerAuth supabase error:', error);
      return { user: null, error: new Error(`Auth error: ${error.message}`) };
    }

    if (!rawUser) {
      return { user: null, error: null };
    }

    return { user: toAuthUser(rawUser), error: null };
  } catch (error) {
    console.error('getServerAuth error:', error);
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown auth error'),
    };
  }
}

async function requireAuth(): Promise<AuthUser> {
  const { user, error } = await getServerAuth();

  if (error) {
    console.error('requireAuth error:', error);
    redirect('/login?error=auth_error');
  }

  if (!user) {
    redirect('/login?redirect=' + encodeURIComponent('/dashboard'));
  }

  return user;
}

async function getUserSubscriptionData(userId: string, supabase: any) {
  try {
    // Fetch active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          max_jobs_per_month,
          max_resumes,
          max_applications_per_day
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // Fetch current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .maybeSingle();

    return {
      currentPlan: subscription?.subscription_plans?.name || 'Free',
      subscriptionStatus: subscription?.status || 'inactive',
      usageThisMonth: {
        jobsScraped: usage?.jobs_scraped || 0,
        applicationsSent: usage?.applications_sent || 0,
        resumesUploaded: usage?.resumes_uploaded || 0,
      },
      limits: {
        maxJobs: subscription?.subscription_plans?.max_jobs_per_month || 10,
        maxResumes: subscription?.subscription_plans?.max_resumes || 1,
        maxApplicationsPerDay: subscription?.subscription_plans?.max_applications_per_day || 5,
      },
    };
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return {
      currentPlan: 'Free',
      subscriptionStatus: 'inactive',
      usageThisMonth: {
        jobsScraped: 0,
        applicationsSent: 0,
        resumesUploaded: 0,
      },
      limits: {
        maxJobs: 10,
        maxResumes: 1,
        maxApplicationsPerDay: 5,
      },
    };
  }
}

export default async function DashboardPage() {
  const authUser = await requireAuth();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookies() });

  const [allJobs, jobStats, applications, rawUserResumes, subscriptionData] = await Promise.all([
    getAllJobs(authUser.id),
    getJobStatistics(authUser.id),
    getJobApplications(authUser.id),
    getUserResumes(authUser.id),
    getUserSubscriptionData(authUser.id, supabase),
  ]);

  const userResumes = rawUserResumes ?? [];

  const mappedStats: UserDashboardStats = {
    totalJobs: jobStats.total ?? 0,
    appliedJobs: jobStats.applied ?? 0,
    savedJobs: jobStats.saved ?? 0,
    pendingJobs: jobStats.pending ?? 0,
    interviewJobs: jobStats.interviews ?? 0,
    offerJobs: jobStats.offers ?? 0,
    rejectedJobs: jobStats.rejected ?? 0,
    matchRate: 0,
    matchScore: 0,
    totalResumes: userResumes.length ?? 0,
    totalApplications: applications.length ?? 0,
    ...subscriptionData,
  };

  return (
    <Dashboard
      user={authUser}
      applications={applications}
      darkMode={false}
      stats={mappedStats}
      allJobs={allJobs}
      userResumes={userResumes}
    />
  );
}