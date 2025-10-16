// // client\src\app\api\admin\scraper\[scraper]\route.ts
// 'use server'
// import { NextRequest, NextResponse } from "next/server";
// import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
// import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
// import { validateAdminAuth } from "@/lib/supabase/admin";
// import type { ScraperRequest } from "@/types/admin";

// interface ScraperConfig {
//   name: string;
//   scriptPath: string;
//   timeout: number;
//   sites: string[];
// }

// const SCRAPERS: Record<string, ScraperConfig> = {
//   indeed: {
//     name: "Indeed",
//     scriptPath: "server/app/scrapers/indeed_crawler.py",
//     timeout: 600000, // 10 minutes
//     sites: ["indeed"]
//   },
//   careerbuilder: {
//     name: "CareerBuilder", 
//     scriptPath: "server/app/scrapers/career_crawler.py",
//     timeout: 600000,
//     sites: ["careerbuilder"]
//   },
//   dice: {
//     name: "Dice",
//     scriptPath: "server/app/scrapers/dice_scraper.py", 
//     timeout: 600000,
//     sites: ["dice"]
//   },
//   ziprecruiter: {
//     name: "ZipRecruiter",
//     scriptPath: "server/app/scrapers/zip_crawler.py",
//     timeout: 600000,
//     sites: ["ziprecruiter"] 
//   },
//   teksystems: {
//     name: "TekSystems",
//     scriptPath: "server/app/scrapers/tek_systems.py",
//     timeout: 600000,
//     sites: ["teksystems"]
//   }
// };

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { scraper: string } }
// ) {
//   const scraperType = params.scraper;
//   const scraperConfig = SCRAPERS[scraperType];
  
//   if (!scraperConfig) {
//     return NextResponse.json(
//       { error: `Unknown scraper type: ${scraperType}` }, 
//       { status: 400 }
//     );
//   }
  
//   let logId: string | null = null;
//       try {
//     // Validate admin authentication
//     const adminUser = await validateAdminAuth(request);
//     if (!adminUser) {
//       return NextResponse.json(
//         { error: "Admin access required" }, 
//         { status: 403 }
//       );
//     }

//     // Parse request body
//     const body = await request.json().catch(() => ({}));
//     const config = validateScraperRequest(body);
//            const supabaseAdmin = await getSupabaseAdmin();

//     // Create scraping log entry
//     const { data: logData, error: logError } = await supabaseAdmin
//       .from("scraping_logs")
//       .insert({
//         status: "running",
//         jobs_found: 0,
//         jobs_saved: 0,
//         sites_scraped: scraperConfig.sites,
//         keywords_used: config.keywords || [],
//         location: config.location,
//         started_at: new Date().toISOString(),
//         user_id: config.user_id || adminUser.id,
//         admin_initiated: true,
//         admin_user_id: adminUser.id,
//         scraper_type: scraperType
//       })
//       .select()
//       .single();

//     if (logError) {
//       throw new Error(`Failed to create scraping log: ${logError.message}`);
//     }

//     logId = logData.id;

//     // Create audit log
//     await supabaseAdmin.from("admin_audit_logs").insert({
//       admin_user_id: adminUser.id,
//       admin_email: adminUser.email || "",
//       action: `${scraperType}_scraper_started`,
//       entity_type: "scraper",
//       entity_id: logId,
//       new_values: config,
//       ip_address: getClientIP(request),
//       user_agent: request.headers.get("user-agent") || "unknown",
//     });

//     // Ensure logId is not null before proceeding
//     if (!logId) {
//       throw new Error("Failed to create scraping log: logId is null");
//     }

//     // Start scraper process
//     const result = await runScraperProcess(
//       scraperConfig,
//       config,
//       logId,
//       adminUser
//     );

//     return NextResponse.json({
//       success: result.success,
//       scraper_name: scraperType,
//       jobs_count: result.jobs_found || 0,
//       status: result.success ? "completed" : "failed",
//       duration_seconds: result.duration_seconds || 0,
//       message: result.success ? 
//         `Successfully scraped ${result.jobs_found || 0} jobs from ${scraperConfig.name}` :
//         result.error || "Scraper failed",
//       log_id: logId,
//       output: result.output,
//       error: result.error
//     });

