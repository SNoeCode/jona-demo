// import { NextRequest } from 'next/server';
// import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
// import { createErrorResponse, createSuccessResponse } from '@/app/services/api-utils';
// import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
// import { ScraperRequest } from '@/types/admin';
// // import { startDiceScraperProcess } from '@/app/services/scraperApiClient';
// import { getClientIP } from '@/app/services/api-utils';

// export async function POST(request: NextRequest) {
//   let logId: string | null = null;

//   try {
//     const adminUser = await validateAdminAuth(request);
//     if (!adminUser) {
//       return createAuthResponse('Admin access required', 403);
//     }

//     const body = await request.json().catch(() => ({}));

//     const scraperRequest: ScraperRequest = {
//       id: crypto.randomUUID(),
//       job_title: body.job_title || 'Dice Scrape',
//       max_results: body.max_results || 100,
//       status: 'pending',
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//       completed_at: null,
//       results_count: 0,
//       error_message: null,
//       location: typeof body.location === 'string' ? body.location.trim() : 'remote',
//       days: Math.min(30, Math.max(1, parseInt(body.days) || 15)),
//       keywords: Array.isArray(body.keywords)
//         ? body.keywords.filter((k: any) => typeof k === 'string' && k.trim()).slice(0, 10)
//         : [],
//       sites: ['dice'],
//       priority: ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium',
//       user_id: typeof body.user_id === 'string' ? body.user_id : adminUser.id,
//       debug: !!body.debug,
//       admin_user_id: adminUser.id,
//       admin_email: adminUser.email,
//     };

//     const supabaseAdmin = await getSupabaseAdmin();

//     const { data: logData, error: logError } = await supabaseAdmin
//       .from('scraping_logs')
//       .insert({
//         status: 'running',
//         jobs_found: 0,
//         jobs_saved: 0,
//         sites_scraped: ['dice'],
//         keywords_used: scraperRequest.keywords,
//         location: scraperRequest.location,
//         started_at: new Date().toISOString(),
//         user_id: scraperRequest.user_id,
//         admin_initiated: true,
//         admin_user_id: adminUser.id,
//       })
//       .select()
//       .single();

//     if (logError) {
//       throw new Error(`Failed to create scraping log: ${logError.message}`);
//     }

//     logId = logData.id;

//     await supabaseAdmin.from('admin_audit_logs').insert({
//       admin_user_id: adminUser.id,
//       admin_email: adminUser.email,
//       action: 'dice_scraper_started',
//       entity_type: 'system',
//       entity_id: logId,
//       new_values: scraperRequest,
//       ip_address: getClientIP(request),
//       user_agent: request.headers.get('user-agent') || 'unknown',
//     });

//     const scraperResult = await startDiceScraperProcess(scraperRequest, logId, adminUser);

//     return createSuccessResponse(scraperResult);
//   } catch (error) {
//     console.error('Dice scraper initialization error:', error);

//     if (logId) {
//       const supabaseAdmin = await getSupabaseAdmin();
//       await supabaseAdmin
//         .from('scraping_logs')
//         .update({
//           status: 'failed',
//           completed_at: new Date().toISOString(),
//           error_message: error instanceof Error ? error.message : 'Unknown error',
//         })
//         .eq('id', logId);
//     }

//     return createErrorResponse(
//       error instanceof Error ? error.message : 'Failed to start Dice scraper'
//     );
//   }
// }
// // // \\app\api\scrapers\[scraper]\dice\route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
// // import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
// // import { validateAdminAuth, createAuthResponse } from "@/lib/supabase/admin";
// // import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/app/services/api-utils';

// // import type { ScraperRequest } from "@/types/admin";
// // import {getClientIP} from "@/app/services/api-utils"; // adjust path as needed

// // const SCRAPER_CONFIG = {
// //   TIMEOUT_MS: parseInt(process.env.SCRAPER_TIMEOUT_MS || "600000"),
// //   RATE_LIMIT_PER_HOUR: parseInt(process.env.SCRAPER_RATE_LIMIT || "10"),
// // };

// // export async function POST(request: NextRequest) {
// //   let logId: string | null = null;

// //   try {
// //     // Authenticate admin user
// //     const adminUser = await validateAdminAuth(request);
// //     if (!adminUser) {
// //       return createAuthResponse("Admin access required", 403);
// //     }

// //     // Rate limiting per admin user
// //     const rateLimitKey = `dice-scraper:${adminUser.id}`;
// //     if (
// //       !checkRateLimit(rateLimitKey, SCRAPER_CONFIG.RATE_LIMIT_PER_HOUR, 3600000)
// //     ) {
// //       return createErrorResponse("Rate limit exceeded. Try again later.", 429);
// //     }

// //     // Parse and validate request body
// //    const body = await request.json().catch(() => ({}));

