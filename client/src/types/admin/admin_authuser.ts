import {
  UserMetadata,
  MetadataValue,

} from "@/types/user/index";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/user/authUser";
import { AuthUser } from "@/types/user/authUser";

export interface AdminUser extends AuthUser {
  
   id: string;
  email: string;
  aud: string;
  created_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: {
    [key: string]: string | number | boolean | null | undefined;
    full_name?: string;
    location?: string;
    current_organization_id?: string;
    // other fields...
  };
  role: UserRole; // ✅ widened to match `toAuthUser`
  full_name: string;
  joined_date: string;
 last_login: string | null;
 is_admin?: boolean;
  status?: "active" | "inactive";
 jobs_saved?: number;
  applications_sent: number;
  resumes_uploaded: number;
  profile_completed: boolean;
  subscription_type: "free" | "pro" | "enterprise";
  location: string;
  is_active: boolean;
    subscription_status: "active" | "inactive";
  plan_name: string;
  total_jobs_scraped: number;
  total_applications: number;
  
};


//   full_name?: string;
//   joined_date?: string;
//   last_login?: string | null;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//     is_active: boolean;
//   subscription_status: string;
//   plan_name: string;
//   total_jobs_scraped: number;
//   total_applications: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
//   role: "user" | "admin" | "moderator" | "job_seeker" | 'manager' | 'org';
//   subscription_type: "free" | "pro" | "enterprise";
//   location?: string;
// }
export interface AdminAuthUser {
  id: string;
  is_admin?: boolean;
  email: string;
  role: "admin";
  aud: string;
  created_at: string;
  app_metadata: Record<string, MetadataValue>;
  user_metadata: UserMetadata & {
    role: "admin";
    name?: string;
  };
}
