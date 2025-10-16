import { SubscriptionLimits } from "@/types/user/subscription";

export interface UserUsage {
  id?: string;
  user_id: string;
  month_year: string;
  jobs_scraped?: number;
  applications_submitted?: number;
  applications_sent?: number;
  resumes_uploaded?: number;
  errors_encountered?: number;
  bot_blocks?: number;
  success_rate?: number;
  notes?: string;
  storage_used_mb?: number;
  created_at?: string;
  updated_at?: string;
}
export interface UserUsageSummary {
  current_month: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
    errors_encountered?: number;
    bot_blocks?: number;
    success_rate?: number;
  };
  previous_month?: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
    success_rate?: number;
  };
  limits: UserSubscriptionLimits;
  percentage_used: {
    jobs: number;
    applications: number;
    resumes: number;
  };
}

export interface UserSubscriptionLimits {
  jobs_per_month: number;
  resumes: number;
  applications_per_day: number;
  auto_scrape_enabled: boolean;
  priority_support: boolean;
}

export interface UsageStats {
  current_month: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
  };
  limits: {
    jobs_per_month: number;
    applications_per_day: number;
    resumes: number;
    auto_scrape_enabled: boolean;
    priority_support: boolean;
  };
  percentage_used: {
    jobs: number;
    applications: number;
    resumes: number;
  };
}
export type UsagePayload = UserUsageSummary | UserUsage;

export function isUserUsageSummary(
  data: UsagePayload
): data is UserUsageSummary {
  return (
    "current_month" in data && "limits" in data && "percentage_used" in data
  );
}
export interface UserSubscriptionLimits {
  jobs_per_month: number;
  resumes: number;
  applications_per_day: number;
  auto_scrape_enabled: boolean;
  priority_support: boolean;
}
export interface UsageSummary {
  current_month: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
  };
  limits: UserSubscriptionLimits;
  percentage_used: {
    jobs: number;
    applications: number;
    resumes: number;
  };
}

export interface UsageSummary {
  current_month: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
  };
  limits: SubscriptionLimits;
  percentage_used: {
    jobs: number;
    applications: number;
    resumes: number;
  };
}




