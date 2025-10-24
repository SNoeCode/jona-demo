// types/scraper.ts
export interface ScraperRequest {
  id?: string;
  location: string;
  days: number;
  keywords: string[];
  sites?: string[];
  priority: "low" | "medium" | "high";
  debug?: boolean;
  max_results: number;
  user_id?: string;
  admin_user_id?: string;
  admin_email?: string;
  headless: boolean;
  skip_captcha: boolean;
}

export interface ScraperResponse {
  success: boolean;
  scraper_name: string;
  jobs_found: number;
  jobs_saved?: number;
  jobs_count?: number;
  duration_seconds?: number;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  error?: string;
  log_id?: string;
  output?: string;
}

export interface ScrapingLog {
  id: string;
  status: "running" | "completed" | "failed";
  jobs_found: number;
  jobs_saved: number;
  duration_seconds?: number;
  started_at: string;
  completed_at?: string;
  scraper_type?: string;
  error_message?: string;
  location?: string;
  keywords_used?: string[];
  sites_scraped?: string[];
}

export interface ScraperStats {
  totalSessions: number;
  totalJobsFound: number;
  averageDuration: number;
  successRate: number;
}

export type ScraperType = 
  | "indeed" 
  | "careerbuilder" 
  | "dice" 
  | "zip" 
  | "teksystems" 
  | "monster"
  | "monster-playwright"
  | "zip-playwright"
  | "snag-playwright";

export interface ScraperMetadata {
  id: ScraperType;
  name: string;
  description: string;
  endpoint: string;
  status: "active" | "inactive";
}