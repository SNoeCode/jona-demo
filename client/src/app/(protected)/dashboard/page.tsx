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

export default async function DashboardPage() {
  const authUser = await requireAuth();

  const [allJobs, jobStats, applications, rawUserResumes] = await Promise.all([
    getAllJobs(authUser.id),
    getJobStatistics(authUser.id),
    getJobApplications(authUser.id),
    getUserResumes(authUser.id),
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