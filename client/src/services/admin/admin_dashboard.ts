"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminBaseURL } from "@/services/base";
import type { BaseDashboardStats } from "@/types/user/index";
// import type {  AuthUser } from "@/types/user/authuser";
import type { AdminJob,  } from "@/types/admin/admin_jobs";
import type { AdminUser,  } from "@/types/admin/admin_authuser";
import { AuthUser } from "@/types/user/index";
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
  initialStats: BaseDashboardStats;
  initialFilters: { status: string };
  user: AuthUser;
  role: string;
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/stats`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const supabaseAdmin = await getSupabaseAdmin();

  const [jobsData, usersData, resumesData, applicationsData, comparisonsData] =
    await Promise.all([
      supabaseAdmin.from("jobs").select("applied, saved, status"),
      supabaseAdmin.from("users").select("id"),
      supabaseAdmin.from("resumes").select("id"),
      supabaseAdmin
        .from("user_job_status")
        .select("applied")
        .eq("applied", true),
      supabaseAdmin.from("resume_comparisons").select("match_score"),
    ]);

  const jobs = jobsData.data || [];
  const users = usersData.data || [];
  const resumes = resumesData.data || [];
  const applications = applicationsData.data || [];
  const comparisons = comparisonsData.data || [];

  const matchScores = comparisons
    .map((comp) => comp.match_score)
    .filter((score): score is number => score !== null);

  const avgMatchScore =
    matchScores.length > 0
      ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
      : 0;
return {
  totalJobs: jobs.length,
  appliedJobs: jobs.filter((job) => job.applied).length,
  savedJobs: jobs.filter((job) => job.saved).length,
  pendingJobs: jobs.filter((job) => job.status === "pending").length,
  interviewJobs: jobs.filter((job) => job.status === "interview").length,
  offerJobs: jobs.filter((job) => job.status === "offer").length,
  rejectedJobs: jobs.filter((job) => job.status === "rejected").length,
  matchRate: matchScores.length > 0 ? Math.round((avgMatchScore / 100) * 100) : 0,
  matchScore: avgMatchScore,
  totalUsers: users.length,
  activeUsers: users.length,
  totalResumes: resumes.length,
  avgMatchScore,
  totalApplications: applications.length,

  // ✅ Stubbed admin-only metrics
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
}
}