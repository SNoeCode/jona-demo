// // import {
// // //  getInitialUserDashboardStats,
// //   UserMetadata,
// //   MetadataValue,
// //   SubscriptionPlan,
// //     ExperienceLevel,
// //   CurrentSubscription,
// //   UsagePayload,
// //   UserUsage,
// //   EnhancedUserProfile,
// // } from "@/types/user/index";
// import type { User } from '@supabase/supabase-js';

// // import { BaseDashboardStats, Job, JobApplication, Resume } from "@/types/user/index";

// export interface AdminUser extends User {
//   is_active: boolean;
//   subscription_status: string;
//    subscription_type: "free" | "pro" | "enterprise";
//   plan_name: string;
//   total_jobs_scraped: number;
//   total_applications: number;
// }

// export interface AdminJob extends Job {
//   user_name?: string;
//   user_email?: string;
//   application_count?: number;
//   created_by?: string;
// }

// export interface AdminResume extends Resume {
//   user_name?: string;
//   user_email?: string;
//   original_filename?: string;
//   uploaded_date?: string;
//   skills?: string[];
//   experience_years?: number;
//   education?: string;
//   match_score?: number;
//   applications_sent?: number;
//   file_url?: string;
//   parsed_content?: string;
// }

// export interface FilterOptions {
//   search?: string;
//   company?: string;
//   status?: string;
//   priority?: string;
//   date_range?: {
//     start: string;
//     end: string;
//   };
//   limit?: number;
//   offset?: number;
// }

// // Single consistent AdminDashboardStats interface
// export interface AdminDashboardStats extends BaseDashboardStats {
//   // User-related stats
//   totalUsers: number;
//   activeUsers: number;
  
//   // Match and performance stats
//   avgMatchScore: number;
  
//   // Financial stats
//   totalRevenue: number;
//   monthlyRecurringRevenue: number;
//   activeSubscriptions: number;
//   churnRate: number;
//   averageRevenuePerUser: number;
  
//   // Plan distribution
//   planDistribution: {
//     free: number;
//     pro: number;
//     enterprise: number;
//   };
// }

// export interface AdminDashboardProps {
//   initialJobs: AdminJob[];
//   initialUsers: AdminUser[];
//   initialStats: AdminDashboardStats;
//   initialFilters: FilterOptions;
//   user: AuthUser;
//   role: "admin";
//   applications: JobApplication[];
// }
// export interface AdminUser extends User {
//   full_name?: string;
//   joined_date?: string;
// last_login?: string | null;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
//     role: "user" | "admin" | "moderator" | "job_seeker";

// subscription_type: "free" | "pro" | "enterprise";

//   location?: string;
// }
// export interface ScrapingResult {
//   scraper: string;
//   result: ScraperResponse;
// }


// export interface AuthUser {
//   id: string;
//   email: string;
//   role: "admin";
//   aud: string;
//   created_at: string;
//   app_metadata: Record<string, MetadataValue>;
//   user_metadata: UserMetadata & {
//     role: "admin";
//     name?: string;
//   };
// }

// // Enhanced Admin Job

// export interface AdminEnhancedUserProfile {
//   // Core identity
//   id: string;
//   email?: string;
//   full_name?: string;
//   avatar_url?: string;
//   phone?: string;
//   location?: string;

//   // Profile metadata
//   bio?: string;
//   website?: string;
//   linkedin_url?: string;
//   github_url?: string;
//   job_title?: string;
//   company?: string;
//   experience_level?: ExperienceLevel;
//   preferred_job_types?: string[];
//   preferred_locations?: string[];
//   salary_range_min?: number;
//   salary_range_max?: number;
//   created_at?: string;
//   updated_at?: string;

//   // Admin-only metadata
//   joined_date?: string;
//   last_login?: string;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
//   subscription_type?: "free" | "pro" | "enterprise";
//   current_subscription?: CurrentSubscription | null;
//   usage?: UsagePayload | null;
//   lastSeen?: string;
// }

