"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// import { logAdminAction } from "./admin-log-service";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminBaseURL } from "@/services/base";

import { toAuthUser } from "@/types/user/authUser";
import {
  Job,
  DashboardStatsProps,
  AuthUser,
  BaseDashboardStats,
} from "@/types/user/index";

import type { AdminUser } from "@/types/admin/admin_authuser";
import type { AdminJob } from "@/types/admin/admin_jobs";
import type {
  ScrapingLog,
  ScraperRequest,
  ScraperResponse,
} from "@/types/admin/index";
import type {
  AdminSubscriptionData,
  AdminSubscriptionStats,
} from "@/types/admin/admin_subscription";
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
const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api/admin";

// Helper to get authenticated Supabase client
async function getAuthenticatedClient() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized: No authenticated user");
  }

  const authUser = toAuthUser(user);
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: User is not an admin");
  }

  return { supabase, user: authUser };
}

export async function getJobById(id: string): Promise<Job | null> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching job:", error);
    return null;
  }

  return data;
}

export async function getAllJobs(): Promise<Job[]> {
  try {
    const supabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from("jobs")
      .select("*");

    if (error) {
      console.error("Error fetching jobs:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Unexpected error in getAllJobs:", err);
    return [];
  }
}


export async function getJob(jobId: string): Promise<AdminJob> {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  return job as AdminJob;
}
export const logAdminAction = async (
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown> | null,
  oldValues?: Record<string, unknown> | null
) => {
  console.log(`[ADMIN ACTION] ${action} by ${userId}`, {
    entityType,
    entityId,
    newValues,
    oldValues,
  });

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin.from("admin_audit_log").insert([
      {
        user_id: userId,
        user_email: userEmail,
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: newValues,
        old_values: oldValues ?? null,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("Failed to log admin action to Supabase:", err);
  }
}

export async function updateJob(
  id: string,
  updates: Partial<Job>
): Promise<Job | null> {
  const { supabase, user } = await getAuthenticatedClient();
  const oldJob = await getJobById(id);

  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating job:", error);
    throw error;
  }
if (!user) {
  console.error("No authenticated user found");
  return null; // or throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "update",
    "job",
    id,
    updates as Record<string, unknown>,
    oldJob as Record<string, unknown> | null
  );

  return data;
}


export async function deleteJob(id: string): Promise<boolean> {
  const { supabase, user } = await getAuthenticatedClient();

  const oldJob = await getJobById(id);

  const { error } = await supabase.from("jobs").delete().eq("id", id);

  if (!user) {
  throw new Error("User not authenticated");
}

  if (error) {
    console.error("Error deleting job:", error);
    throw error;
  }

  await logAdminAction(
    user.id,
    user.email || "",
    "delete",
    "job",
    id,
    null,
    oldJob as Record<string, unknown> | null
  );

  return true;
}

export async function createJob(jobData: Partial<Job>): Promise<AdminJob> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("jobs")
    .insert(jobData)
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "create",
    "job",
    data.id,
    jobData as Record<string, unknown>,
    null
  );

  return data as AdminJob;
}

