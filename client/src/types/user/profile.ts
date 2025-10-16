import {
    // UserUsage,
   ExperienceLevel,
   AuthUser,
  CurrentSubscription,
  UsagePayload,
  UserSettings,
} from "@/types/user/index";
export interface InsertUserProfilePayload {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  job_title?: string;
  company?: string;
  experience_level?: string;
  preferred_job_types?: string[];
  preferred_locations?: string[];
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  resume_url?: string | null;
  role?: string;
  subscription_plan?: string;
}
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
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
  success?:string;
  result?: string | null | undefined;
}
export interface ProfilePageProps {
  user: AuthUser;
  enhancedUserProfile: EnhancedUserProfile;
  settings: UserSettings | null;
  setCurrentPageAction?: (page: string) => void;
  isAdmin?: boolean;
  loading?: boolean;
  handleLogout?: () => void;
}


export interface ProfileUpdateResponse {
  success: boolean;
  error?: string;
  data?: UserProfile | null;
}
export interface EnhancedUserProfile {
  id: string;
  email?: string;
  full_name?: string;
  first_name?:string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
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
  subscription_plan?: [];
  current_subscription?: CurrentSubscription | null;
  usage?: UsagePayload | null;
  lastSeen?: string;
}
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: string;
}
export interface ProfileSlice {
  profile: EnhancedUserProfile;
  settings?: UserSettings;
}
export interface BillingInfo {
  subscription: CurrentSubscription | null;
  billing_period_end?: string;
  payment_method_last4?: string;
  plan_name?: string;
  status?: 'active' | 'canceled' | 'past_due' | 'trialing';
}
export interface UserDashboardStats {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  pendingJobs: number;
  interviewJobs: number;
  offerJobs: number;
  rejectedJobs: number;
  matchRate: number;
  matchScore: number;
  totalResumes: number;
  totalApplications: number;
}