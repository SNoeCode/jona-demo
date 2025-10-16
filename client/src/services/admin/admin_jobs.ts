// "use server";

import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
import { getAdminBaseURL } from "@/services/base";
import type { AdminJob } from "@/types/admin/admin_jobs";
import type { FilterOptions } from "@/types/admin";
// import {AdminJob}
import { Job } from "@/types/user/index";


// ===================
// JOBS MANAGEMENT
// ===================

export async function getAllJobs(filters?: {
  search?: string;
  status?: string | null;
  limit?: number;
  offset?: number;
}): Promise<AdminJob[]> {   
   const supabaseAdmin = await getSupabaseAdmin();

  let query = supabaseAdmin.from("jobs").select("*").order("inserted_at", { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }

  return data || [];
}

export async function getJobs(
  page = 1,
  search = "",
  status = "all"
): Promise<{
  jobs: AdminJob[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const baseURL = getAdminBaseURL();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(search && { search }),
      ...(status !== "all" && { status }),
    });

    const response = await fetch(`${baseURL}/jobs?${params}`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const limit = 20;
  const offset = (page - 1) * limit;

  const jobs = await getAllJobs({
    search,
    status: status !== "all" ? status : undefined,
    limit,
    offset,
  });
   const supabaseAdmin = await getSupabaseAdmin();

  let countQuery = supabaseAdmin.from("jobs").select("id", { count: "exact" });
  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (status !== "all") {
    countQuery = countQuery.eq("status", status);
  }

  const { count } = await countQuery;

  return {
    jobs,
    total: count || 0,
    page,
    limit,
  };
}

export async function getJob(id: string): Promise<AdminJob> {
  try {
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/jobs/${id}`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }
   const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.from("jobs").select("*").eq("id", id).single();

  if (error || !data) {
    console.error("Error fetching job:", error);
    throw new Error("Job not found");
  }

  return data;
}

export async function createJob(jobData: Partial<Job>): Promise<AdminJob> {
  try {
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    });

    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }
   const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert(jobData)
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    throw error;
  }

  return data as AdminJob;
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
  try {
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }
   const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating job:", error);
    throw error;
  }

  return data;
}
export async function getJobById(id: string): Promise<AdminJob | null> {
   const supabaseAdmin = await getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching job by ID:", error);
    return null;
  }

  return data as AdminJob;
}

export async function searchJobs(
  search: string,
  limit = 20,
  offset = 0
): Promise<AdminJob[]> {
   const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .or(`title.ilike.%${search}%,company.ilike.%${search}%`)
    .order("inserted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }

  return data as AdminJob[];
}



export async function filterJobs(filters: FilterOptions): Promise<AdminJob[]> {
   const supabaseAdmin = await getSupabaseAdmin();
  
  let query = supabaseAdmin.from("jobs").select("*").order("inserted_at", { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }

  if (filters.company) {
    query = query.eq("company", filters.company);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters.date_range?.start && filters.date_range?.end) {
    query = query.gte("inserted_at", filters.date_range.start).lte("inserted_at", filters.date_range.end);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error filtering jobs:", error);
    throw error;
  }

  return data as AdminJob[];
}



export async function deleteJob(id: string): Promise<boolean | void> {
  try {
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/jobs/${id}`, {
      method: "DELETE",
    });

    if (response.ok) return;
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }
   const supabaseAdmin = await getSupabaseAdmin();

  const { error } = await supabaseAdmin.from("jobs").delete().eq("id", id);

  if (error) {
    console.error("Error deleting job:", error);
    throw error;
  }

  return true;
}

export async function getJobStats(): Promise<{
  total: number;
  applied: number;
  saved: number;
  pending: number;
  byStatus: Record<string, number>;
}> {
   const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("status, applied, saved");

  if (error) {
    console.error("Error fetching job stats:", error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    applied: data?.filter((job) => job.applied).length || 0,
    saved: data?.filter((job) => job.saved).length || 0,
    pending: data?.filter((job) => job.status === "pending").length || 0,
    byStatus: {} as Record<string, number>,
  };

  data?.forEach((job) => {
    const status = job.status || "unknown";
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
}

export async function exportJobs(format: "csv" | "json" | "xlsx" = "csv"): Promise<void> {
  try {
    const response = await fetch(`${getAdminBaseURL()}/export/jobs?format=${format}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to CSV generation");
  }

  const csvContent = await exportJobsToCSV();
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jobs_export.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function exportJobsToCSV(): Promise<string> {
  const jobs = await getAllJobs();
  const headers = ["id", "title", "company", "location", "salary", "status", "date", "site"];
  const rows = jobs.map((job) => [
    job.id,
    job.title,
    job.company || "",
    job.job_location || "",
    job.salary || "",
    job.status || "",
    job.date || "",
    job.site,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");
}