export async function getJobStats(): Promise<{
  total: number;
  applied: number;
  saved: number;
  pending: number;
  byStatus: Record<string, number>;
}> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("status, applied, saved");

  if (error) {
    console.error("Error fetching job stats:", error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    applied: data?.filter((job: any) => job.applied).length || 0,
    saved: data?.filter((job: any) => job.saved).length || 0,
    pending: data?.filter((job: any) => job.status === "pending").length || 0,
    byStatus: {} as Record<string, number>,
  };

  data?.forEach((job: any) => {
    const status = job.status || "unknown";
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  try {
    const { supabase } = await getAuthenticatedClient();

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) throw usersError;

    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("*");

    const { data: applicationCounts } = await supabase
      .from("user_job_status")
      .select("user_id")
      .eq("applied", true);

    const { data: resumeCounts } = await supabase
      .from("resumes")
      .select("user_id");

    const enhancedUsers: AdminUser[] = (usersData || []).map((user: any) => {
      const profile = profilesData?.find((p: any) => p.id === user.id);
      const applicationCount =
        applicationCounts?.filter((a: any) => a.user_id === user.id).length || 0;
      const resumeCount =
        resumeCounts?.filter((r: any) => r.user_id === user.id).length || 0;

      return {
        ...user,
        full_name: profile?.full_name || user.full_name || "Unknown",
        email: profile?.email || user.email || "Unknown",
        joined_date: profile?.created_at || new Date().toISOString(),
        last_login: new Date().toISOString(),
        status: "active" as const,
        applications_sent: applicationCount,
        resumes_uploaded: resumeCount,
        profile_completed: !!profile?.full_name,
        subscription_type: "free" as const,
        location: profile?.location || "Unknown",
      };
    });

    return enhancedUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getUsers(
  page = 1,
  search = "",
  status = "all"
): Promise<{
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}> {
  const allUsers = await getAllUsers();

  let filteredUsers = allUsers;
  if (search) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (status !== "all") {
    filteredUsers = filteredUsers.filter((user) => user.status === status);
  }

  const limit = 20;
  const offset = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);

  return {
    users: paginatedUsers,
    total: filteredUsers.length,
    page,
    limit,
  };
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      user_profiles(*),
      user_settings(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data;
}

export async function getUser(userId: string): Promise<AdminUser> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function updateUser(
  userId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser> {
  const { supabase, user } = await getAuthenticatedClient();

  const oldUser = await getUserById(userId);

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}

  await logAdminAction(
    user.id,
    user.email || "",
    "update",
    "user",
    userId,
    updates as Record<string, unknown>,
    oldUser as Record<string, unknown> | null
  );

  return data;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { supabase, user } = await getAuthenticatedClient();

  const oldUser = await getUserById(id);

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "delete",
    "user",
    id,
    null,
    oldUser as Record<string, unknown> | null
  );

  return true;
}

// ===================
// RESUMES MANAGEMENT
// ===================

export async function getAllResumes(): Promise<any[]> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("resumes")
    .select(
      `
      *,
      users!resumes_user_id_fkey (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
    throw error;
  }

  return data || [];
}

export async function getResumes(
  page = 1,
  search = ""
): Promise<{
  resumes: any[];
  total: number;
  page: number;
  limit: number;
}> {
  const allResumes = await getAllResumes();

  let filteredResumes = allResumes;
  if (search) {
    filteredResumes = filteredResumes.filter(
      (resume) =>
        resume.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        resume.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
        resume.file_name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const limit = 20;
  const offset = (page - 1) * limit;
  const paginatedResumes = filteredResumes.slice(offset, offset + limit);

  return {
    resumes: paginatedResumes,
    total: filteredResumes.length,
    page,
    limit,
  };
}

export async function getResumeById(id: string): Promise<any | null> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Failed to fetch resume ${id}:`, error);
    return null;
  }

  return data;
}

export async function deleteResume(id: string): Promise<boolean> {
  const { supabase, user } = await getAuthenticatedClient();

  const oldResume = await getResumeById(id);

  const { error } = await supabase.from("resumes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "delete",
    "resume",
    id,
    null,
    oldResume as Record<string, unknown> | null
  );

  return true;
}