// // const scraperRequest: ScraperRequest = {
// //   ...validateScraperRequest(body), // returns partial
// //   id: crypto.randomUUID(),
// //   job_title: body.job_title || 'Dice Scrape',
// //   max_results: body.max_results || 100,
// //   status: 'pending',
// //   created_at: new Date().toISOString(),
// //   updated_at: new Date().toISOString(),
// //   completed_at: null,
// //   results_count: 0,
// //   error_message: null,
// //   admin_user_id: adminUser.id,
// //   admin_email: adminUser.email,
// //   sites: ['dice'],
// // };
// //     const supabaseAdmin = await getSupabaseAdmin();

// //     // Create initial scraping log
// //     const { data: logData, error: logError } = await supabaseAdmin
// //       .from("scraping_logs")
// //       .insert({
// //         status: "running",
// //         jobs_found: 0,
// //         jobs_saved: 0,
// //         sites_scraped: ["dice"],
// //         keywords_used: scraperRequest.keywords,
// //         location: scraperRequest.location,
// //         started_at: new Date().toISOString(),
// //         user_id: scraperRequest.user_id || adminUser.id,
// //         admin_initiated: true,
// //         admin_user_id: adminUser.id,
// //       })
// //       .select()
// //       .single();

// //     if (logError) {
// //       throw new Error(`Failed to create scraping log: ${logError.message}`);
// //     }

// //     logId = logData.id;

// //     // Create admin audit log
// //     await supabaseAdmin.from("admin_audit_logs").insert({
// //       admin_user_id: adminUser.id,
// //       admin_email: adminUser.email,
// //       action: "dice_scraper_started",
// //       entity_type: "system",
// //       entity_id: logId,
// //       new_values: scraperRequest,
// //       ip_address: getClientIP(request),
// //       user_agent: request.headers.get("user-agent") || "unknown",
// //     });

// //     // Start scraper process
// //     const scraperResult = await startDiceScraperProcess(
// //       scraperRequest,
// //       logId!,
// //       adminUser
// //     );
// //     return createSuccessResponse(scraperResult);
// //   } catch (error) {
// //     console.error("Dice scraper initialization error:", error);

// //     if (logId) {
// //       await updateScrapingLogOnError(logId, error);
// //     }

// //     return createErrorResponse(
// //       error instanceof Error ? error.message : "Failed to start Dice scraper"
// //     );
// //   }
// // }


// // function validateScraperRequest(body: any): Partial<ScraperRequest>
// //  const scraperRequest: ScraperRequest = {
// //   ...validateScraperRequest(body),
// //   id: crypto.randomUUID(),
// //   job_title: body.job_title || 'Generic Scrape',
// //   max_results: body.max_results || 100,
// //   status: 'pending',
// //   created_at: new Date().toISOString(),
// //   updated_at: new Date().toISOString(),
// //   completed_at: null,
// //   results_count: 0,
// //   error_message: null,
// //   admin_user_id: adminUser.id,
// //   admin_email: adminUser.email,
// //   sites: [scraperType], // or hardcoded like ['dice']
// // };
// // async function startDiceScraperProcess(
// //   config: ScraperRequest & { user_id?: string },
// //   logId: string,
// //   adminUser: { id: string; email: string }
// // ): Promise<any> {
// //   return new Promise<any>((resolve) => {
// //     try {
// //       const keywordArg = Array.isArray(config.keywords)
// //         ? config.keywords.filter((k): k is string => typeof k === "string").join(",")
// //         : "";

// //       const scraperArgs = [
// //         "server/app/scraper/run_dice.py",
// //         config.location,
// //         config.days!.toString(),
// //         keywordArg,
// //         config.priority,
// //         logId,
// //       ].filter((arg): arg is string => typeof arg === "string");

// //       console.log("Starting Dice scraper with args:", scraperArgs);

// //       const scraper = spawn("python", scraperArgs, {
// //         cwd: process.cwd(),
// //         stdio: ["pipe", "pipe", "pipe"],
// //         env: {
// //           ...process.env,
// //           PYTHONPATH: process.cwd(),
// //           SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
// //           SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
// //         },
// //       }) as ChildProcessWithoutNullStreams;

// //       const timeout = setTimeout(() => {
// //         console.log(`Dice scraper ${logId} timeout reached, terminating`);
// //         scraper.kill("SIGTERM");
// //       }, SCRAPER_CONFIG.TIMEOUT_MS);

// //       let output = "";
// //       let errorOutput = "";
// //       let jobsFound = 0;
// //       let jobsSaved = 0;

// //       scraper.stdout.on("data", async (data: Buffer) => {
// //         const dataStr = data.toString();
// //         output += dataStr;

// //         const foundMatch = dataStr.match(/Found (\d+) jobs/i);
// //         if (foundMatch) {
// //           jobsFound = parseInt(foundMatch[1]);
// //         }

// //         const savedMatch = dataStr.match(/Saved (\d+) jobs/i);
// //         if (savedMatch) {
// //           jobsSaved = parseInt(savedMatch[1]);
// //         }

// //         if (jobsFound > 0 || jobsSaved > 0) {
// //           await updateScrapingProgress(logId, jobsFound, jobsSaved);
// //         }
// //       });

// //       scraper.stderr.on("data", (data: Buffer) => {
// //         const errorStr = data.toString();
// //         console.error(`Dice scraper ${logId} error:`, errorStr);
// //         errorOutput += errorStr;
// //       });