// // export interface AdminDashboardStats extends BaseDashboardStats {
// //   totalUsers: number;
// //   activeUsers: number;
// //   avgMatchScore: number;
// //   totalRevenue: number;
// //   monthlyRecurringRevenue: number;
// //   activeSubscriptions: number;
// //   churnRate: number;
// //   averageRevenuePerUser: number;
// //   planDistribution: {
// //     free: number;
// //     pro: number;
// //     enterprise: number;
// //   };
// // }
// // export interface AdminDashboardStats extends BaseDashboardStats {
// //   totalUsers: number;
// //   activeUsers: number;
// //   avgMatchScore: number;
// //   totalRevenue: number;
// //   monthlyRecurringRevenue: number;
// //   activeSubscriptions: number;
// //   churnRate: number;
// //   averageRevenuePerUser: number;
// //   planDistribution: {
// //     free: number;
// //     pro: number;
// //     enterprise: number;
// //   };
// // }
// // export interface AdminDashboardProps {
// //   initialJobs: Job[];
// //   initialUsers: AdminUser[];
// //   initialStats: AdminDashboardStats;
// //   initialFilters: FilterOptions;
// //   user: AuthUser;
// //   role: "admin";
// //   applications: JobApplication[]; // ✅ Add this line here
// // }


// // export interface FilterOptions {
// //   search?: string;
// //   company?: string;
// //   // status?: string;
// //   priority?: string;
// //   date_range?: {
// //     start: string;
// //     end: string;
// //   };
// //   limit?: number;
// //   offset?: number;
// // }

// // Enhanced Admin Resume
// // export interface AdminResume extends Resume {
// //   user_name?: string;
// //   user_email?: string;
// //   original_filename?: string;
// //   uploaded_date?: string;
// //   skills?: string[];
// //   experience_years?: number;
// //   education?: string;
// //   match_score?: number;
// //   applications_sent?: number;
// //   file_url?: string;
// //   parsed_content?: string;
// // }



// // // Enhanced Admin Dashboard Stats
// // export interface AdminDashboardStats extends BaseDashboardStats {
// //   totalUsers: number;
// //   activeUsers: number;
// //   totalResumes: number;
// //   avgMatchScore: number;
// //   totalApplications: number;
// //   totalRevenue: number;
// // }
// // export const getInitialAdminDashboardStats = (): AdminDashboardStats => ({
// //   ...getInitialUserDashboardStats(),
// //   totalUsers: 0,
// //   activeUsers: 0,
// //   totalRevenue: 0,
// //   monthlyRecurringRevenue: 0,
// //   activeSubscriptions: 0,
// //   churnRate: 0,
// //   averageRevenuePerUser: 0,
// //   planDistribution: {
// //     free: 0,
// //     pro: 0,
// //     enterprise: 0,
// //   },
// // });
// // export interface ScraperConfig {
// //   location?: string;
// //   days?: number;
// //   keywords?: string[];
// //   sites?: string[];
// //   priority?: "low" | "medium" | "high";
// //   user_id?: string;
// //   debug?: boolean;
// //   secret?: string;
// //   scrapers?: string[];
// //   options?: Record<string, unknown>;
// // }

// // export interface ScraperRequest extends ScraperConfig {
// //   // Required fields
// //   id: string;
// //   job_title: string;
// //   max_results: number;
// //   status: 'pending' | 'running' | 'completed' | 'failed';
// //   created_at: string;
// //   updated_at: string;
// //   completed_at: string | null;
// //   results_count: number;
// //   error_message: string | null;

// //   // Optional admin fields
// //   admin_user_id?: string;
// //   admin_email?: string;
// //   admin_notes?: string;
// // }

// // Admin API Response Types
// // export interface AdminScraperResponse extends ScraperResponse {
// //   admin_notes?: string;
// //   priority?: "low" | "medium" | "high";
// // }

// // Scraper configuration for each site

// // export interface ScraperRequest extends ScraperConfig {
// //   admin_user_id?: string;
// //   admin_email?: string;
// //   updated_at: string; // ✅ Add this

// //   // Required fields
// //   id: string;
// //   job_title: string;
// //   max_results: number;
// //   status: 'pending' | 'running' | 'completed' | 'failed';
// //   created_at: string;
// //   completed_at: string | null;
// //   results_count: number;
// //   error_message: string | null;

// //   // Optional fields
// //   location?: string;
// //   user_id?: string;
// //   keywords?: string[];
// //   days?: number;
// //   sites?: string[];
// //   priority?: "low" | "medium" | "high";
// //   debug?: boolean;
// //   secret?: string;
// //   scrapers?: string[];
// //   options?: Record<string, unknown>;
// //   admin_notes?: string;
// //   admin_user_id?: string;
// //   admin_email?: string;
// // }

