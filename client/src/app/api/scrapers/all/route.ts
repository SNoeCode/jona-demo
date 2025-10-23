
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/utils/api-utils';

// import {validateScraperRequest}from "@/type/admin"
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { ScraperRequest } from '@/types/admin';
import { scraperApiClient } from '@/services/scraperApiClient'
export function validateScraperRequest(body: any): ScraperRequest {
  if (!body.keywords || !Array.isArray(body.keywords)) {
    throw new Error("Invalid keywords");
  }

  const now = new Date().toISOString();

  return {
    id: body.id || crypto.randomUUID(),
    job_title: body.job_title || "All Scrapers Run",
    max_results: body.max_results || 100,
    status: body.status || "pending",
    created_at: body.created_at || now,
    updated_at: body.updated_at || now,
    completed_at: body.completed_at || null,
    results_count: body.results_count || 0,
    error_message: body.error_message || null,
    location: body.location ?? "remote",
    days: body.days ?? 15,
    keywords: body.keywords,
    sites: body.sites ?? [],
    priority: body.priority ?? "medium",
    debug: body.debug ?? false,
    user_id: body.user_id,
    admin_user_id: body.admin_user_id,
    admin_email: body.admin_email,
    options: body.options || {},
  };
}


// client/src/app/api/scrapers/all/route.ts
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminAuth(request);
    if (!adminUser) {
      return createAuthResponse('Admin access required', 403);
    }
const body = await request.json().catch(() => ({}));
const scraperRequest = validateScraperRequest(body);
    scraperRequest.admin_user_id = adminUser.id;
    scraperRequest.admin_email = adminUser.email;

    const supabaseAdmin = await getSupabaseAdmin();

    // Create master log for all scrapers
    const { data: logData, error: logError } = await supabaseAdmin
      .from('scraping_logs')
      .insert({
        status: 'running',
        jobs_found: 0,
        jobs_saved: 0,
        sites_scraped: scraperRequest.sites || ['all'],
        keywords_used: scraperRequest.keywords,
        location: scraperRequest.location,
        started_at: new Date().toISOString(),
        user_id: scraperRequest.user_id || adminUser.id,
        admin_initiated: true,
        admin_user_id: adminUser.id,
        scraper_type: 'all_scrapers',
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create scraping log: ${logError.message}`);
    }

    const logId = logData.id;

    // Call FastAPI backend for all scrapers
    const scraperResult = await scraperApiClient.runAllScrapers(scraperRequest);

    // Update master log
    const finalStatus = scraperResult.success ? 'completed' : 'failed';
    await supabaseAdmin
      .from('scraping_logs')
      .update({
        status: finalStatus,
        jobs_found: scraperResult.jobs_found || 0,
        jobs_saved: scraperResult.jobs_found || 0,
        completed_at: new Date().toISOString(),
        error_message: scraperResult.error || null,
      })
      .eq('id', logId);

    return createSuccessResponse({
      ...scraperResult,
      log_id: logId,
      scraper_name: 'all_scrapers',
    });

  } catch (error) {
    console.error('All scrapers error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to run all scrapers'
    );
  }
}