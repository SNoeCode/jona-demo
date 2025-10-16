'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  JobApplication,
  Resume,
  Job,
  UserSettings,
  EnhancedUserProfile,
  UserDashboardStats,
} from '@/types/user/index';
import { AdminDashboardStats } from '@/types/admin/admin_dashboard';
import { JobService } from '@/services/user-services/job-service';
import { UserService } from '@/services/user-services/user-service';
import { ResumeService } from '@/services/user-services/resume-service';
import {
  getInitialAdminDashboardStats,
  getInitialUserDashboardStats,
} from '@/utils/dashboardStats';
import { getCurrentSubscription } from '@/app/actions/getCurrentSubscription';
import { getUsagePayload } from '@/services/user-services/usage-service';

interface UserDataContextType {
  stats: UserDashboardStats | AdminDashboardStats;
  enhancedUserProfile: EnhancedUserProfile | null;
  settings: UserSettings | null;
  applications: JobApplication[];
  allJobs: Job[];
  userResumes: Resume[];
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType>({
  stats: getInitialUserDashboardStats(),
  enhancedUserProfile: null,
  settings: null,
  applications: [],
  allJobs: [],
  userResumes: [],
  loading: true,
  refreshUserData: () => Promise.resolve(),
});

export function UserDataProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  const [stats, setStats] = useState<UserDashboardStats | AdminDashboardStats>(
    user.role === 'admin'
      ? getInitialAdminDashboardStats()
      : getInitialUserDashboardStats()
  );
  const [enhancedUserProfile, setEnhancedUserProfile] = useState<EnhancedUserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [userResumes, setUserResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (incomingUser: AuthUser) => {
    if (!incomingUser?.id) return;

    try {
      setLoading(true);

      const rawStats = await JobService.getJobStatistics(incomingUser.id);

      const baseStats = {
        totalJobs: rawStats.total ?? 0,
        appliedJobs: rawStats.applied ?? 0,
        savedJobs: rawStats.saved ?? 0,
        pendingJobs: rawStats.pending ?? 0,
        interviewJobs: rawStats.interviews ?? 0,
        offerJobs: rawStats.offers ?? 0,
        rejectedJobs: rawStats.rejected ?? 0,
        matchRate: 0,
        matchScore: 0,
      };

      if (incomingUser.role === 'admin') {
        setStats({
          ...getInitialAdminDashboardStats(),
          ...baseStats,
          totalUsers: 0,
          activeUsers: 0,
          totalResumes: 0,
          avgMatchScore: 0,
          totalApplications: 0,
          totalRevenue: 0,
          monthlyRecurringRevenue: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          averageRevenuePerUser: 0,
          planDistribution: {
            free: 0,
            pro: 0,
            enterprise: 0,
          },
        });
      } else {
        setStats({
          ...getInitialUserDashboardStats(),
          ...baseStats,
          totalResumes: 0,
          totalApplications: 0,
          avgMatchScore: 0,
        });
      }

      const [apps = [], jobs = [], resumes = []] = await Promise.all([
        UserService.getJobApplications(incomingUser.id),
        JobService.getAllJobs(incomingUser.id),
        ResumeService.getUserResumes(incomingUser.id),
      ]);

      setApplications(apps);
      setAllJobs(jobs);
      setUserResumes(resumes);

      console.log('✅ Jobs loaded into UserDataContext:', jobs.length);

      const [profile, subscription, usage, userSettings] = await Promise.all([
        UserService.getUserProfile(incomingUser.id),
        getCurrentSubscription(incomingUser.id),
        getUsagePayload(),
        UserService.getUserSettings(incomingUser.id),
      ]);

      if (profile?.id) {
        setEnhancedUserProfile({
          ...profile,
          current_subscription: subscription ?? null,
          usage: usage ?? null,
        });
      }

      setSettings(
        userSettings ?? {
          id: incomingUser.id,
          notification_push: true,
        }
      );
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    await fetchUserData(user);
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserData(user);
    }
  }, [user?.id]);

  return (
    <UserDataContext.Provider
      value={{
        stats,
        enhancedUserProfile,
        settings,
        applications,
        allJobs,
        userResumes,
        loading,
        refreshUserData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};