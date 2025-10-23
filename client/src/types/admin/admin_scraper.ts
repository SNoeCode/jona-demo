import type {
  UserMetadata,
  MetadataValue,
  SubscriptionPlan,
  ExperienceLevel,
  CurrentSubscription,
  UsagePayload,
  UserUsage,
  Job,
  EnhancedUserProfile,
} from "@/types/user/index";

import type { User } from "@supabase/supabase-js";
import type { AdminJob } from "./admin_jobs";

// ─────────────────────────────────────────────────────────────
// Scraper Types
// ─────────────────────────────────────────────────────────────

export interface ScraperConfig {
  id: string;
  location?: string;
  days?: number;
  keywords?: string[];
  sites?: string[];
  priority?: "low" | "medium" | "high";
  user_id?: string;
  debug?: boolean;
  secret?: string;
  scrapers?: string[];
  options?: Record<string, unknown>;
}

export interface ScraperRequest extends ScraperConfig {
  job_title: string;
  max_results: number;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  results_count: number;
  error_message: string | null;
  admin_user_id?: string;
  admin_email?: string;
  admin_notes?: string;
  headless: boolean;
  skip_captcha: boolean;
}

export interface ScraperRegistry {
  [key: string]: ScraperConfig;
}

export interface ScraperResponse {
  success: boolean;
  output?: string;
  jobs_found?: number;
  jobs_count?: number;
  log_id?: string;
  error?: string;
  notes?: string;
  scraper_name?: string;
  status?: string;
  duration_seconds?: number;
  message?: string;
  jobs?: Job[];
}

export interface ScrapingResult {
  scraper: string;
  result: ScraperResponse;
  logId?: string| null
}

// ─────────────────────────────────────────────────────────────
// Admin Configuration & Reports
// ─────────────────────────────────────────────────────────────

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

export interface AdminReportConfig {
  id: string;
  name: string;
  type: "user_activity" | "job_statistics" | "revenue_report" | "system_performance";
  parameters: Record<string, unknown>;
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
  data: Record<string, unknown>;
  file_path?: string;
  status: "success" | "failed";
  error_message?: string;
}

// ─────────────────────────────────────────────────────────────
// Scraping Logs
// ─────────────────────────────────────────────────────────────

export interface ScrapingLog {
  id: string;
  user_id?: string;
  status: "running" | "completed" | "failed" | string;
  jobs_found?: number;
  jobs_saved?: number;
  sites_scraped?: string[] | unknown;
  keywords_used?: string[] | unknown;
  location?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  site?: string;
  error?: string;
  admin_initiated?: boolean;
  admin_user_id?: string;
  scraper_type?: string;
  timestamp?: string;
  level?: "info" | "warn" | "error" | "debug" | string;
  scraper_name?: string;
  operation?: string;
  message?: string;
  duration_ms?: number;
  error_details?: any;
  metadata?: Record<string, any>;
  jobs?: Job[];
  progress_info?: any;
  last_updated?: string;
}

export type AdminScrapingLog = ScrapingLog;

// ─────────────────────────────────────────────────────────────
// Generic API Response
// ─────────────────────────────────────────────────────────────

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