//   } catch (error) {
//     console.error(`${scraperType} scraper error:`, error);

//     if (logId) {
//       await updateScrapingLogOnError(logId, error);
//     }

//     return NextResponse.json({
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//       scraper_name: scraperType,
//       log_id: logId
//     }, { status: 500 });
//   }
// }

// function validateScraperRequest(body: any): ScraperRequest & { user_id?: string } {
//   return {
//     location: typeof body.location === "string" ? body.location.trim() : "remote",
//     days: Math.min(30, Math.max(1, parseInt(body.days) || 15)),
//     keywords: Array.isArray(body.keywords) ? 
//       body.keywords.filter((k: any) => typeof k === "string" && k.trim()).slice(0, 10) : [],
//     sites: Array.isArray(body.sites) ? body.sites : [],
//     priority: ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium",
//     user_id: body.user_id
//   };
// }

// async function runScraperProcess(
//   scraperConfig: ScraperConfig,
//   config: ScraperRequest & { user_id?: string },
//   logId: string,
//   adminUser: { id: string; email: string }
// ): Promise<{
//   success: boolean;
//   jobs_found?: number;
//   jobs_saved?: number;
//   duration_seconds?: number;
//   output?: string;
//   error?: string;
// }> {
//   return new Promise((resolve) => {
//     const startTime = Date.now();
    
//     // Build arguments for Python script
//     const args = buildScraperArgs(scraperConfig, config, logId);
    
//     console.log(`Starting ${scraperConfig.name} scraper:`, args);

//     const scraper = spawn("python", args, {
//       cwd: process.cwd(),
//       stdio: ["pipe", "pipe", "pipe"],
//       env: {
//         ...process.env,
//         PYTHONPATH: process.cwd(),
//         SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
//         SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
//       },
//     }) as ChildProcessWithoutNullStreams;

//     let output = "";
//     let errorOutput = "";
//     let jobsFound = 0;
//     let jobsSaved = 0;

//     // Set timeout
//     const timeout = setTimeout(() => {
//       console.log(`Scraper ${logId} timeout reached`);
//       scraper.kill("SIGTERM");
//     }, scraperConfig.timeout);

//     // Handle stdout
//     scraper.stdout.on("data", async (data: Buffer) => {
//       const dataStr = data.toString();
//       output += dataStr;

//       // Parse job counts from output
//       const foundMatch = dataStr.match(/Found (\d+) jobs/i);
//       if (foundMatch) jobsFound = parseInt(foundMatch[1]);

//       const savedMatch = dataStr.match(/Saved (\d+) jobs/i);  
//       if (savedMatch) jobsSaved = parseInt(savedMatch[1]);

//       // Update progress in database
//       if (jobsFound > 0 || jobsSaved > 0) {
//         await updateScrapingProgress(logId, jobsFound, jobsSaved);
//       }
//     });

//     // Handle stderr
//     scraper.stderr.on("data", (data: Buffer) => {
//       const errorStr = data.toString();
//       console.error(`Scraper ${logId} error:`, errorStr);
//       errorOutput += errorStr;
//     });

//     // Handle process completion
//     scraper.on("close", async (code: number) => {
//       clearTimeout(timeout);
      
//       const endTime = Date.now();
//       const durationSeconds = Math.round((endTime - startTime) / 1000);
//       const isSuccess = code === 0;

//       console.log(
//         `Scraper ${logId} finished: code=${code}, found=${jobsFound}, saved=${jobsSaved}`
//       );

//       // Update final status
//       await updateFinalScrapingStatus(
//         logId,
//         isSuccess,
//         jobsFound,
//         jobsSaved,
//         durationSeconds,
//         errorOutput,
//         adminUser
//       );

//       // Update user usage
//       if (jobsSaved > 0 && config.user_id) {
//         await incrementUserUsage(config.user_id, jobsSaved);
//       }