export async function getSubscriptionStats(): Promise<AdminSubscriptionStats> {
  const { supabase } = await getAuthenticatedClient();

  const { data: subscriptions, error } = await supabase.from(
    "user_subscriptions"
  ).select(`
      *,
      plan:subscription_plans(*),
      user_profiles!user_subscriptions_user_id_fkey(full_name, email),
      payment_history(amount, payment_date, status),
      user_usage(month_year, jobs_scraped, applications_sent, resumes_uploaded)
    `);

  if (error) {
    console.error("Error fetching subscription data:", error);
    throw error;
  }

  const Subscriptions: AdminSubscriptionData[] = (
    subscriptions || []
  ).map((sub: any) => ({
    user_id: sub.user_id,
    user_name: sub.user_profiles?.full_name || "Unknown",
    user_email: sub.user_profiles?.email || "Unknown",
    subscription: {
      id: sub.id,
      user_id: sub.user_id,
      plan_id: sub.plan?.id ?? "",
      status: sub.status,
      billing_cycle: sub.billing_cycle,
      price_paid: sub.price_paid,
      created_at: sub.created_at,
      canceled_at: sub.canceled_at,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      plan: sub.plan ?? null,
     stripe_subscription_id: sub.stripe_subscription_id ?? "",
    },
    payment_history: sub.payment_history || [],
    total_paid:
      sub.payment_history?.reduce(
        (sum: number, payment: any) =>
          payment.status === "succeeded" ? sum + payment.amount : sum,
        0
      ) || 0,
    last_payment_date: sub.payment_history?.[0]?.payment_date || null,
    usage: sub.user_usage || [],
  }));

  const totalRevenue = Subscriptions.reduce(
    (sum, sub) => sum + sub.total_paid,
    0
  );

  const activeSubscriptions = Subscriptions.filter(
    (sub) => sub.subscription.status === "active"
  ).length;

  const monthlyRecurringRevenue = Subscriptions.reduce((sum, sub) => {
    const subscription = sub.subscription;
    if (subscription?.status === "active") {
      const monthlyAmount =
        subscription.billing_cycle === "yearly"
          ? (subscription.price_paid ?? 0) / 12
          : subscription.price_paid ?? 0;
      return sum + monthlyAmount;
    }
    return sum;
  }, 0);

  const thisMonthCanceled = Subscriptions.filter((sub) => {
    const canceledAt = sub.subscription.canceled_at;
    return (
      canceledAt && new Date(canceledAt).getMonth() === new Date().getMonth()
    );
  }).length;

  const churnRate =
    activeSubscriptions > 0
      ? (thisMonthCanceled / activeSubscriptions) * 100
      : 0;

  const averageRevenuePerUser =
    activeSubscriptions > 0
      ? monthlyRecurringRevenue / activeSubscriptions
      : 0;

  const planDistribution: { [key: string]: number; free: number; pro: number; enterprise: number } = {
    free: 0,
    pro: 0,
    enterprise: 0,
  };
  
  Subscriptions.forEach((sub) => {
    const planName = sub.subscription.plan?.name?.toLowerCase() || "unknown";
    planDistribution[planName] = (planDistribution[planName] || 0) + 1;
  });

  return {
  totalRevenue,
  monthlyRecurringRevenue,
  activeSubscriptions,
  churnRate,
  averageRevenuePerUser,
  planDistribution,
  payment_history: Subscriptions.flatMap(sub => sub.payment_history || []), // ✅ added
  };
}

export async function getAllSubscriptions(): Promise<AdminSubscriptionData[]> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
      *,
      plan:subscription_plans(*),
      user_profiles!user_subscriptions_user_id_fkey(
        full_name,
        email
      ),
      payment_history(
        amount,
        payment_date,
        status
      ),
      user_usage(
        month_year,
        jobs_scraped,
        applications_sent,
        resumes_uploaded
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all subscriptions:", error);
    throw error;
  }

  return (data || []).map((sub) => ({
    user_id: sub.user_id,
    user_name: sub.user_profiles?.full_name || "Unknown",
    user_email: sub.user_profiles?.email || "Unknown",
    subscription: {
      ...sub,
      plan: sub.plan,
    },
    payment_history: sub.payment_history || [],
    total_paid:
      sub.payment_history?.reduce(
        (sum: number, payment: any) =>
          payment.status === "succeeded" ? sum + payment.amount : sum,
        0
      ) || 0,
    last_payment_date: sub.payment_history?.[0]?.payment_date || null,
    usage: sub.user_usage || [],
  }));
}

