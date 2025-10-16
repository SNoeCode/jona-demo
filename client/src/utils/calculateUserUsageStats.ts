import type { UserUsage, CurrentSubscription, UsageSummary } from '@/types/user/index';

export function calculateUsageStats(
  usage: UserUsage | null,
  subscription: CurrentSubscription | null
): UsageSummary | null {
  if (!usage || !subscription) return null;

  const jobs_scraped = usage.jobs_scraped ?? 0;
  const applications_sent = usage.applications_sent ?? 0;
  const resumes_uploaded = usage.resumes_uploaded ?? 0;

  const limits = {
    jobs_per_month: subscription.max_jobs_per_month ?? 0,
    resumes: subscription.max_resumes ?? 0,
    applications_per_day: subscription.max_applications_per_day ?? 0,
    auto_scrape_enabled: subscription.auto_scrape_enabled,
    priority_support: subscription.priority_support,
  };

  const percentage_used = {
    jobs: limits.jobs_per_month
      ? Math.min(100, Math.round((jobs_scraped / limits.jobs_per_month) * 100))
      : 0,
    applications: limits.applications_per_day
      ? Math.min(100, Math.round((applications_sent / limits.applications_per_day) * 100))
      : 0,
    resumes: limits.resumes
      ? Math.min(100, Math.round((resumes_uploaded / limits.resumes) * 100))
      : 0,
  };

  return {
    current_month: {
      jobs_scraped,
      applications_sent,
      resumes_uploaded,
    },
    limits,
    percentage_used,
  };
}