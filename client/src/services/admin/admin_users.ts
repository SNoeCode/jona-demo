// app/services/admin/admin_users.ts - Fixed with proper types
'use server'
import { EnhancedUserProfile } from "@/types/user/index";
import { supabase } from "@/lib/supabaseClient";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminUser } from "@/types/admin/admin_authuser";
import { AdminUserCreat}
import { getAdminBaseURL } from "@/services/base";
// import { SubscriptionService } from "@/services/user-services/subscription-service";
import { toAuthUser, AuthUser } from "@/types/user";
import {  AdminEnhancedUserProfile } from "@/types/admin/admin_profile";
import { getCurrentSubscription } from "@/app/actions/getCurrentSubscription";

// Helper function to convert AuthUser to AdminUser
function convertToAdminUser(user: AuthUser, additionalData: {
  profile?: any;
  applications?: number;
  resumes?: number;
}): AdminUser {
  const { profile, applications = 0, resumes = 0 } = additionalData;
  
  const rawType = user.app_metadata?.subscription_type;
  const subscription_type: "free" | "pro" | "enterprise" =
    rawType === "enterprise" ? "enterprise" :
    rawType === "pro" ? "pro" : "free";

  // Remove verifyUser from user object to match AdminUser interface
  const { verifyUser, ...userWithoutVerify } = user;

  const adminUser: AdminUser = {
    ...userWithoutVerify,
    full_name: profile?.full_name || user.user_metadata?.full_name || "N/A",
    email: user.email || "Unknown",
    joined_date: profile?.created_at || user.created_at,
    last_login: user.last_sign_in_at || null,
    status: user.last_sign_in_at ? "active" : "inactive",
    applications_sent: applications,
    resumes_uploaded: resumes,
    profile_completed: !!profile?.full_name,
    subscription_type,
    location: profile?.location || user.user_metadata?.location || "Unknown",
    is_active: !!user.last_sign_in_at,
    subscription_status: "active",
    plan_name: typeof user.app_metadata?.plan_name === "string" 
      ? user.app_metadata.plan_name 
      : "free",
    total_jobs_scraped: 0,
    total_applications: applications,
    user_profiles: profile || null,
  };

  return adminUser;
}

// export async function getAllUsers(): Promise<AdminUser[]> {
//   const supabaseAdmin = await getSupabaseAdmin();

//   try {
//     // Use getUser() instead of session for security
//     const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
//     if (error || !authUsers?.users) {
//       console.error("Error fetching auth users:", error);
//       throw error;
//     }

//     // Get profiles with error handling
//     const { data: profilesData, error: profilesError } = await supabaseAdmin
//       .from("user_profiles")
//       .select("*");
    
//     if (profilesError) {
//       console.warn("Error fetching profiles:", profilesError);
//     }

//     // Get application counts with error handling
//     const { data: applicationCountsData, error: appError } = await supabaseAdmin
//       .from("user_job_status")
//       .select("user_id")
//       .eq("applied", true);
    
//     if (appError) {
//       console.warn("Error fetching application counts:", appError);
//     }

//     // Fixed: Use admin client to bypass RLS and only select existing columns
//     const { data: resumeCountsData, error: resumeError } = await supabaseAdmin
//       .from("resumes")
//       .select("user_id, id"); // Only select columns that definitely exist
    
//     if (resumeError) {
//       console.warn("Error fetching resume counts:", resumeError);
//     }

//     const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
    
//     // Process users and filter out nulls properly
//     const adminUsers: AdminUser[] = [];
    
//     for (const rawUser of authUsers.users) {
//       const user = toAuthUser(rawUser);
//       if (!user) continue;

//       const profile = profileMap.get(user.id);
//       const applications = applicationCountsData?.filter((a) => a.user_id === user.id).length || 0;
//       const resumes = resumeCountsData?.filter((r) => r.user_id === user.id).length || 0;

//       const adminUser = convertToAdminUser(user, { profile, applications, resumes });
//       adminUsers.push(adminUser);
//     }
    
//     return adminUsers;
      
