// client/src/helpers/scraperHelper.ts
import type { ScraperRequest } from "@/types/admin/admin_scraper";

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string;
  created_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/**
 * Create a properly formatted scraper request
 */
export function createScraperRequest(
  config: Partial<ScraperRequest>,
  user: AuthUser
): ScraperRequest {
  const now = new Date().toISOString();
  return {
    id: config.id || crypto.randomUUID(),
    job_title: config.job_title || "Job Scraping Task",
    max_results: config.max_results || 100,
    status: config.status || "pending",
    created_at: config.created_at || now,
    updated_at: config.updated_at || now,
    completed_at: config.completed_at || null,
    admin_user_id: user.id,
    admin_email: user.email || "unknown@domain.com",
    location: config.location || "remote",
    days: config.days || 15,
    keywords: config.keywords || [],
    sites: config.sites || [],
    debug: config.debug || false,
    priority: config.priority || "medium",
    options: config.options || {},
    results_count: config.results_count || 0,
    error_message: config.error_message || null,
    // ✅ Add missing fields for Snagajob
    headless: config.headless ?? true,
    skip_captcha: config.skip_captcha ?? true,
  };
}

/**
 * Validate scraper configuration
 */
export function validateScraperConfig(
  config: Partial<ScraperRequest>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.keywords || config.keywords.length === 0) {
    errors.push("At least one keyword is required");
  }

  if (config.days && (config.days < 1 || config.days > 30)) {
    errors.push("Days must be between 1 and 30");
  }

  if (config.max_results && config.max_results > 1000) {
    errors.push("Max results cannot exceed 1000");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format scraper response for display
 */
export function formatScraperResponse(response: any) {
  return {
    ...response,
    jobs_found: response.jobs_found || response.jobs_count || 0,
    duration: response.duration_seconds
      ? formatDuration(response.duration_seconds)
      : "N/A",
  };
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor(
    (seconds % 3600) / 60
  )}m`;
}

/**
 * Get scraper display name
 */
export function getScraperDisplayName(scraperName: string): string {
  const nameMap: Record<string, string> = {
    indeed: "Indeed",
    careerbuilder: "CareerBuilder",
    dice: "Dice",
    zip: "ZipRecruiter",
    ziprecruiter: "ZipRecruiter",
    teksystems: "TekSystems",
    monster: "Monster",
    "monster-playwright": "Monster (Playwright)",
    "zip-playwright": "ZipRecruiter (Playwright)",
    "snag-playwright": "Snagajob (Playwright)",
    snagajob: "Snagajob",
  };
  return nameMap[scraperName] || scraperName;
}

/**
 * ✅ NEW: Get auth headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  // Get Supabase session token if available
  if (typeof window !== 'undefined') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        };
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }
  
  return {
    'Content-Type': 'application/json',
  };
}