export async function getSubscriptions(
  page = 1,
  search = "",
  status = "all",
  plan = "all"
): Promise<{
  subscriptions: AdminSubscriptionData[];
  total: number;
  page: number;
  limit: number;
}> {
  const allSubscriptions = await getAllSubscriptions();

  let filteredSubscriptions = allSubscriptions;
  if (search) {
    filteredSubscriptions = filteredSubscriptions.filter(
      (sub) =>
        sub.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        sub.user_email?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (status !== "all") {
    filteredSubscriptions = filteredSubscriptions.filter(
      (sub) => sub.subscription.status === status
    );
  }
  if (plan !== "all") {
    filteredSubscriptions = filteredSubscriptions.filter(
      (sub) =>
        sub.subscription.plan?.name?.toLowerCase() === plan.toLowerCase()
    );
  }

  const limit = 20;
  const offset = (page - 1) * limit;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    offset,
    offset + limit
  );

  return {
    subscriptions: paginatedSubscriptions,
    total: filteredSubscriptions.length,
    page,
    limit,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "cancel",
    "subscription",
    subscriptionId,
    { status: "canceled" } as Record<string, unknown>,
    null
  );
}

export async function refundSubscription(
  subscriptionId: string,
  amount: number
): Promise<void> {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase.from("payment_history").insert({
    subscription_id: subscriptionId,
    amount: -amount,
    status: "succeeded",
    payment_date: new Date().toISOString(),
  });

  if (error) {
    console.error("Error processing refund:", error);
    throw error;
  }
if (!user) {
  throw new Error("User not authenticated");
}
  await logAdminAction(
    user.id,
    user.email || "",
    "refund",
    "subscription",
    subscriptionId,
    { amount } as Record<string, unknown>,
    null
  );
}

// ===================
// SCRAPING LOGS
// ===================

export async function getScrapingLogs(limit: number = 50): Promise<ScrapingLog[]> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("scraping_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching scraping logs:", error);
    throw error;
  }

  return data || [];
}

export async function createScrapingLog(
  log: Partial<ScrapingLog>
): Promise<ScrapingLog | null> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("scraping_logs")
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error("Error creating scraping log:", error);
    throw error;
  }

  return data;
}

export async function updateScrapingLog(
  id: string,
  updates: Partial<ScrapingLog>
): Promise<ScrapingLog | null> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("scraping_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating scraping log:", error);
    throw error;
  }

  return data;
}

// ===================
// BULK OPERATIONS
// ===================

export async function bulkDeleteJobs(ids: string[]): Promise<boolean> {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("jobs")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("Error bulk deleting jobs:", error);
    throw error;
  }
if (!user) {
  console.error("No authenticated user found");
  return false;
}
  await logAdminAction(
    user.id,
    user.email || "",
    "bulk_delete",
    "jobs",
    ids.join(","),
    { count: ids.length } as Record<string, unknown>,
    null
  );

  return true;
}

export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  const promises = userIds.map((id) => deleteUser(id));
  await Promise.all(promises);
}

export async function bulkDeleteResumes(resumeIds: string[]): Promise<void> {
  const promises = resumeIds.map((id) => deleteResume(id));
  await Promise.all(promises);
}

export async function bulkUpdateJobStatus(
  ids: string[],
  status: string
): Promise<boolean> {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .in("id", ids);

  if (error) {
    console.error("Error bulk updating job status:", error);
    throw error;
  }
if (!user) {
  console.error("No authenticated user found");
  return false;
}

// Now safe to use:
await logAdminAction(
  user.id,
  user.email || "",
  "bulk_update",
  "jobs",
  ids.join(","),
  { status, count: ids.length },
  null
);



  return true;
}

// ===================
// UTILITY FUNCTIONS
// ===================

export async function searchJobs(query: string, limit: number = 50): Promise<Job[]> {
  const { supabase } = await getAuthenticatedClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .or(
      `title.ilike.%${query}%,company.ilike.%${query}%,job_description.ilike.%${query}%`
    )
    .limit(limit);

  if (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }

  return data || [];
}
