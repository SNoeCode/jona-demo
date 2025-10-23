// // client/src/app/api/scrapers/snag-playwright/route.ts
// import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// import { createErrorResponse, createSuccessResponse, checkRateLimit } from "@/utils/api-utils";
// import { validateAdminAuth } from "@/lib/supabase/admin";
// import type { ScraperRequest } from "@/types/admin";
// import { NextRequest } from "next/server";
// import { cookies } from "next/headers";

// const SCRAPER_CONFIG = {
//   TIMEOUT_MS: parseInt(process.env.SCRAPER_TIMEOUT_MS || "600000"),
//   RATE_LIMIT_PER_HOUR: parseInt(process.env.SCRAPER_RATE_LIMIT || "10"),
// };

// const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// export async function POST(request: NextRequest) {
//   let logId: string | null = null;

//   try {
//     console.log('🔐 Authenticating for snag-playwright scraper...');

//     // ✅ SIMPLIFIED AUTH: Default to dev user for testing
//     let adminUser: { id: string; email: string } = {
//       id: 'dev-user',
//       email: 'dev@localhost'
//     };
    
//     // Try to get real admin user if available
//     try {
//       const validatedUser = await validateAdminAuth(request);
//       if (validatedUser && typeof validatedUser.id === "string" && typeof validatedUser.email === "string") {
//         adminUser = validatedUser;
//         console.log('✅ Admin auth successful:', adminUser.email);
//       } else {
//         throw new Error("Admin authentication failed: invalid user object");
//       }
//     } catch (authError) {
//       console.warn('⚠️ Admin auth failed, using dev user:', authError);
      
//       // Try cookie-based auth as fallback
//       const cookieStore = cookies();
//       const authCookie = cookieStore.get('sb-access-token') || 
//                         cookieStore.get('supabase-auth-token') ||
//                         cookieStore.get('sb-kebjyahvjvhtcohmxkdo-auth-token');
      
//       if (authCookie) {
//         console.log('✅ Found auth cookie');
//         adminUser = { 
//           id: 'authenticated-user', 
//           email: 'user@domain.com'
//         };
//       } else {
//         console.log('⚠️ No authentication found, using dev user for testing');
//       }
//     }

//     console.log('✅ User authenticated:', adminUser.email);

//     // Rate limiting - skip for dev user
//     if (adminUser.id !== 'dev-user') {
//       const rateLimitKey = `snag-scraper:${adminUser.id}`;
//       if (!checkRateLimit(rateLimitKey, SCRAPER_CONFIG.RATE_LIMIT_PER_HOUR, 3600000)) {
//         return createErrorResponse("Rate limit exceeded. Try again later.", 429);
//       }
//     }

//     // Parse request body
//     const body = await request.json().catch(() => ({}));
//     console.log('📦 Request body:', body);

//     // Parse keywords
//     const keywords = Array.isArray(body.keywords) ? body.keywords : [];
    
//     if (keywords.length === 0) {
//       return createErrorResponse('At least one keyword is required', 400);
//     }

//     const scraperRequest: ScraperRequest = {
//       id: crypto.randomUUID(),
//       job_title: body.job_title || 'Snagajob Scrape',
//       max_results: body.max_results || 100,
//       status: 'pending',
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//       completed_at: null,
//       results_count: 0,
//       error_message: null,
//       admin_user_id: adminUser.id,
//       admin_email: adminUser.email,
//       location: body.location || 'remote',
//       days: body.days || 15,
//       keywords: keywords,
//       sites: ['snagajob'],
//       debug: body.debug || false,
//       priority: body.priority || 'medium',
//       options: body.options || {},
//       headless: body.headless !== false,
//       skip_captcha: body.skip_captcha !== false,
//     };

//     console.log('✅ Validated scraper request:', scraperRequest);

//     // Create scraping log
//     const supabaseAdmin = await getSupabaseAdmin();
//     const { data: logData, error: logError } = await supabaseAdmin
//       .from("scraping_logs")
//       .insert({
//         status: "running",
//         jobs_found: 0,
//         // Don't include jobs_saved - it doesn't exist in the schema
//         sites_scraped: ["snagajob"],
//         keywords_used: scraperRequest.keywords,
//         location: scraperRequest.location,
//         started_at: new Date().toISOString(),
//         user_id: scraperRequest.user_id || adminUser.id,
//         admin_initiated: true,
//         admin_user_id: adminUser.id,
//         scraper_type: 'snag-playwright',
//       })
//       .select()
//       .single();

//     if (logError) {
//       console.error('Failed to create scraping log:', logError);
//       // Don't fail the request if logging fails in development
//       if (process.env.NODE_ENV !== 'development') {
//         throw new Error(`Failed to create scraping log: ${logError.message}`);
//       }
//     }

//     logId = logData?.id || null;
//     console.log('✅ Created log:', logId);

//     // Create audit log (skip if it fails)
//     try {
//       const { error: auditError } = await supabaseAdmin.from("admin_audit_logs").insert({
//         admin_user_id: adminUser.id,
//         admin_email: adminUser.email,
//         action: "snagajob_scraper_started",
//         entity_type: "system",
//         entity_id: logId,
//         new_values: scraperRequest,
//         ip_address: getClientIP(request),
//         user_agent: request.headers.get("user-agent") || "unknown",
//       });
//       if (auditError) {
//         console.warn('Audit log failed:', auditError);
//       }
//     } catch (err) {
//       console.warn('Audit log failed:', err);
//     }

