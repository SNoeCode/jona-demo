// app/services/admin/admin_resumes.ts - Fixed with correct column names
'use server'
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminBaseURL } from "@/services/base";

export interface AdminResume {
  id: string;
  user_id: string;
  file_path: string;
  file_size?: number;
  resume_type?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
  resume_text?: string;
  raw_text?: string;
  clean_text?: string;
  file_name?: string;
  file_type?: string;
  is_default?: boolean;
  status?: string;
  applications_sent?: number;
  uploaded_date?: string;
  experience_years?: number;
  education?: string;
  skills?: string[];
  match_score?: number;
  parsed_content?: string;
  // Note: original_filename exists in your schema but can be null
  original_filename?: string | null;
  
  // Additional fields for admin view
  user_email?: string;
  user_name?: string;
}

export async function getAllResumes(): Promise<AdminResume[]> {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    console.log("🔍 Fetching all resumes with admin client...");
    
    // Use the admin client to bypass RLS
    const { data: resumesData, error: resumesError } = await supabaseAdmin
      .from("resumes")
      .select(`
        id,
        user_id,
        file_path,
        file_size,
        resume_type,
        active,
        created_at,
        updated_at,
        resume_text,
        raw_text,
        clean_text,
        file_name,
        file_type,
        is_default,
        status,
        applications_sent,
        uploaded_date,
        experience_years,
        education,
        skills,
        match_score,
        parsed_content,
        original_filename
      `)
      .order('created_at', { ascending: false });

    if (resumesError) {
      console.error("Error fetching resumes:", resumesError);
      throw resumesError;
    }

    console.log(`✅ Fetched ${resumesData?.length || 0} resumes`);

    // Get user information separately to avoid permission issues
    const userIds = [...new Set(resumesData?.map(r => r.user_id).filter(Boolean) || [])];
    
    let usersMap = new Map();
    if (userIds.length > 0) {
      try {
        // Try to get user profiles first
        const { data: profilesData } = await supabaseAdmin
          .from("user_profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            usersMap.set(profile.id, {
              email: profile.email,
              name: profile.full_name
            });
          });
        }

        // For users not in profiles, try auth.users via admin API
        const missingUserIds = userIds.filter(id => !usersMap.has(id));
        
        for (const userId of missingUserIds) {
          try {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (user) {
              usersMap.set(userId, {
                email: user.email,
                name: user.user_metadata?.full_name || 'Unknown'
              });
            }
          } catch (err) {
            console.warn(`Could not fetch user ${userId}:`, err);
            usersMap.set(userId, {
              email: 'Unknown',
              name: 'Unknown'
            });
          }
        }
      } catch (err) {
        console.warn("Error fetching user data:", err);
      }
    }

    // Combine resume data with user information
    const enrichedResumes: AdminResume[] = (resumesData || []).map(resume => ({
      ...resume,
      user_email: usersMap.get(resume.user_id)?.email || 'Unknown',
      user_name: usersMap.get(resume.user_id)?.name || 'Unknown',
    }));

    return enrichedResumes;

  } catch (error) {
    console.error("Error in getAllResumes:", error);
    throw new Error("Failed to fetch resumes: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getResumeById(id: string): Promise<AdminResume | null> {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select(`
        id,
        user_id,
        file_path,
        file_size,
        resume_type,
        active,
        created_at,
        updated_at,
        resume_text,
        raw_text,
        clean_text,
        file_name,
        file_type,
        is_default,
        status,
        applications_sent,
        uploaded_date,
        experience_years,
        education,
        skills,
        match_score,
        parsed_content,
        original_filename
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching resume:", error);
      return null;
    }

    // Get user info
    let userInfo = { email: 'Unknown', name: 'Unknown' };
    if (data.user_id) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
        if (user) {
          userInfo = {
            email: user.email || 'Unknown',
            name: user.user_metadata?.full_name || 'Unknown'
          };
        }
      } catch (err) {
        console.warn("Could not fetch user info:", err);
      }
    }

    return {
      ...data,
      user_email: userInfo.email,
      user_name: userInfo.name,
    };

  } catch (error) {
    console.error("Error in getResumeById:", error);
    return null;
  }
}

export async function deleteResume(id: string): Promise<boolean> {
  try {
    // Try API endpoint first
    const baseURL = await getAdminBaseURL();
    const response = await fetch(`${baseURL}/resumes/${id}`, {
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
    const { error } = await supabaseAdmin
      .from("resumes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting resume:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteResume:", error);
    return false;
  }
}

export async function getResumesByUser(userId: string): Promise<AdminResume[]> {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select(`
        id,
        user_id,
        file_path,
        file_size,
        resume_type,
        active,
        created_at,
        updated_at,
        resume_text,
        raw_text,
        clean_text,
        file_name,
        file_type,
        is_default,
        status,
        applications_sent,
        uploaded_date,
        experience_years,
        education,
        skills,
        match_score,
        parsed_content,
        original_filename
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user resumes:", error);
      return [];
    }

    // Get user info
    let userInfo = { email: 'Unknown', name: 'Unknown' };
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (user) {
        userInfo = {
          email: user.email || 'Unknown',
          name: user.user_metadata?.full_name || 'Unknown'
        };
      }
    } catch (err) {
      console.warn("Could not fetch user info:", err);
    }

    return (data || []).map(resume => ({
      ...resume,
      user_email: userInfo.email,
      user_name: userInfo.name,
    }));

  } catch (error) {
    console.error("Error in getResumesByUser:", error);
    return [];
  }
}

export async function getResumes(
  page = 1,
  search = "",
  status = "all"
): Promise<{ 
  resumes: AdminResume[]; 
  total: number; 
  page: number; 
  limit: number; 
}> {
  try {
    // Try API endpoint first
    const baseURL = await getAdminBaseURL();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(search && { search }),
      ...(status !== "all" && { status }),
    });

    const response = await fetch(`${baseURL}/resumes?${params}`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  // Fallback to direct queries
  const allResumes = await getAllResumes();

  let filtered = allResumes;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (resume) =>
        resume.file_name?.toLowerCase().includes(searchLower) ||
        resume.user_email?.toLowerCase().includes(searchLower) ||
        resume.user_name?.toLowerCase().includes(searchLower)
    );
  }
  
  if (status !== "all") {
    filtered = filtered.filter((resume) => resume.status === status);
  }

  const limit = 20;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    resumes: paginated,
    total: filtered.length,
    page,
    limit,
  };
}