// utils/user-service.ts

import {
  EnhancedUserProfile,
  AuthUser,
  PublicUser,
  SubmittedJob,
  JobApplication,
  ApplicationRecord,
  JobStats,
  UserJobStatus,
  SubscriptionData,
  UserSettings,
} from "@/types/index";
import { toAuthUser } from "@/types/authUser";
import { supabase } from "@/lib/supabaseClient";
import { safeSelect, safeSingle } from "@/lib/safeFetch";
import type { InsertUserProfilePayload } from "@/types/profile";

export class UserService {
  static async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user && user.id === userId) {
        return toAuthUser(user);
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return null;
      }

      return profile;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  }


static async updateUserProfile(userId: string, updateData: any): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
     

    if (error) {
      console.error("user_settings fetch failed:", error.message);
      return null;
    }

    if (!data || data.length === 0) return null;
    if (data.length > 1) {
      console.warn(
        `Multiple user_settings rows found for user_id=${userId}. Returning first one.`
      );
    }

    return data[0] as UserSettings;
  }

  static async getSubmittedJobs(userId: string): Promise<SubmittedJob[]> {
    const response = await supabase
      .from("submitted_jobs")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<SubmittedJob[]>(response, "submitted_jobs");
  }

  static async getJobApplications(userId: string): Promise<JobApplication[]> {
    const response = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<JobApplication[]>(response, "job_applications");
  }

  static async getApplicationRecords(
    userId: string
  ): Promise<ApplicationRecord[]> {
    const response = await supabase
      .from("application_records")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<ApplicationRecord[]>(response, "application_records");
  }

  static async getJobStats(userId: string): Promise<JobStats> {
    const { data, error } = await supabase.rpc("get_user_job_stats", {
      user_id_input: userId,
    });

    if (error) {
      console.error("Error fetching job stats:", error.message);
      return {};
    }

    return data as JobStats;
  }

  static async getJobStatuses(userId: string): Promise<UserJobStatus[]> {
    const response = await supabase
      .from("user_job_statuses")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<UserJobStatus[]>(response, "user_job_statuses");
  }
  static async getEnhancedUserProfile(
    userId: string
  ): Promise<EnhancedUserProfile> {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const { data: applicationCountData } = await supabase
      .from("user_job_status")
      .select("user_id")
      .eq("user_id", userId)
      .eq("applied", true);

    const { data: resumeCountData } = await supabase
      .from("resumes")
      .select("user_id")
      .eq("user_id", userId);

    return {
      ...user,
      full_name: profile?.full_name || user.name,
      email: profile?.email || "Unknown",
      joined_date: profile?.created_at || new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: "active",
      applications_sent: applicationCountData?.length || 0,
      resumes_uploaded: resumeCountData?.length || 0,
      profile_completed: !!profile?.full_name,
      subscription_type: "free",
      location: profile?.location || "Unknown",
    };
  }
}
export async function ensureUserProfileExists(user: AuthUser): Promise<void> {
  if (!user?.id) {
    console.error("No valid AuthUser provided");
    return;
  }

  const { id, email, role, user_metadata } = user;
  const name = user_metadata?.full_name ?? email;

  const response = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .single();

  const existingUser = safeSingle<{ id: string }>(response, "users");

  if (!existingUser) {
    const newUser: PublicUser = {
      id,
      email,
      name,
      role: role ?? "user",
    };

    const { error: insertError } = await supabase.from("users").insert(newUser);

    if (insertError) {
      console.error("Failed to insert user profile:", insertError.message);
    } else {
      console.log("User profile inserted into public.users");
    }
  }
}
export async function createUserProfile(payload: InsertUserProfilePayload) {
    try {
      const profileData = {
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📦 Creating user profile:", profileData);

      const { data, error } = await supabase
        .from("user_profiles")
        .insert([profileData])
        .select();

      if (error) {
        console.error("❌ Profile creation error:", error);
        throw new Error(`Profile creation failed: ${error.message}`);
      }

      console.log("✅ Profile created successfully:", data);
      return data;
    } catch (err) {
      console.error("❌ Profile creation failed:", err);
      throw err;
    }
  }

export async function getFullUserBundle(user: AuthUser) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    console.error("No user session found");
    return null;
  }

  if (!user?.id) {
    console.error("No valid AuthUser provided");
    return null;
  }

  await ensureUserProfileExists(user);

  const [
    profile,
    settings,
    submittedJobs,
    applications,
    applicationRecords,
    jobStats,
    jobStatuses,
  ] = await Promise.all([
    UserService.getUserProfile(user.id),
    UserService.getUserSettings(user.id),
    UserService.getSubmittedJobs(user.id),
    UserService.getJobApplications(user.id),
    UserService.getApplicationRecords(user.id),
    UserService.getJobStats(user.id),
    UserService.getJobStatuses(user.id),
    UserService.getEnhancedUserProfile(user.id),
  ]);

  return {
    user,
    profile,
    settings,
    submittedJobs,
    applications,
    applicationRecords,
    jobStats,
    jobStatuses,
    enhancedUserProfile: await UserService.getEnhancedUserProfile(user.id),
  };
}
