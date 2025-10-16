import {
//  getInitialUserDashboardStats,
  UserMetadata,
  MetadataValue,
  SubscriptionPlan,
    ExperienceLevel,
  CurrentSubscription,
  UsagePayload,
  UserUsage,
  EnhancedUserProfile,
} from "@/types/user/index";
import type { User } from '@supabase/supabase-js';

export interface AdminEnhancedUserProfile {
  // Core identity
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  // Profile metadata
  bio?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  job_title?: string;
  company?: string;
  experience_level?: ExperienceLevel;
  preferred_job_types?: string[];
  preferred_locations?: string[];
  salary_range_min?: number;
  salary_range_max?: number;
  created_at?: string;
  updated_at?: string;
 joined_date?: string;
  last_login?: string;
  status?: "active" | "inactive";
  applications_sent?: number;
  resumes_uploaded?: number;
  profile_completed?: boolean;
  subscription_type?: "free" | "pro" | "enterprise";
  current_subscription?: CurrentSubscription | null;
  usage?: UsagePayload | null;
  lastSeen?: string;
}