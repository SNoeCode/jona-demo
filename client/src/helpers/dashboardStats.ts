// src/helpers/dashboardStats.ts
import { AdminDashboardStats } from "@/types/admin/admin_dashboard";
import { AdminUser } from "@/types/admin/admin_authuser";

import { AuthUser, JobApplication, Resume, Job } from "@/types/user/index";
import type { UserRole } from "@/types/organization"; // or wherever UserRole is defined

// Convert AuthUser → AdminUser
export const toAdminUser = (user: AuthUser): AdminUser => ({
  ...user,
  full_name: user.full_name ?? "",
  role: normalizeRole(user.role),
  is_active: true,
  subscription_status: "active",
  subscription_type: "pro",
  plan_name: "pro",
  total_jobs_scraped: 0,
  total_applications: 0,
  joined_date: user.joined_date ?? new Date().toISOString(),
  last_login: user.last_login ?? null,
  status: ["active", "inactive"].includes(user.status as string)
    ? (user.status as "active" | "inactive")
    : "active",
  applications_sent: user.applications_sent ?? 0,
  resumes_uploaded: user.resumes_uploaded ?? 0,
  jobs_saved: user.jobs_saved ?? 0,
  profile_completed: false, // or derive from user if available
  location: "", // or derive from user if available
});
export function normalizeRole(role: string): UserRole {
  if (!role) return "unassigned_user";

  const normalized = role.toLowerCase().replace(/\s+/g, "_");

  switch (normalized) {
    case "admin":
      return "admin";
    case "tenant_owner":
    case "tenant":
      return "tenant_owner";
    case "org_admin":
    case "org admin":
      return "org_admin";
    case "org_manager":
    case "org manager":
      return "org_manager";
    case "org_user":
    case "org user":
      return "org_user";
    case "recruiter":
      return "recruiter";
    case "user":
      return "user";
    case "unassigned_user":
    case "unassigned":
      return "unassigned_user";
    default:
      console.warn(`Unknown role "${role}", defaulting to unassigned_user`);
      return "unassigned_user";
  }
}

// Map raw stats → AdminDashboardStats
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
    activeUsers:
      rawStats.activeUsers ?? users.filter((u) => u.is_active).length ?? 0,

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