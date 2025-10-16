import {UserDashboardStats } from "@/types/user/dashboard";
import { AdminDashboardStats } from "@/types/admin/admin_dashboard";

export const getInitialUserDashboardStats = (): UserDashboardStats => ({
  totalJobs: 0,
  appliedJobs: 0,
  savedJobs: 0,
  pendingJobs: 0,
  interviewJobs: 0,
  offerJobs: 0,
  rejectedJobs: 0,
  matchRate: 0,
  matchScore: 0,
  totalResumes: 0,
  totalApplications: 0,
  avgMatchScore: 0,
  darkMode: false
});

export const getInitialAdminDashboardStats = (): AdminDashboardStats => ({
  ...getInitialUserDashboardStats(),
  totalUsers: 0,
  activeUsers: 0,
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