//   } catch (error) {
//     console.error("Error in getAllUsers:", error);
//     throw new Error("Failed to fetch users: " + (error instanceof Error ? error.message : String(error)));
//   }
// }
export async function getAllUsers(filters?: { search?: string; status?: string }): Promise<AdminUser[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { search, status } = filters || {};

  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !authUsers?.users) {
      console.error("Error fetching auth users:", error);
      throw error;
    }

    // Build profile query with filters
    let profileQuery = supabaseAdmin.from("user_profiles").select("*");

    if (search) {
      profileQuery = profileQuery.ilike("full_name", `%${search}%`);
    }

    if (status && status !== "all") {
      profileQuery = profileQuery.eq("status", status);
    }

    const { data: profilesData, error: profilesError } = await profileQuery;
    if (profilesError) {
      console.warn("Error fetching profiles:", profilesError);
    }

    const { data: applicationCountsData, error: appError } = await supabaseAdmin
      .from("user_job_status")
      .select("user_id")
      .eq("applied", true);

    if (appError) {
      console.warn("Error fetching application counts:", appError);
    }

    const { data: resumeCountsData, error: resumeError } = await supabaseAdmin
      .from("resumes")
      .select("user_id, id");

    if (resumeError) {
      console.warn("Error fetching resume counts:", resumeError);
    }

    const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
    const adminUsers: AdminUser[] = [];

    for (const rawUser of authUsers.users) {
      const user = toAuthUser(rawUser);
      if (!user) continue;

      const profile = profileMap.get(user.id);
      const applications = applicationCountsData?.filter((a) => a.user_id === user.id).length || 0;
      const resumes = resumeCountsData?.filter((r) => r.user_id === user.id).length || 0;

      const adminUser = convertToAdminUser(user, { profile, applications, resumes });
      adminUsers.push(adminUser);
    }

    return adminUsers;
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw new Error("Failed to fetch users: " + (error instanceof Error ? error.message : String(error)));
  }
}
export async function getUserById(id: string): Promise<AdminUser | null> {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    const { data: rawUser, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error || !rawUser?.user) return null;

    const user = toAuthUser(rawUser.user);
    if (!user) return null;

    const [profileData, applicationCount, resumeCount] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("*").eq("id", id).single(),
      supabaseAdmin
        .from("user_job_status")
        .select("id", { count: "exact" })
        .eq("user_id", id)
        .eq("applied", true),
      // Fixed: Only select essential columns
      supabaseAdmin
        .from("resumes")
        .select("id", { count: "exact" })
        .eq("user_id", id),
    ]);

    const profile = profileData.data;
    const applications = applicationCount.count || 0;
    const resumes = resumeCount.count || 0;

    return convertToAdminUser(user, { profile, applications, resumes });
    
  } catch (error) {
    console.error("Error in getUserById:", error);
    return null;
  }
}
 export async function getAdminEnhancedUserProfile(
  userId: string
): Promise<AdminEnhancedUserProfile> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: rawUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !rawUser?.user) throw error || new Error("User not found");

  const user = toAuthUser(rawUser.user);
  if (!user) throw new Error("Invalid user data");

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: applicationCountData } = await supabaseAdmin
    .from("user_job_status")
    .select("user_id")
    .eq("user_id", userId)
    .eq("applied", true);

  const { data: resumeCountData } = await supabaseAdmin
    .from("resumes")
    .select("user_id")
    .eq("user_id", userId);

  return {
    ...user,
    full_name: profile?.full_name || user.user_metadata?.full_name || "N/A",
    email: user.email || "Unknown",
    joined_date: profile?.created_at || user.created_at,
    last_login: user.last_sign_in_at,
    status: user.last_sign_in_at ? "active" : "inactive",
    applications_sent: applicationCountData?.length || 0,
    resumes_uploaded: resumeCountData?.length || 0,
    profile_completed: !!profile?.full_name,
    subscription_type: user.app_metadata?.subscription_type || "free",
    location: profile?.location || user.user_metadata?.location || "Unknown",
  } as AdminEnhancedUserProfile;
}

export async function getEnhancedUserProfile(
  userId: string
): Promise<EnhancedUserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  const subscription = await getCurrentSubscription(userId);
  const usage = await getUserUsage(userId);

  return {
    ...data,
    current_subscription: subscription,
    usage,
  };
}

// export async function updateUserProfile(
//   userId: string,
//   updates: Partial<EnhancedUserProfile>
// ): Promise<EnhancedUserProfile> {
//   const { data, error } = await supabase
//     .from("user_profiles")
//     .update({
//       ...updates,
//       updated_at: new Date().toISOString(),
//     })
//     .eq("id", userId)
//     .select()
//     .single();

//   if (error) {
//     console.error("Error updating user profile:", error);
//     throw error;
//   }

//   return data;
// }
export async function getUserUsage(userId: string) {
  const { data, error } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user usage:", error);
    return null;
  }

  return data;
}