// //   id: string;
// //   job_title: string;
// //   max_results: number;
// //   status: "pending" | "running" | "completed" | "failed"; // adjust as needed
// //   created_at: string;
// //   updated_at: string;

// //   location: string;
// //   days: number;
// //   keywords?: string[];
// //   sites: string[];
// //   debug?: boolean;
// //   priority?: "low" | "medium" | "high";
// //   user_id?: string;
// // }// Base configuration shared across scrapers
// export interface ScraperConfig {
//   location?: string;
//   days?: number;
//   keywords?: string[];
//   sites?: string[];
//   priority?: "low" | "medium" | "high";
//   user_id?: string;
//   debug?: boolean;
//   secret?: string;
//   scrapers?: string[];
//   options?: Record<string, unknown>;
// }

// // Full scraper request including metadata and admin context
// export interface ScraperRequest extends ScraperConfig {
//   // Required fields
//   id: string;
//   job_title: string;
//   max_results: number;
//   status: "pending" | "running" | "completed" | "failed";
//   created_at: string;
//   updated_at: string;
//   completed_at: string | null;
//   results_count: number;
//   error_message: string | null;

//   // Optional admin fields
//   admin_user_id?: string;
//   admin_email?: string;
//   admin_notes?: string;
// }
// // Registry of available scrapers
// export interface ScraperRegistry {
//   [key: string]: ScraperConfig;
// }
// export interface ScraperRequest extends ScraperConfig {
//   admin_user_id?: string;
//   admin_email?: string;
//   updated_at: string; // ✅ Add this
// }
// Individual scraper result when running multiple scrapers

// // export interface ScraperRequest extends ScraperConfig {
//   // Required fields
//   id: string;
//   job_title: string;
//   max_results: number;
//   status: 'pending' | 'running' | 'completed' | 'failed';
//   created_at: string;
//   updated_at: string;
//   completed_at: string | null;
//   results_count: number;
//   error_message: string | null;

//   // Optional admin fields
//   admin_user_id?: string;
//   admin_email?: string;
//   admin_notes?: string;
// }

// export interface ScraperRequest extends ScraperConfig {
//   admin_user_id?: string;
//   admin_email?: string;
//   updated_at: string; // ✅ Add this
// }
// Admin Subscription Management
// export interface AdminSubscriptionData {
//   user_id: string;
//   user_name: string;
//   user_email: string;
//   subscription: UserSubscription & { plan: SubscriptionPlan };
//   total_paid: number;
//   last_payment_date?: string;
//   usage: UserUsage[];
// }
// 
// // UPDATED: ScraperRequest to match your scraper types
export interface ScraperRequest {
  location?: string;
  user_id?: string;
  keywords?: string[];
  days?: number;
  sites?: string[];
  priority?: "low" | "medium" | "high";
  debug?: boolean; 
  secret?: string; 
  scrapers?: string[]; 
  options?: Record<string, unknown>
admin_notes?: string;

}

// UPDATED: ScraperResponse to match your scraper types
export interface ScraperResponse {
  success: boolean;
  output?: string;
  jobs_found?: number;
  jobs_count?: number; // Added as alias for jobs_found
  log_id?: string;
  error?: string;
notes?: string;
  // Added properties from your scraper types
  scraper_name?: string;
  status?: string;
  duration_seconds?: number;
  message?: string;
  jobs?: Job[];
}

// Admin API Response Types
// export interface AdminScraperResponse extends ScraperResponse {
//   admin_notes?: string;
//   priority?: "low" | "medium" | "high";
// }

// Admin Activity Summary
// export interface AdminActivitySummary {
//   recentJobs: AdminJob[];
//   recentUsers: AdminUser[];
//   recentLogs: ScrapingLog[];
// }

// Admin Bulk Operations
export interface AdminBulkOperation {
  operation: "delete" | "update" | "archive";
  entity_type: "jobs" | "users" | "resumes";
  entity_ids: string[];
  updates?: Record<string, unknown>;
}

export interface AdminBulkOperationResult {
  success: boolean;
  affected_count: number;
  errors?: string[];
}

