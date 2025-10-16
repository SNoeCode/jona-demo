// services/admin/admin_jobs.ts
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  status?: string;
  inserted_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export async function getJobs(
  page: number = 1,
  search: string = '',
  status: string = 'all',
  limit: number = 50
): Promise<{ jobs: Job[]; total: number; page: number; limit: number }> {
  const supabaseAdmin = await getSupabaseAdmin();

  let query = supabaseAdmin
    .from("jobs")
    .select("*", { count: "exact" })
    .order("inserted_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  return {
    jobs: data || [],
    total: count || 0,
    page,
    limit
  };
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    console.error('Error fetching job by ID:', error);
    return null;
  }

  return data;
}

export async function createJob(jobData: Partial<Job>): Promise<Job> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert(jobData)
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    throw error;
  }

  return data;
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    return null;
  }

  return data;
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}