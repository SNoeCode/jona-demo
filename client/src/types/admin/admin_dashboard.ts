import {  AdminSubscriptionStats } from "./admin_subscription";
import { BaseDashboardStats } from "../user";
import {AdminJob} from "@/types/admin/admin_jobs"
import { AuthUser, JobApplication } from "@/types/user/index";
import { ScraperResponse } from "./admin_scraper";
import { AdminUser } from "./admin_authuser";
export interface EnhancedDashboardStats extends BaseDashboardStats {
  subscriptionStats: AdminSubscriptionStats;
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'subscription_created' | 'job_applied' | 'resume_uploaded';
    description: string;
    user_name: string;
    created_at: string;
  }>;
  systemHealth: {
    database_status: 'healthy' | 'warning' | 'error';
    scraper_status: 'idle' | 'running' | 'error';
    last_scrape: string | null;
    pending_jobs: number;
  };
}
export interface FilterOptions {
  search?: string;
  company?: string;
  status?: string;
  priority?: string;
  date_range?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface AdminDashboardStats extends BaseDashboardStats {
  totalUsers: number;
  activeUsers: number;
    avgMatchScore: number;
    totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
    planDistribution: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

export interface AdminDashboardProps {
  initialJobs: AdminJob[];
  initialUsers: AdminUser[];
  initialStats: AdminDashboardStats;
  initialFilters: FilterOptions;
  user: AuthUser;
  role: "admin";
  applications: JobApplication[];
}