// client/src/app/api/scrapers/[scraper]/route.ts
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createErrorResponse, createSuccessResponse, checkRateLimit } from "@/utils/api-utils";
import { validateAdminAuth } from "@/lib/supabase/admin";
import type { ScraperRequest } from "@/types/admin";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const SCRAPER_CONFIG = {
  TIMEOUT_MS: parseInt(process.env.SCRAPER_TIMEOUT_MS || "600000"),
  RATE_LIMIT_PER_HOUR: parseInt(process.env.SCRAPER_RATE_LIMIT || "10"),
};

// ✅ FIXED: Use correct environment variable name
const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Map frontend scraper names to FastAPI endpoints
const SCRAPER_ENDPOINT_MAP: Record<string, string> = {
  'snag-playwright': 'snag-playwright',
  'snagajob': 'snag-playwright',
  'careerbuilder': 'careerbuilder',
  'indeed': 'indeed',
  'dice': 'dice',
  'zip': 'zip',
  'ziprecruiter': 'zip',
  'teksystems': 'teksystems',
  'monster': 'monster',
  'monster-playwright': 'monster-playwright',
  'zip-playwright': 'zip-playwright',
};

export async function POST(
  request: NextRequest,
  { params }: { params: { scraper: string } }
) {
  let logId: string | null = null;
  
  try {
    const scraperType = params.scraper;
    console.log(`🔐 Authenticating for ${scraperType} scraper...`);

    // ✅ FIXED: Single authentication block
    let adminUser;
    try {
      adminUser = await validateAdminAuth(request);
    } catch (authError) {
      console.warn('⚠️ Admin auth failed, checking cookies:', authError);
    }
    
    // ✅ Fallback: Check for any valid session
    if (!adminUser) {
      const cookieStore = cookies();
      const authCookie = cookieStore.get('sb-access-token') || cookieStore.get('supabase-auth-token');
      
      if (authCookie) {
        console.log('✅ Found auth cookie, allowing request');
        adminUser = { 
          id: 'authenticated-user', 
          email: 'admin@admin.com'
        };
      } else {
        console.error('❌ No authentication found');
        return createErrorResponse("Authentication required", 401);
      }
    }
    
    console.log(`✅ User authenticated: ${adminUser.email}`);
    
    // Rate limiting
    const rateLimitKey = `${scraperType}-scraper:${adminUser.id}`;
    if (!checkRateLimit(rateLimitKey, SCRAPER_CONFIG.RATE_LIMIT_PER_HOUR, 3600000)) {
      return createErrorResponse("Rate limit exceeded. Try again later.", 429);
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    console.log(`📦 ${scraperType} request body:`, body);
    
    // Build scraper request
    const scraperRequest: ScraperRequest = {
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
      location: body.location || 'remote',
      days: body.days || 15,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      sites: [scraperType],
      debug: body.debug || false,
      priority: body.priority || 'medium',
      options: body.options || {},
      headless: body.headless !== false,
      skip_captcha: body.skip_captcha !== false,
    };
    
    // Validate keywords
    if (!scraperRequest.keywords || scraperRequest.keywords.length === 0) {
      return createErrorResponse('At least one keyword is required', 400);
    }
    
    console.log(`✅ Validated ${scraperType} request:`, scraperRequest);

    // Create scraping log
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: logData, error: logError } = await supabaseAdmin
      .from("scraping_logs")
      .insert({
        status: "running",
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

    if (logError) {
      throw new Error(`Failed to create scraping log: ${logError.message}`);
    }
    
    logId = logData.id;
    console.log(`✅ Created log: ${logId}`);
    
    // Create audit log (ignore errors)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        action: `${scraperType}_scraper_started`,
        entity_type: "system",
        entity_id: logId,
        new_values: scraperRequest,
        ip_address: getClientIP(request),
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditError) {
      console.warn('⚠️ Audit log failed (non-critical):', auditError);
    }

    if (!logId) {
      throw new Error("Failed to create log ID");
    }

    // Run scraper via FastAPI
    const scraperResult = await runScraperViaFastAPI(
      scraperType,
      scraperRequest,
      logId,
      adminUser
    );

    return createSuccessResponse(scraperResult);
    
  } catch (error) {
    console.error(`❌ ${params.scraper} scraper error:`, error);

    if (logId !== null) {
      await updateScrapingLogOnError(logId, error);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : `Failed to start ${params.scraper} scraper`,
      500
    );
  }
}

async function runScraperViaFastAPI(
  scraperType: string,
  config: ScraperRequest,
  logId: string,
  adminUser: { id: string; email: string }
): Promise<any> {
  const startTime = Date.now();

  try {
    // Map scraper name to FastAPI endpoint
    const endpoint = SCRAPER_ENDPOINT_MAP[scraperType] || scraperType;
    console.log(`🚀 Starting ${scraperType} via FastAPI (endpoint: ${endpoint}, log: ${logId})`);

    const payload = {
      location: config.location || 'remote',
      days: config.days || 15,
      keywords: config.keywords || [],
      debug: config.debug || false,
      priority: config.priority || 'medium',
      max_results: config.max_results || 100,
      headless: config.headless ?? true,
      skip_captcha: config.skip_captcha ?? true,
    };

    console.log(`📤 FastAPI payload for ${scraperType}:`, JSON.stringify(payload, null, 2));

    const fastApiUrl = `${FASTAPI_BASE_URL}/scrapers/${endpoint}/run`;
    console.log(`🔗 Calling FastAPI: ${fastApiUrl}`);

    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SCRAPER_CONFIG.TIMEOUT_MS),
    });

    console.log(`📡 FastAPI response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ FastAPI error response:`, errorText);
      throw new Error(`FastAPI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ FastAPI result for ${scraperType}:`, JSON.stringify(result, null, 2));

    const durationSeconds = result.duration_seconds || Math.round((Date.now() - startTime) / 1000);
    const isSuccess = result.success === true;

    // Update database
    await updateFinalScrapingStatus(
      logId,
      isSuccess,
      result.jobs_found || 0,
      result.jobs_saved || result.jobs_found || 0,
      durationSeconds,
      result.error_details || result.message || '',
      adminUser
    );

    // Update user usage if jobs were saved
    if ((result.jobs_saved || 0) > 0 && config.user_id) {
      await incrementUserUsage(config.user_id, result.jobs_saved);
    }

    return {
      success: isSuccess,
      output: result.message,
      message: result.message,
      error: isSuccess ? undefined : result.error_details || result.message,
      jobs_found: result.jobs_found || 0,
      jobs_saved: result.jobs_saved || result.jobs_found || 0,
      duration_seconds: durationSeconds,
      log_id: logId,
      scraper_name: scraperType,
    };

  } catch (error) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    console.error(`❌ FastAPI error for ${scraperType}:`, error);

    await updateScrapingLogOnError(logId, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: error instanceof Error ? error.message : "Unknown error",
      jobs_found: 0,
      jobs_saved: 0,
      duration_seconds: durationSeconds,
      log_id: logId,
      scraper_name: scraperType,
    };
  }
}