// Admin Export Types
export interface AdminExportOptions {
  format: "csv" | "json" | "xlsx";
  entity_type: "jobs" | "users" | "resumes" | "subscriptions";
  filters?: Record<string, unknown>;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

// Admin Filter Types
export interface AdminJobFilters {
  search?: string;
  company?: string;
  status?: string;
  priority?: string;
  date_range?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

// Admin Analytics Types
export interface AdminAnalytics {
  user_growth: {
    month: string;
    new_users: number;
    total_users: number;
  }[];
  job_statistics: {
    month: string;
    jobs_scraped: number;
    applications_sent: number;
  }[];
  revenue_analytics: {
    month: string;
    revenue: number;
    new_subscriptions: number;
    canceled_subscriptions: number;
  }[];
  top_companies: {
    company: string;
    job_count: number;
  }[];
  popular_locations: {
    location: string;
    job_count: number;
  }[];
}

// Admin System Health
export interface AdminSystemHealth {
  database_status: "healthy" | "warning" | "critical";
  scraper_status: "active" | "idle" | "error";
  last_scrape_time?: string;
  api_response_time: number;
  active_users_count: number;
  pending_jobs_count: number;
  error_rate: number;
}

// Admin Configuration
export interface AdminConfiguration {
  scraper_settings: {
    auto_scrape_enabled: boolean;
    scrape_frequency_hours: number;
    max_jobs_per_scrape: number;
    supported_sites: string[];
  };
  email_settings: {
    smtp_enabled: boolean;
    daily_digest_enabled: boolean;
    notification_emails_enabled: boolean;
  };
  system_limits: {
    max_users: number;
    max_jobs_per_user: number;
    max_file_size_mb: number;
    max_resumes_per_user: number;
  };
}

// // Admin Permissions
// export type AdminPermission =
//   | "view_users"
//   | "edit_users"
//   | "delete_users"
//   | "view_jobs"
//   | "edit_jobs"
//   | "delete_jobs"
//   | "manage_subscriptions"
//   | "view_analytics"
//   | "system_configuration"
//   | "export_data"
//   | "bulk_operations";

// export interface AdminRole {
//   id: string;
//   name: string;
//   permissions: AdminPermission[];
//   is_super_admin: boolean;
// }

// // Admin Audit Log
export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  entity_type: "user" | "job" | "resume" | "subscription" | "system";
  entity_id?: string;
  old_values?: Record<string,unknown>;
  new_values?: Record<string,unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AdminSubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  payment_history: [];
  averageRevenuePerUser: number;
  planDistribution: Record<string, number>;
}

// Admin Notification Types
export interface AdminNotification {
  id: string;
  type:
    | "system_alert"
    | "user_action"
    | "subscription_event"
    | "scraper_status";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  data?: Record<string,unknown>;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

// Admin Report Types
export interface AdminReportConfig {
  id: string;
  name: string;
  type:
    | "user_activity"
    | "job_statistics"
    | "revenue_report"
    | "system_performance";
  parameters: Record<string,unknown>;
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    day_of_week?: number;
    day_of_month?: number;
    time: string;
  };
  email_recipients: string[];
  active: boolean;
}

export interface AdminReportResult {
  id: string;
  config_id: string;
  generated_at: string;
  data: Record<string,unknown>;
  file_path?: string;
  status: "success" | "failed";
  error_message?: string;
}

// UPDATED: ScrapingLog to be more comprehensive
export interface ScrapingLog {
  id: string;
  user_id?: string;
  status: string;
  jobs_found?: number;
  jobs_saved?: number; // Added jobs_saved property
  sites_scraped?: string[] | unknown; // jsonb in database
  keywords_used?: string[] | unknown; // jsonb in database
  location?: string; // Added location property
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  ended_at?: string; // Alternative name for completed_at
  duration_seconds?: number;
  site?: string;
  error?: string;
}
import {Job} from '@/types/user/jobs'
// // Re-export commonly used types
// export type AdminScrapingLog = ScrapingLog;
// // types/admin.ts


// ===== ADMIN USER TYPES =====
// export interface AdminAuthUser extends User {
//   user_metadata: {
//     role: 'admin';
//     full_name?: string;
//     email?: string;
//   };
// }

// export interface AdminUser {
//   id: string;
//   email: string;
//   // full_name: string | null;
//    role: "user" | "admin" | "moderator" | "job_seeker";


//   created_at: string;
// // last_login?: number | null;
//   is_active: boolean;
//   subscription_status: string;
//   plan_name: string;
//   total_jobs_scraped: number;
//   total_applications: number;
//    full_name?: string;
//   joined_date?: string;
//     user_profiles?: EnhancedUserProfile;
//   // last_login?: string;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
// subscription_type: "free" | "pro" | "enterprise";
//   location?: string;
// }

// ===== ADMIN JOB TYPES =====
export interface AdminJob extends Job {
  total_applications: number;
   posted_date?: string;
  applications_count?: number;
  views_count?: number;
  link?: string;
  applied_users: Array<{
    user_id: string;
    applied_at: string;
    user_profiles: {
      full_name: string;
      email: string;
    };
  }>;
  saved_users: Array<{
    user_id: string;
    saved_at: string;
    user_profiles: {
      full_name: string;
      email: string;
    };
  }>;
}
export interface PaymentRecord {
  amount: number;
  payment_date: string;
  status: string;
}



// export interface AdminSubscriptionData {
//   user_id: string;
//   user_name: string;
//   user_email: string;
//   subscription: {
//     id: string;
//     user_id: string;
//     plan_id: string;
//     status: 'active' | 'canceled' | 'expired' | 'past_due' | 'unpaid';
//     billing_cycle: 'monthly' | 'yearly';
//     price_paid: number | null;
//     created_at: string;
//     canceled_at: string | null;
//       payment_history?: PaymentRecord[];

//     current_period_start: string;
//     current_period_end: string;
//     stripe_subscription_id: string | null;
//     plan: SubscriptionPlan | null;
//   };
//   total_paid: number;
//   last_payment_date: string | null;
//   usage: UserUsage[];
//     payment_history: Payment[];
// }
export interface Payment {
  amount: number;
  payment_date: string;
  status: string;
}
export interface AdminSubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  // planDistribution: {
  //   free: number;
  //   pro: number;
  //   enterprise: number;
  //   [key: string]: number;
  // };
}
export interface AdminResume {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
  user_profile: {
    full_name: string;
    email: string;
  };
  // match_score: number | null;
  total_matches: number;
}


