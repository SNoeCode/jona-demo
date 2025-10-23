import { NextRequest } from 'next/server';
import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/utils/api-utils';
import { scraperApiClient } from '@/services/scraperApiClient';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ScraperRequest } from '@/types/admin';

const SCRAPER_CONFIG = {
  RATE_LIMIT_PER_HOUR: parseInt(process.env.SCRAPER_RATE_LIMIT || '10'),
};

export async function POST(request: NextRequest) {
  const adminUser = await validateAdminAuth(request);
  if (!adminUser) {
    return createAuthResponse('Admin access required', 403);
  }

  const rateLimitKey = `careerbuilder-scraper:${adminUser.id}`;
  if (!checkRateLimit(rateLimitKey, SCRAPER_CONFIG.RATE_LIMIT_PER_HOUR, 3600000)) {
    return createErrorResponse('Rate limit exceeded. Try again later.', 429);
  }

  return await runScraperJob({
    request,
    adminUser,
    scraperType: 'careerbuilder',
    runScraper: scraperApiClient.runCareerBuilder,
  });
}

async function runScraperJob({
  request,
  adminUser,
  scraperType,
  runScraper,
}: {
  request: NextRequest;
  adminUser: { id: string; email: string };
  scraperType: string;
  runScraper: (req: ScraperRequest) => Promise<any>;
}) {
  let logId: string | null = null;

  try {
    const body = await request.json().catch(() => ({}));

    const scraperRequest: ScraperRequest = {
      ...validateScraperRequest(body),
      id: crypto.randomUUID(),
      job_title: body.job_title || `${scraperType} Scrape`,
      max_results: body.max_results || 100,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      results_count: 0,
      error_message: null,
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      sites: [scraperType],
    };

    const supabase = await getSupabaseAdmin();

    const { data: logData, error: logError } = await supabase
      .from('scraping_logs')
      .insert({
        status: 'running',
        jobs_found: 0,
        jobs_saved: 0,
        sites_scraped: [scraperType],
        keywords_used: scraperRequest.keywords,
        location: scraperRequest.location,
        started_at: new Date().toISOString(),
        user_id: scraperRequest.user_id || adminUser.id,
        admin_initiated: true,
        admin_user_id: adminUser.id,
        scraper_type: scraperType,
      })
      .select()
      .single();

    if (logError) throw new Error(`Failed to create scraping log: ${logError.message}`);
    logId = logData.id;

    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      action: `${scraperType}_scraper_started`,
      entity_type: 'system',
      entity_id: logId,
      new_values: scraperRequest,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    const scraperResult = await runScraper(scraperRequest);
    const finalStatus = scraperResult.success ? 'completed' : 'failed';

    await supabase
      .from('scraping_logs')
      .update({
        status: finalStatus,
        jobs_found: scraperResult.jobs_found || 0,
        jobs_saved: scraperResult.jobs_found || 0,
        completed_at: new Date().toISOString(),
        error_message: scraperResult.error || null,
      })
      .eq('id', logId);

    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      action: scraperResult.success
        ? `${scraperType}_scraper_completed`
        : `${scraperType}_scraper_failed`,
      entity_type: 'system',
      entity_id: logId,
      new_values: {
        jobs_found: scraperResult.jobs_found || 0,
        jobs_saved: scraperResult.jobs_found || 0,
        status: finalStatus,
      },
    });

    return createSuccessResponse({
      ...scraperResult,
      log_id: logId,
      scraper_name: scraperType,
    });
  } catch (error) {
    console.error(`${scraperType} scraper error:`, error);

    if (logId) {
      const supabase = await getSupabaseAdmin();
      await supabase
        .from('scraping_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : `Failed to start ${scraperType} scraper`
    );
  }
}

function validateScraperRequest(body: any): Partial<ScraperRequest> {
  const location = typeof body.location === 'string' ? body.location.trim() : 'remote';
  const days = Math.min(30, Math.max(1, parseInt(body.days) || 15));
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((k: any) => typeof k === 'string' && k.trim()).slice(0, 10)
    : [];
  const priority = ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium';
  const user_id = typeof body.user_id === 'string' ? body.user_id : 'unknown';
  const debug = !!body.debug;

  if (keywords.length === 0) {
    throw new Error('At least one keyword is required');
  }

  return {
    location,
    days,
    keywords,
    sites: [],
    priority,
    user_id,
    debug,
  };
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}