//     // Run scraper via FastAPI
//     const scraperResult = await runSnagajobScraperViaFastAPI(
//       scraperRequest,
//       logId,
//       adminUser
//     );

//     return createSuccessResponse(scraperResult);
    
//   } catch (error) {
//     console.error("❌ Snagajob scraper error:", error);

//     if (logId) {
//       await updateScrapingLogOnError(logId, error);
//     }

//     return createErrorResponse(
//       error instanceof Error ? error.message : "Failed to start Snagajob scraper",
//       500
//     );
//   }
// }

// async function runSnagajobScraperViaFastAPI(
//   config: ScraperRequest,
//   logId: string | null,
//   adminUser: { id: string; email: string }
// ): Promise<any> {
//   const startTime = Date.now();

//   try {
//     console.log(`🚀 Starting Snagajob via FastAPI (log: ${logId})`);

//     const payload = {
//       location: config.location || 'remote',
//       keywords: config.keywords || [],
//       debug: config.debug || false,
//       priority: config.priority || 'medium',
//       max_results: config.max_results || 100,
//       headless: config.headless ?? true,
//       skip_captcha: config.skip_captcha ?? true,
//     };

//     console.log('📤 FastAPI payload:', payload);

//     const fastApiUrl = `${FASTAPI_BASE_URL}/scrapers/snag-playwright/run`;
//     console.log(`🔗 Calling: ${fastApiUrl}`);

//     const response = await fetch(fastApiUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(payload),
//       signal: AbortSignal.timeout(SCRAPER_CONFIG.TIMEOUT_MS),
//     });

//     console.log(`📡 FastAPI response: ${response.status}`);

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({
//         error: `HTTP ${response.status}: ${response.statusText}`
//       }));
//       throw new Error(errorData.message || errorData.error || 'FastAPI request failed');
//     }

//     const result = await response.json();
//     console.log('✅ FastAPI result:', result);

//     const durationSeconds = Math.round((Date.now() - startTime) / 1000);
//     const isSuccess = result.success === true;

//     // Update database if we have a logId
//     if (logId) {
//       await updateFinalScrapingStatus(
//         logId,
//         isSuccess,
//         result.jobs_found || 0,
//         result.jobs_saved || result.jobs_found || 0,
//         result.duration_seconds || durationSeconds,
//         result.error_details || '',
//         adminUser
//       );
//     }

//     if (result.jobs_saved > 0 && config.user_id) {
//       await incrementUserUsage(config.user_id, result.jobs_saved);
//     }

//     return {
//       success: isSuccess,
//       output: result.message,
//       error: isSuccess ? undefined : result.error_details || result.message,
//       jobs_found: result.jobs_found || 0,
//       jobs_saved: result.jobs_saved || result.jobs_found || 0,
//       duration_seconds: result.duration_seconds || durationSeconds,
//       log_id: logId,
//       scraper_name: "snagajob",
//     };

//   } catch (error) {
//     const durationSeconds = Math.round((Date.now() - startTime) / 1000);
//     console.error(`❌ FastAPI error:`, error);

//     if (logId) {
//       await updateScrapingLogOnError(logId, error);
//     }

//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//       jobs_found: 0,
//       jobs_saved: 0,
//       duration_seconds: durationSeconds,
//       log_id: logId,
//       scraper_name: "snagajob",
//     };
//   }
// }

// async function updateFinalScrapingStatus(
//   logId: string,
//   isSuccess: boolean,
//   jobsFound: number,
//   jobsSaved: number,
//   durationSeconds: number,
//   errorOutput: string,
//   adminUser: { id: string; email: string }
// ) {
//   try {
//     const supabaseAdmin = await getSupabaseAdmin();
//     await supabaseAdmin
//       .from("scraping_logs")
//       .update({
//         status: isSuccess ? "completed" : "failed",
//         jobs_found: jobsFound,
//         completed_at: new Date().toISOString(),
//         duration_seconds: durationSeconds,
//         error_message: errorOutput || (isSuccess ? null : "Process failed"),
//       })
//       .eq("id", logId);
//   } catch (error) {
//     console.error(`Failed to update status for ${logId}:`, error);
//   }
// }

// async function updateScrapingLogOnError(logId: string, error: any) {
//   try {
//     const supabaseAdmin = await getSupabaseAdmin();
//     await supabaseAdmin
//       .from("scraping_logs")
//       .update({
//         status: "failed",
//         completed_at: new Date().toISOString(),
//         error_message: error instanceof Error ? error.message : "Unknown error",
//       })
//       .eq("id", logId);
//   } catch (updateError) {
//     console.error(`Failed to update error for ${logId}:`, updateError);
//   }
// }

// async function incrementUserUsage(userId: string, jobCount: number) {
//   try {
//     const supabaseAdmin = await getSupabaseAdmin();
//     await supabaseAdmin.rpc("increment_user_usage", {
//       p_user_id: userId,
//       p_usage_type: "jobs_scraped",
//       p_increment: jobCount,
//     });
//   } catch (error) {
//     console.warn(`Failed to increment usage for ${userId}:`, error);
//   }
// }

// function getClientIP(request: NextRequest): string {
//   return (
//     request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
//     request.headers.get("x-real-ip") ||
//     "unknown"
//   );
// }