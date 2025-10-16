import {  FilterOptions } from "@/types/admin/admin";
import { AuthUser, JobApplication, Resume, Job } from "@/types/user";
import {AdminDashboardStats} from "@/types/admin/admin_dashboard" 
import {AdminUser} from "@/types/admin/admin_authuser"
export const toAdminUser = (user: AuthUser): AdminUser => ({
  ...user,
  full_name: user.full_name ?? "", // ensure string
  joined_date: user.joined_date ?? "", // ensure string
  last_login: user.last_login ?? null, // already nullable
location: typeof user.user_metadata?.location === "string"
  ? user.user_metadata.location
  : String(user.user_metadata?.location ?? ""),
  is_active: true,
  subscription_status: "active",
  subscription_type: "pro",
  plan_name: "pro",
  total_jobs_scraped: 0,
  total_applications: 0,
  profile_completed: false,
  applications_sent: user.applications_sent ?? 0,
  resumes_uploaded: user.resumes_uploaded ?? 0,
  jobs_saved: user.jobs_saved ?? 0,
status: user.status === "active" || user.status === "inactive"
  ? user.status
  : "active",
});
// Mapper to create proper AdminDashboardStats from raw stats
export function mapToAdminDashboardStats(
  rawStats: any,
  applications: JobApplication[],
  resumes: Resume[],
  users: AdminUser[],
  jobs: Job[]
): AdminDashboardStats {
  return {
    // Job stats
    totalJobs: rawStats.totalJobs ?? jobs.length ?? 0,
    appliedJobs: rawStats.appliedJobs ?? 0,
    savedJobs: rawStats.savedJobs ?? 0,
    pendingJobs: rawStats.pendingJobs ?? 0,
    interviewJobs: rawStats.interviewJobs ?? 0,
    offerJobs: rawStats.offerJobs ?? 0,
    rejectedJobs: rawStats.rejectedJobs ?? 0,
    matchRate: rawStats.matchRate ?? 0,
    matchScore: rawStats.matchScore ?? 0,
    
    // User stats
    totalUsers: rawStats.totalUsers ?? users.length ?? 0,
    activeUsers: rawStats.activeUsers ?? users.filter(u => u.is_active).length ?? 0,
    
    // Resume stats
    totalResumes: rawStats.totalResumes ?? resumes.length ?? 0,
    avgMatchScore: rawStats.avgMatchScore ?? 0,
    
    // Application stats
    totalApplications: rawStats.totalApplications ?? applications.length ?? 0,
    
    // Revenue stats
    totalRevenue: rawStats.totalRevenue ?? 0,
    monthlyRecurringRevenue: rawStats.monthlyRecurringRevenue ?? 0,
    activeSubscriptions: rawStats.activeSubscriptions ?? 0,
    churnRate: rawStats.churnRate ?? 0,
    averageRevenuePerUser: rawStats.averageRevenuePerUser ?? 0,
    
    // Plan distribution
    planDistribution: {
      free: rawStats.planDistribution?.free ?? 0,
      pro: rawStats.planDistribution?.pro ?? 0,
      enterprise: rawStats.planDistribution?.enterprise ?? 0,
    },
  };
}