// //       scraper.on("close", async (code: number) => {
// //         clearTimeout(timeout);

// //         const endTime = new Date();
// //         const durationSeconds = Math.round(
// //           (endTime.getTime() - Date.now()) / 1000
// //         );
// //         const isSuccess = code === 0;

// //         console.log(
// //           `Dice scraper ${logId} finished: code=${code}, found=${jobsFound}, saved=${jobsSaved}`
// //         );

// //         await updateFinalScrapingStatus(
// //           logId,
// //           isSuccess,
// //           jobsFound,
// //           jobsSaved,
// //           durationSeconds,
// //           errorOutput,
// //           adminUser
// //         );

// //         if (jobsSaved > 0 && config.user_id) {
// //           await incrementUserUsage(config.user_id, jobsSaved);
// //         }

// //         resolve({
// //           success: isSuccess,
// //           output: isSuccess ? output : undefined,
// //           error: isSuccess
// //             ? undefined
// //             : errorOutput || `Process exited with code ${code}`,
// //           jobs_found: jobsFound,
// //           jobs_saved: jobsSaved,
// //           duration_seconds: durationSeconds,
// //           log_id: logId,
// //           scraper_name: "dice",
// //         });
// //       });

// //       scraper.on("error", async (error: Error) => {
// //         clearTimeout(timeout);
// //         console.error(`Failed to start Dice scraper ${logId}:`, error);

// //         await updateScrapingLogOnError(logId, error);

// //         resolve({
// //           success: false,
// //           error: `Failed to start Dice scraper: ${error.message}`,
// //           log_id: logId,
// //           scraper_name: "dice",
// //         });
// //       });
// //     } catch (error) {
// //       console.error(`Error initializing Dice scraper ${logId}:`, error);
// //       resolve({
// //         success: false,
// //         error: error instanceof Error ? error.message : "Unknown error",
// //         log_id: logId,
// //         scraper_name: "dice",
// //       });
// //     }
// //   });
// // }

// // async function updateScrapingProgress(
// //   logId: string,
// //   jobsFound: number,
// //   jobsSaved: number
// // ) {
// //   try {
// //     const supabaseAdmin = await getSupabaseAdmin();

// //     await supabaseAdmin
// //       .from("scraping_logs")
// //       .update({ jobs_found: jobsFound, jobs_saved: jobsSaved })
// //       .eq("id", logId);
// //   } catch (error) {
// //     console.warn(`Failed to update progress for ${logId}:`, error);
// //   }
// // }

// // async function updateFinalScrapingStatus(
// //   logId: string,
// //   isSuccess: boolean,
// //   jobsFound: number,
// //   jobsSaved: number,
// //   durationSeconds: number,
// //   errorOutput: string,
// //   adminUser: { id: string; email: string }
// // ) {
// //   try {
// //     const finalStatus = isSuccess ? "completed" : "failed";
// //     const supabaseAdmin = await getSupabaseAdmin();

// //     await supabaseAdmin
// //       .from("scraping_logs")
// //       .update({
// //         status: finalStatus,
// //         jobs_found: jobsFound,
// //         jobs_saved: jobsSaved,
// //         completed_at: new Date().toISOString(),
// //         duration_seconds: durationSeconds,
// //         error_message: errorOutput || (isSuccess ? null : "Process failed"),
// //       })
// //       .eq("id", logId);
 

// //     await supabaseAdmin.from("admin_audit_logs").insert({
// //       admin_user_id: adminUser.id,
// //       admin_email: adminUser.email,
// //       action: isSuccess ? "dice_scraper_completed" : "dice_scraper_failed",
// //       entity_type: "system",
// //       entity_id: logId,
// //       new_values: {
// //         jobs_found: jobsFound,
// //         jobs_saved: jobsSaved,
// //         duration_seconds: durationSeconds,
// //         status: finalStatus,
// //       },
// //     });
// //   } catch (error) {
// //     console.error(`Failed to update final status for ${logId}:`, error);
// //   }
// // }

// // async function updateScrapingLogOnError(logId: string, error: any) {
// //   try {
// //         const supabaseAdmin = await getSupabaseAdmin();
    
// //     await supabaseAdmin
// //       .from("scraping_logs")
// //       .update({
// //         status: "failed",
// //         completed_at: new Date().toISOString(),
// //         error_message: error instanceof Error ? error.message : "Unknown error",
// //       })
// //       .eq("id", logId);
// //   } catch (updateError) {
// //     console.error(`Failed to update error status for ${logId}:`, updateError);
// //   }
// // }

// // async function incrementUserUsage(userId: string, jobCount: number) {
// //   try {
// //     const supabaseAdmin = await getSupabaseAdmin();

// //     await supabaseAdmin.rpc("increment_user_usage", {
// //       p_user_id: userId,
// //       p_usage_type: "jobs_scraped",
// //       p_increment: jobCount,
// //     });
// //   } catch (error) {
// //     console.warn(`Failed to increment usage for user ${userId}:`, error);
// //   }
// // }