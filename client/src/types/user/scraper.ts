export interface ScraperMetrics {
  scraper_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_seconds: number;
  avg_jobs_per_run: number;
  last_run_time: string;
  success_rate: number;
  peak_performance: {
    max_jobs_single_run: number;
    fastest_run_seconds: number;
    slowest_run_seconds: number;
  };
}

export interface ScraperPerformanceReport {
  overall_stats: {
    total_scrapers: number;
    total_runs: number;
    total_jobs_found: number;
    avg_run_time_seconds: number;
    success_rate: number;
  };
  individual_metrics: ScraperMetrics[];
  time_period: {
    start_date: string;
    end_date: string;
    days_analyzed: number;
  };
  recommendations: {
    optimal_run_frequency: string;
    best_performing_scrapers: string[];
    scalability_notes: string[];
  };
}

export interface ScraperBenchmark {
  scraper_name: string;
  test_runs: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  success_rate: number;
  jobs_per_second: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  network_requests: number;
  errors_encountered: number;
}

export interface ScraperConfig {
  id: string;
  job_title: string;
  max_results: number;
  status: "pending" | "running" | "completed" | "failed"; // adjust as needed
  created_at: string;
  updated_at: string;

  location: string;
  days: number;
  keywords?: string[];
  sites: string[];
  debug?: boolean;
  priority?: "low" | "medium" | "high";
  user_id?: string;
}

export interface ScraperResponse {
  scraper_name: string;
  jobs_count: number;
  status: string;
  duration_seconds: number;
  message: string;
  success: boolean;
  log_id?: string;
  output?: string;
  error?: string;
}

export interface AllScrapersResponse {
  scrapers_run: string[];
  total_jobs: number;
  individual_results: Record<string, number>;
  duration_seconds: number;
  status: string;
  message: string;
  success_rate: number;
  detailed_results: ScraperResult[];
  master_log_id: string;
}

export interface ScraperResult {
  scraper: string;
  success: boolean;
  jobs_count: number;
  duration_seconds: number;
  error?: string;
  log_id?: string;
}

// types/admin.ts
export interface ScraperRequest extends ScraperConfig {
  admin_user_id?: string;
  admin_email?: string;
}
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


export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
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
  ended_at?: string; // alias for completed_at
  duration_seconds?: number;
  duration_ms?: number;
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
  error_details?: any;
  metadata?: Record<string, any>;
  jobs?: Job[];
  progress_info?: any;
  last_updated?: string;
}
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_description: string;
  url: string;
  source: string;
  posted_date?: string;
  salary?: string;
  job_type?: string;
  remote: boolean;
  skills?: string[];
  flat_skills?: string[];
  skills_by_category?: Record<string, string[]>;
  scraped_at: string;
  scraping_log_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScraperStatus {
  available_scrapers: string[];
  running_scrapers: number;
  environment: string;
  last_run?: string;
  total_jobs_today?: number;
}

export interface ScrapingStats {
  total_sessions: number;
  total_jobs_found: number;
  total_jobs_saved: number;
  success_rate: number;
  average_duration: number;
  most_productive_scraper: string;
  recent_activity: ScrapingLog[];
}

// Admin dashboard specific types
export interface AdminDashboardData {
  scraping_logs: ScrapingLog[];
  audit_logs: AdminAuditLog[];
  system_stats: {
    active_scrapers: number;
    jobs_scraped_today: number;
    total_jobs: number;
    success_rate: number;
  };
  recent_jobs: Job[];
}

export interface SystemConfiguration {
  key: string;
  value: any;
  updated_by?: string;
  updated_at?: string;
  description?: string;
}

export interface ScraperNotification {
  id: string;
  type:
    | "scraper_started"
    | "scraper_completed"
    | "scraper_failed"
    | "jobs_found";
  scraper_name: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  status_code?: number;
  details?: any;
}

export interface ScraperError extends ApiError {
  scraper_name: string;
  log_id?: string;
  stage?: "initialization" | "scraping" | "processing" | "saving";
}
export interface ScraperCardProps {
  scraper: {
    id: string;
    name: string;
    description: string;
    status: "idle" | "running" | "completed" | "failed";
    lastRun?: string;
    totalJobs?: number;
  };
  onRun: (scraperId: string) => void;
  onViewLogs: (scraperId: string) => void;
  disabled?: boolean;
}

export interface LogViewerProps {
  logs: ScrapingLog[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetails: (logId: string) => void;
}

// Real-time updates
export interface RealtimeScraperUpdate {
  log_id: string;
  scraper_name: string;
  status: string;
  jobs_found: number;
  jobs_saved: number;
  progress_percentage?: number;
  message?: string;
  timestamp: string;
}