// export async function exportUsers(
//   format: "csv" | "json" | "xlsx" = "csv"
// ): Promise<void> {
//   try {
//     const baseURL = await getAdminBaseURL();
//     const response = await fetch(`${baseURL}/export/users?format=${format}`);
//     if (response.ok) {
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `users_export.${format}`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//       return;
//     }
//   } catch (error) {
//     console.warn("API endpoint unavailable, falling back to CSV generation");
//   }

//   const csvContent = await exportUsersToCSV();
//   const blob = new Blob([csvContent], { type: "text/csv" });
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `users_export.csv`;
//   document.body.appendChild(a);
//   a.click();
//   window.URL.revokeObjectURL(url);
//   document.body.removeChild(a);
// }


export async function updateUser(
  userId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser> {
  try {
    const baseURL = await getAdminBaseURL();
    const response = await fetch(`${baseURL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  // Fallback to direct database update via auth.admin
  const supabaseAdmin = await getSupabaseAdmin();
  
  try {
    // Use auth.admin.updateUserById for auth table updates
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.user_metadata) authUpdates.user_metadata = updates.user_metadata;
    if (updates.app_metadata) authUpdates.app_metadata = updates.app_metadata;

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
      if (error) throw error;
    }

    // Update profile separately
    const profileUpdates: any = {};
    if (updates.full_name) profileUpdates.full_name = updates.full_name;
    if (updates.location) profileUpdates.location = updates.location;

    if (Object.keys(profileUpdates).length > 0) {
      await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: userId,
          ...profileUpdates,
          updated_at: new Date().toISOString()
        });
    }

    const updatedUser = await getUserById(userId);
    if (!updatedUser) throw new Error("Failed to fetch updated user");
    
    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const baseURL = await getAdminBaseURL();
    const response = await fetch(`${baseURL}/users/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const supabaseAdmin = await getSupabaseAdmin();
  
  try {
    // Delete related data first (if not handled by cascade)
    await Promise.all([
      supabaseAdmin.from("user_profiles").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Error deleting user_profiles:", error);
      }),
      supabaseAdmin.from("user_settings").delete().eq("user_id", id).then(({ error }) => {
        if (error) console.warn("Error deleting user_settings:", error);
      }),
      supabaseAdmin.from("resumes").delete().eq("user_id", id).then(({ error }) => {
        if (error) console.warn("Error deleting resumes:", error);
      }),
      supabaseAdmin.from("user_job_status").delete().eq("user_id", id).then(({ error }) => {
        if (error) console.warn("Error deleting user_job_status:", error);
      }),
      supabaseAdmin.from("user_usage").delete().eq("user_id", id).then(({ error }) => {
        if (error) console.warn("Error deleting user_usage:", error);
      })
    ]);

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw new Error("Failed to delete user: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Rest of functions remain the same but with improved error handling...
export async function getUsers(
  page = 1,
  search = "",
  status = "all"
): Promise<{ users: AdminUser[]; total: number; page: number; limit: number }> {
  try {
    const allUsers = await getAllUsers();

    let filtered = allUsers;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(lower) ||
          u.full_name?.toLowerCase().includes(lower)
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((u) => u.status === status);
    }

    const limit = 20;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      users: paginated,
      total: filtered.length,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error in getUsers:", error);
    return { users: [], total: 0, page, limit: 20 };
  }
}

export async function getUser(userId: string): Promise<AdminUser> {
  try {
    const baseURL = await getAdminBaseURL();
    const response = await fetch(`${baseURL}/users/${userId}`);
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function exportUsers(
  format: "csv" | "json" | "xlsx" = "csv"
): Promise<void> {
  try {
    const baseURL = await getAdminBaseURL();
    const response = await fetch(`${baseURL}/export/users?format=${format}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }
  } catch (error) {
    console.warn("API endpoint unavailable, falling back to CSV generation");
  }

  const csvContent = await exportUsersToCSV();
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users_export.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function exportUsersToCSV(): Promise<string> {
  const users = await getAllUsers();
  const headers = [
    "id",
    "name",
    "email",
    "full_name",
    "joined_date",
    "last_login",
    "status",
    "applications_sent",
    "resumes_uploaded",
    "subscription_type",
    "location"
  ];

  const rows = users.map((user) => [
    user.id,
    user.full_name || "",
    user.email || "",
    user.full_name || "",
    user.joined_date || "",
    user.last_login || "",
    user.status || "",
    user.applications_sent?.toString() || "0",
    user.resumes_uploaded?.toString() || "0",
    user.subscription_type || "free",
    user.location || ""
  ]);

  return [headers, ...rows]
    .map((row) => row.map((field) => `"${field?.toString().replace(/"/g, '""') || ""}"`).join(","))
    .join("\n");
}