//       resolve({
//         success: isSuccess,
//         jobs_found: jobsFound,
//         jobs_saved: jobsSaved,
//         duration_seconds: durationSeconds,
//         output: isSuccess ? output : undefined,
//         error: isSuccess ? undefined : errorOutput || `Process exited with code ${code}`
//       });
//     });

//     // Handle process error
//     scraper.on("error", async (error: Error) => {
//       clearTimeout(timeout);
//       console.error(`Failed to start scraper ${logId}:`, error);
      
//       await updateScrapingLogOnError(logId, error);
      
//       resolve({
//         success: false,
//         error: `Failed to start scraper: ${error.message}`
//       });
//     });
//   });
// }

// function buildScraperArgs(
//   scraperConfig: ScraperConfig,
//   config: ScraperRequest & { user_id?: string },
//   logId: string
// ): string[] {
//   const baseArgs = [
//     scraperConfig.scriptPath,
//     config.location,
//     (config.days ?? 15).toString(),
//     logId
//   ];

//   // Add keywords if provided
//   if (config.keywords && config.keywords.length > 0) {
//     baseArgs.push(config.keywords.join(","));
//   }

//   // Add priority
//   baseArgs.push(config.priority);

//   return baseArgs.filter((arg): arg is string => typeof arg === "string");
// }

// async function updateScrapingProgress(
//   logId: string,
//   jobsFound: number,
//   jobsSaved: number
// ) {
//   try {
//            const supabaseAdmin = await getSupabaseAdmin();

//     await supabaseAdmin
//       .from("scraping_logs")
//       .update({ jobs_found: jobsFound, jobs_saved: jobsSaved })
//       .eq("id", logId);
//   } catch (error) {
//     console.warn(`Failed to update progress for ${logId}:`, error);
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
//     const finalStatus = isSuccess ? "completed" : "failed";
//            const supabaseAdmin = await getSupabaseAdmin();

//     await supabaseAdmin
//       .from("scraping_logs")
//       .update({
//         status: finalStatus,
//         jobs_found: jobsFound,
//         jobs_saved: jobsSaved,
//         completed_at: new Date().toISOString(),
//         duration_seconds: durationSeconds,
//         error_message: errorOutput || (isSuccess ? null : "Process failed"),
//       })
//       .eq("id", logId);
           
//     // Create audit log for completion
//     await supabaseAdmin.from("admin_audit_logs").insert({
//       admin_user_id: adminUser.id,
//       admin_email: adminUser.email,
//       action: isSuccess ? "scraper_completed" : "scraper_failed",
//       entity_type: "scraper",
//       entity_id: logId,
//       new_values: {
//         jobs_found: jobsFound,
//         jobs_saved: jobsSaved,
//         duration_seconds: durationSeconds,
//         status: finalStatus,
//       },
//     });
//   } catch (error) {
//     console.error(`Failed to update final status for ${logId}:`, error);
//   }
// }

// async function updateScrapingLogOnError(logId: string, error: any) {
//   try {
//            const supabaseAdmin = await getSupabaseAdmin();
//            await supabaseAdmin
//       .from("scraping_logs")
//       .update({
//         status: "failed",
//         completed_at: new Date().toISOString(),
//         error_message: error instanceof Error ? error.message : "Unknown error",
//       })
//       .eq("id", logId);
//   } catch (updateError) {
//     console.error(`Failed to update error status for ${logId}:`, updateError);
//   }
// }

// async function incrementUserUsage(userId: string, jobCount: number) {
//   try {
//            const supabaseAdmin = await getSupabaseAdmin();

//     await supabaseAdmin.rpc("increment_user_usage", {
//       p_user_id: userId,
//       p_usage_type: "jobs_scraped",
//       p_increment: jobCount,
//     });
//   } catch (error) {
//     console.warn(`Failed to increment usage for user ${userId}:`, error);
//   }
// }

// function getClientIP(request: NextRequest): string {
//   return (
//     request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
//     request.headers.get("x-real-ip") ||
//     "unknown"
//   );
// }