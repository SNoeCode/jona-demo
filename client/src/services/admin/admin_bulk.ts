"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteJob } from "./admin_jobs";
import { deleteUser } from "./admin_users";
import { deleteResume } from "./admin_resume";

export async function bulkDeleteJobs(ids: string[]): Promise<boolean> {
  try {
    await Promise.all(ids.map((id) => deleteJob(id)));
    return true;
  } catch {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("jobs").delete().in("id", ids);
    if (error) {
      console.error("Error bulk deleting jobs:", error);
      throw error;
    }
    return true;
  }
}

export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  await Promise.all(userIds.map((id) => deleteUser(id)));
}

export async function bulkDeleteResumes(resumeIds: string[]): Promise<void> {
  await Promise.all(resumeIds.map((id) => deleteResume(id)));
}

export async function bulkUpdateJobStatus(
  ids: string[],
  status: string
): Promise<boolean> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("jobs")
    .update({ status })
    .in("id", ids);

  if (error) {
    console.error("Error bulk updating job status:", error);
    throw error;
  }

  return true;
}