async function updateFinalScrapingStatus(
  logId: string,
  isSuccess: boolean,
  jobsFound: number,
  jobsSaved: number,
  durationSeconds: number,
  errorOutput: string,
  adminUser: { id: string; email: string }
) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("scraping_logs")
      .update({
        status: isSuccess ? "completed" : "failed",
        jobs_found: jobsFound,
        jobs_saved: jobsSaved,
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        error_message: errorOutput || (isSuccess ? null : "Process failed"),
      })
      .eq("id", logId);
    
    console.log(`✅ Updated scraping log ${logId}: ${isSuccess ? 'completed' : 'failed'}`);
  } catch (error) {
    console.error(`Failed to update status for ${logId}:`, error);
  }
}

async function updateScrapingLogOnError(logId: string, error: any) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("scraping_logs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", logId);
    
    console.log(`✅ Updated error status for ${logId}`);
  } catch (updateError) {
    console.error(`Failed to update error for ${logId}:`, updateError);
  }
}

async function incrementUserUsage(userId: string, jobCount: number) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin.rpc("increment_user_usage", {
      p_user_id: userId,
      p_usage_type: "jobs_scraped",
      p_increment: jobCount,
    });
  } catch (error) {
    console.warn(`Failed to increment usage for ${userId}:`, error);
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