export interface ScrapingLog {
  id: string;
  request_id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ===== FILTER OPTIONS =====
export interface FilterOptions {
  // status: string;
  plan?: string;
  role?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

// ===== DASHBOARD PROPS =====


// ===== API RESPONSE TYPES =====
export interface AdminAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// // ===== ENHANCED DASHBOARD STATS =====
// export interface EnhancedDashboardStats extends BaseDashboardStats {
//   subscriptionStats: AdminSubscriptionStats;
//   recentActivity: Array<{
//     id: string;
//     type: 'user_signup' | 'subscription_created' | 'job_applied' | 'resume_uploaded';
//     description: string;
//     user_name: string;
//     created_at: string;
//   }>;
//   systemHealth: {
//     database_status: 'healthy' | 'warning' | 'error';
//     scraper_status: 'idle' | 'running' | 'error';
//     last_scrape: string | null;
//     pending_jobs: number;
//   };
// }

// ===== EXPORT TYPES =====
export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  include_usage?: boolean;
  include_payment_history?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

// ===== ACTION TYPES =====
export interface AdminAction {
  type: 'cancel_subscription' | 'refund_payment' | 'activate_user' | 'deactivate_user' | 'delete_job';
  target_id: string;
  performed_by: string;
  performed_at: string;
  details?: Record<string, unknown>;
}

// ===== ERROR TYPES =====
export interface AdminError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

// ===== COMPONENT PROPS =====
// export interface AdminTabProps {
//   user: AuthUser;
//   onStatsUpdate?: () => void;
// }

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// ===== TABLE TYPES =====
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

// ===== NOTIFICATION TYPES =====
export interface AdminNotification {
  id: string;
  // type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

// ===== METRICS TYPES =====
export interface AdminMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth_rate: number;
  };
  users: {
    total: number;
    active: number;
    new_this_month: number;
  };
  subscriptions: {
    active: number;
    canceled: number;
    churn_rate: number;
  };
  jobs: {
    total: number;
    applied: number;
    success_rate: number;
  };
}
// import {
//   Job,
//   Resume,
//   PublicUser,
//   UserMetadata,
//   MetadataValue,
//   DashboardStatsProps as BaseDashboardStats,
//   UserSubscription,
//   SubscriptionPlan,
//   ExperienceLevel,
//   CurrentSubscription,
//   UsagePayload,
//   UserSettings,
//   UserUsage,
//   SubscriptionStatus,
// } from "./index";

// // Enhanced Admin User (extends PublicUser with admin-specific fields)
// export interface AdminUser extends PublicUser {
//   full_name?: string;
//   joined_date?: string;
//   last_login?: string;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
//   subscription_type?: "free" | "premium";
//   location?: string;
// }
// export interface AdminAuthUser {
//   id: string;
//   email: string;
//   role: "admin";
//   aud: string;
//   // created_at: string;
//   app_metadata: Record<string, MetadataValue>;
//   user_metadata: UserMetadata & {
//     role: "admin";
//     name?: string;
//   };
// }

// // Enhanced Admin Job
// export interface AdminJob extends Job {
//   posted_date?: string;
//   applications_count?: number;
//   views_count?: number;
//   link?: string;
// }
// export interface AdminEnhancedUserProfile {
//   // Core identity
//   id: string;
//   email?: string;
//   full_name?: string;
//   avatar_url?: string;
//   phone?: string;
//   location?: string;

//   // Profile metadata
//   bio?: string;
//   website?: string;
//   linkedin_url?: string;
//   github_url?: string;
//   job_title?: string;
//   company?: string;
//   experience_level?: ExperienceLevel;
//   preferred_job_types?: string[];
//   preferred_locations?: string[];
//   salary_range_min?: number;
//   salary_range_max?: number;
//   created_at?: string;
//   updated_at?: string;
// is_admin?: boolean;
//   // Admin-only metadata
//   joined_date?: string;
//   last_login?: string;
//   status?: "active" | "inactive";
//   applications_sent?: number;
//   resumes_uploaded?: number;
//   profile_completed?: boolean;
//   subscription_type?: "free" | "premium";
//   current_subscription?: CurrentSubscription | null;
//   usage?: UsagePayload | null;
//   lastSeen?: string;
// }

// // Admin Dashboard Props
// export interface AdminDashboardProps {
//   initialFilters: FilterOptions;
//   initialJobs: Job[];
//   initialStats: BaseDashboardStats;
//   user: string; // ❌ should be AuthUser
//   role: string;
// }

// export interface FilterOptions {
//   search?: string;
//   company?: string;
//   status?: string;
//   priority?: string;
//   date_range?: {
//     start: string;
//     end: string;
//   };
//   limit?: number;
//   offset?: number;
// }

// // Enhanced Admin Resume
// export interface AdminResume extends Resume {
//   user_name?: string;
//   user_email?: string;
//   original_filename?: string;
//   uploaded_date?: string;
//   skills?: string[];
//   experience_years?: number;
//   education?: string;
//   match_score?: number;
//   applications_sent?: number;
//   file_url?: string;
//   parsed_content?: string;
// }

export const getInitialAdminDashboardStats = (): AdminDashboardStatsProps => ({
  // Job stats
  totalJobs: 0,
  appliedJobs: 0,
  savedJobs: 0,
  pendingJobs: 0,
  interviewJobs: 0,
  offerJobs: 0,
  rejectedJobs: 0,
  matchRate: 0,
  matchScore: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalResumes: 0,
  avgMatchScore: 0,
  totalApplications: 0,

  // Subscription stats
  totalRevenue: 0,
  monthlyRecurringRevenue: 0,
  activeSubscriptions: 0,
  churnRate: 0,
  averageRevenuePerUser: 0,
  planDistribution: {
    free: 0,
    pro: 0,
    premium: 0,
  },
});

export interface AdminDashboardStatsProps {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  pendingJobs: number;
  interviewJobs: number;
  offerJobs: number;
  rejectedJobs: number;
  matchRate: number;
  matchScore: number;
  totalUsers: number;
  activeUsers: number;
  totalResumes: number;
  avgMatchScore: number;
  totalApplications: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: 0,
  planDistribution: {
    free: 0,
    pro: 0,
    premium: 0,
  },
}

// // Enhanced Admin Dashboard Stats
// export interface AdminDashboardStats extends BaseDashboardStats {
//   totalUsers: number;
//   activeUsers: number;
//   totalResumes: number;
//   avgMatchScore: number;
//   totalApplications: number;
// }
// export interface ScraperRequest {
//   location?: string;
//   user_id?: string;
//   keywords?: string[];
//   days?: number;
//   sites?: string[];
//   priority?: "low" | "medium" | "high";
//   debug?: boolean;
//   secret?: string;
//   scrapers?: string[];
//   options?: Record<string, unknown>;
//   admin_notes?: string;
//   // Additional properties used in your scrapers
//   admin_user_id?: string;
//   admin_email?: string;
// }

// export interface ScraperResponse {
//   success: boolean;
//   output?: string;
//   jobs_found?: number;
//   jobs_saved?: number; // Used in your Indeed scraper
//   jobs_count?: number; // Alias for jobs_found
//   log_id?: string;
//   error?: string;
//   notes?: string;
//   scraper_name?: string;
//   status?: string;
//   duration_seconds?: number;
//   message?: string;
//   jobs?: Job[];
//   // Additional properties from your implementations
//   priority?: "low" | "medium" | "high";
//   admin_notes?: string;
// }

// // Admin API Response Types
// export interface AdminScraperResponse extends ScraperResponse {
//   admin_notes?: string;
//   priority?: "low" | "medium" | "high";
// }

// // Scraper configuration for each site
// export interface ScraperConfig {
//   label: string;
//   script: string;
//   enabled?: boolean;
//   timeout_ms?: number;
//   rate_limit_per_hour?: number;
// }

// // Registry of available scrapers
// export interface ScraperRegistry {
//   [key: string]: ScraperConfig;
// }

// // Individual scraper result when running multiple scrapers
// export interface ScrapingResult {
//   scraper: string;
//   result: ScraperResponse;
// }
// // Admin Subscription Management
// export interface AdminSubscriptionData {
//   user_id: string;
//   user_name: string;
//   user_email: string;
// subscription: CurrentSubscription; // if you've made `plan` required
//   total_paid: number;
//   last_payment_date?: string;
//   usage: UserUsage[];
//   payment_history: any[]
// }
// //
// // // UPDATED: ScraperRequest to match your scraper types
// // export interface ScraperRequest {
// //   location?: string;
// //   user_id?: string;
// //   keywords?: string[];
// //   days?: number;
// //   sites?: string[];
// //   priority?: "low" | "medium" | "high";
// //   debug?: boolean;
// //   secret?: string;
// //   scrapers?: string[];
// //   options?: Record<string, unknown>
// // admin_notes?: string;

// // }

// // // UPDATED: ScraperResponse to match your scraper types
// // export interface ScraperResponse {
// //   success: boolean;
// //   output?: string;
// //   jobs_found?: number;
// //   jobs_count?: number; // Added as alias for jobs_found
// //   log_id?: string;
// //   error?: string;
// // notes?: string;
// //   // Added properties from your scraper types
// //   scraper_name?: string;
// //   status?: string;
// //   duration_seconds?: number;
// //   message?: string;
// //   jobs?: Job[];
// // }

// // Admin API Response Types
// export interface AdminScraperResponse extends ScraperResponse {
//   admin_notes?: string;
//   priority?: "low" | "medium" | "high";
// }

// // Admin Activity Summary
// export interface AdminActivitySummary {
//   recentJobs: AdminJob[];
//   recentUsers: AdminUser[];
//   recentLogs: ScrapingLog[];
// }

// // Admin Bulk Operations
// export interface AdminBulkOperation {
//   operation: "delete" | "update" | "archive";
//   entity_type: "jobs" | "users" | "resumes";
//   entity_ids: string[];
//   updates?: Record<string, any>;
// }

// export interface AdminBulkOperationResult {
//   success: boolean;
//   affected_count: number;
//   errors?: string[];
// }

// // Admin Export Types
// export interface AdminExportOptions {
//   format: "csv" | "json" | "xlsx";
//   entity_type: "jobs" | "users" | "resumes" | "subscriptions";
//   filters?: Record<string, any>;
//   date_range?: {
//     start_date: string;
//     end_date: string;
//   };
// }

// // Admin Filter Types
// export interface AdminJobFilters {
//   search?: string;
//   company?: string;
//   status?: string;
//   priority?: string;
//   date_range?: {
//     start: string;
//     end: string;
//   };
//   limit?: number;
//   offset?: number;
// }

// // Admin Analytics Types
// export interface AdminAnalytics {
//   user_growth: {
//     month: string;
//     new_users: number;
//     total_users: number;
//   }[];
//   job_statistics: {
//     month: string;
//     jobs_scraped: number;
//     applications_sent: number;
//   }[];
//   revenue_analytics: {
//     month: string;
//     revenue: number;
//     new_subscriptions: number;
//     canceled_subscriptions: number;
//   }[];
//   top_companies: {
//     company: string;
//     job_count: number;
//   }[];
//   popular_locations: {
//     location: string;
//     job_count: number;
//   }[];
// }

// // Admin System Health
// export interface AdminSystemHealth {
//   database_status: "healthy" | "warning" | "critical";
//   scraper_status: "active" | "idle" | "error";
//   last_scrape_time?: string;
//   api_response_time: number;
//   active_users_count: number;
//   pending_jobs_count: number;
//   error_rate: number;
// }

// // Admin Configuration
// export interface AdminConfiguration {
//   scraper_settings: {
//     auto_scrape_enabled: boolean;
//     scrape_frequency_hours: number;
//     max_jobs_per_scrape: number;
//     supported_sites: string[];
//   };
//   email_settings: {
//     smtp_enabled: boolean;
//     daily_digest_enabled: boolean;
//     notification_emails_enabled: boolean;
//   };
//   system_limits: {
//     max_users: number;
//     max_jobs_per_user: number;
//     max_file_size_mb: number;
//     max_resumes_per_user: number;
//   };
// }

// // Admin Permissions
// export type AdminPermission =
//   | "view_users"
//   | "edit_users"
//   | "delete_users"
//   | "view_jobs"
//   | "edit_jobs"
//   | "delete_jobs"
//   | "manage_subscriptions"
//   | "view_analytics"
//   | "system_configuration"
//   | "export_data"
//   | "bulk_operations";

// export interface AdminRole {
//   id: string;
//   name: string;
//   permissions: AdminPermission[];
//   is_super_admin: boolean;
// }

// // Admin Audit Log
// export interface AdminAuditLog {
//   id: string;
//   admin_user_id: string;
//   admin_email: string;
//   action: string;
//   entity_type: "user" | "job" | "resume" | "subscription" | "system";
//   entity_id?: string;
//   old_values?: Record<string, any>;
//   new_values?: Record<string, any>;
//   ip_address?: string;
//   user_agent?: string;
//   timestamp: string;
// }

// export interface AdminSubscriptionStats {
//   totalRevenue: number;
//   monthlyRecurringRevenue: number;
//   activeSubscriptions: number;
//   churnRate: number;
//   averageRevenuePerUser: number;
//   planDistribution: Record<string, number>;
// }

// // Admin Notification Types
// export interface AdminNotification {
//   id: string;
//   type:
//     | "system_alert"
//     | "user_action"
//     | "subscription_event"
//     | "scraper_status";
//   priority: "low" | "medium" | "high" | "critical";
//   title: string;
//   message: string;
//   data?: Record<string, any>;
//   read: boolean;
//   created_at: string;
//   expires_at?: string;
// }

// // Admin Report Types
// export interface AdminReportConfig {
//   id: string;
//   name: string;
//   type:
//     | "user_activity"
//     | "job_statistics"
//     | "revenue_report"
//     | "system_performance";
//   parameters: Record<string, any>;
//   schedule?: {
//     frequency: "daily" | "weekly" | "monthly";
//     day_of_week?: number;
//     day_of_month?: number;
//     time: string;
//   };
//   email_recipients: string[];
//   active: boolean;
// }

// export interface AdminReportResult {
//   id: string;
//   config_id: string;
//   generated_at: string;
//   data: Record<string, any>;
//   file_path?: string;
//   status: "success" | "failed";
//   error_message?: string;
// }

// // UPDATED: ScrapingLog to be more comprehensive
// export interface ScrapingLog {
//   id: string;
//   user_id?: string;
//   status: string;
//   jobs_found?: number;
//   jobs_saved?: number; // Added jobs_saved property
//   sites_scraped?: string[] | any; // jsonb in database
//   keywords_used?: string[] | any; // jsonb in database
//   location?: string; // Added location property
//   error_message?: string;
//   started_at?: string;
//   completed_at?: string;
//   ended_at?: string; // Alternative name for completed_at
//   duration_seconds?: number;
//   site?: string;
//   error?: string;
// }

// // Re-export commonly used types
// export type AdminScrapingLog = ScrapingLog;
