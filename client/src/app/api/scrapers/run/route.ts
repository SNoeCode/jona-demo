// client\src\app\api/scraper\run\route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
import {
  createErrorResponse,
  createSuccessResponse,
  checkRateLimit,
} from '@/utils/api-utils';
const SCRAPER_CONFIG = {
  MAX_JOBS_PER_SCRAPE: parseInt(process.env.MAX_JOBS_PER_SCRAPE || '100'),
  TIMEOUT_MS: parseInt(process.env.SCRAPER_TIMEOUT_MS || '600000'),
  MAX_CONCURRENT_SCRAPERS: parseInt(process.env.MAX_CONCURRENT_SCRAPERS || '3'),
  RATE_LIMIT_PER_HOUR: parseInt(process.env.SCRAPER_RATE_LIMIT || '10'),
};

interface ScraperProcess {
  id: string;
  process: ChildProcessWithoutNullStreams;
  startTime: Date;
  timeout: NodeJS.Timeout;
}

interface ScraperRequest {
  location: string;
  days: number;
  keywords: string[];
  sites: string[];
  priority: string;
  user_id?: string;
}

const runningScrapers = new Map<string, ScraperProcess>();

export async function POST(request: NextRequest) {
  let logId: string | null = null;

  try {
    const adminUser = await validateAdminAuth(request);
    if (!adminUser) return createAuthResponse('Admin access required', 403);

    const rateLimitKey = `scraper:${adminUser.id}`;
    if (!checkRateLimit(rateLimitKey, SCRAPER_CONFIG.RATE_LIMIT_PER_HOUR, 3600000)) {
      return createErrorResponse('Rate limit exceeded. Try again later.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const scraperRequest = validateScraperRequest(body);

    const supabaseAdmin = await getSupabaseAdmin();

    const { data: systemConfig, error: configError } = await supabaseAdmin
      .from('system_configuration')
      .select('value')
      .eq('key', 'scraper_settings')
      .maybeSingle();

    if (configError) console.warn('Failed to fetch system config:', configError);

    const scraperSettings = systemConfig?.value || {};
    const maxJobsPerScrape =
      scraperSettings.max_jobs_per_scrape || SCRAPER_CONFIG.MAX_JOBS_PER_SCRAPE;

    const runningCount = await getRunningScrapersCount();
    if (runningCount >= SCRAPER_CONFIG.MAX_CONCURRENT_SCRAPERS) {
      return createErrorResponse(
        `Maximum concurrent scrapers (${SCRAPER_CONFIG.MAX_CONCURRENT_SCRAPERS}) reached. Please wait.`,
        409
      );
    }

    const { data: logData, error: logError } = await supabaseAdmin
      .from('scraping_logs')
      .insert({
        status: 'running',
        jobs_found: 0,
        jobs_saved: 0,
        sites_scraped: scraperRequest.sites,
        keywords_used: scraperRequest.keywords,
        location: scraperRequest.location,
        started_at: new Date().toISOString(),
        user_id: scraperRequest.user_id || adminUser.id,
        admin_initiated: true,
        admin_user_id: adminUser.id,
      })
      .select()
      .single();
      
      
      const logId = logData?.id;
      if (!logId) throw new Error("Missing log ID after log creation");

    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      action: 'scraper_started',
      entity_type: 'system',
      entity_id: logId,
      new_values: scraperRequest,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
    });      


    const scraperResult = await startScraperProcess(
      scraperRequest,
      logId,
      maxJobsPerScrape,
      adminUser
    );

    return createSuccessResponse(scraperResult);
  } catch (error) {
    console.error('Scraper initialization error:', error);
    if (logId) await updateScrapingLogOnError(logId, error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to start scraper'
    );
  }
}
function validateScraperRequest(
  body: any
): ScraperRequest & { user_id?: string } {
  const location =
    typeof body.location === "string" ? body.location.trim() : "remote";
  const days = Math.min(30, Math.max(1, parseInt(body.days) || 15)); // Limit days range
  const keywords = Array.isArray(body.keywords)
    ? body.keywords
        .filter((k: any) => typeof k === "string" && k.trim())
        .slice(0, 10) // Limit keywords
    : [];
  const sites = Array.isArray(body.sites)
    ? body.sites
        .filter((s: any) => ["indeed", "linkedin", "glassdoor"].includes(s))
        .slice(0, 3)
    : ["indeed"];
  const priority = ["low", "medium", "high"].includes(body.priority)
    ? body.priority
    : "medium";

  if (keywords.length === 0) {
    throw new Error("At least one keyword is required");
  }

  return {
    location,
    days,
    keywords,
    sites,
    priority,
    user_id: body.user_id,
  };
}

async function getRunningScrapersCount(): Promise<number> {
  try {
       const supabaseAdmin = await getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("scraping_logs")
      .select("id", { count: "exact" })
      .eq("status", "running");

    if (error) {
      console.warn("Failed to check running scrapers:", error);
      return runningScrapers.size; // Fallback to in-memory count
    }

    return data?.length || 0;
  } catch (error) {
    console.warn("Error counting running scrapers:", error);
    return runningScrapers.size;
  }
}

async function startScraperProcess(
  config: ScraperRequest & { user_id?: string },
  logId: string,
  maxJobs: number,
  adminUser: { id: string; email: string }
): Promise<any> {
  return new Promise<any>((resolve) => {
    try {
    const scraperArgs = [
  "server/app/scraper/run_indeed.py",
  config.location,
  config.days.toString(),
  config.keywords.join(","),
  config.sites.join(","),
  maxJobs.toString(),
  config.priority,
  logId,
].filter((arg): arg is string => typeof arg === 'string');
      console.log(
        "Starting scraper with args:",
            scraperArgs.filter((arg): arg is string => arg !== undefined)
      );
const scraper = spawn("python", scraperArgs, {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    ...process.env,
    PYTHONPATH: process.cwd(),
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
}) as ChildProcessWithoutNullStreams;

      // Track the process
      const timeout = setTimeout(() => {
        console.log(`Scraper ${logId} timeout reached, terminating`);
        terminateScraperProcess(logId, scraper);
      }, SCRAPER_CONFIG.TIMEOUT_MS);

      const processInfo: ScraperProcess = {
        id: logId,
        process: scraper,
        startTime: new Date(),
        timeout,
      };

      runningScrapers.set(logId, processInfo);

      let output = "";
      let errorOutput = "";
      let jobsFound = 0;
      let jobsSaved = 0;

      scraper.stdout.on("data", async (data: Buffer) => {
        const dataStr = data.toString();
        output += dataStr;

        // Parse progress information
        const foundMatch = dataStr.match(/Found (\d+) jobs/i);
        if (foundMatch) {
          jobsFound = parseInt(foundMatch[1]);
        }

        const savedMatch = dataStr.match(/Saved (\d+) jobs/i);
        if (savedMatch) {
          jobsSaved = parseInt(savedMatch[1]);
        }

        // Update progress periodically
        if (jobsFound > 0 || jobsSaved > 0) {
          await updateScrapingProgress(logId, jobsFound, jobsSaved);
        }
      });

      scraper.stderr.on("data", (data: Buffer) => {
        const errorStr = data.toString();
        console.error(`Scraper ${logId} error:`, errorStr);
        errorOutput += errorStr;
      });

      scraper.on("close", async (code: number) => {
        clearTimeout(timeout);
        runningScrapers.delete(logId);

        const endTime = new Date();
        const startTime = processInfo.startTime;
        const durationSeconds = Math.round(
          (endTime.getTime() - startTime.getTime()) / 1000
        );
        const isSuccess = code === 0;

        console.log(
          `Scraper ${logId} finished: code=${code}, found=${jobsFound}, saved=${jobsSaved}`
        );

        // Update final status
        await updateFinalScrapingStatus(
          logId,
          isSuccess,
          jobsFound,
          jobsSaved,
          durationSeconds,
          errorOutput,
          adminUser
        );

        // Update user usage if jobs were saved
        if (jobsSaved > 0 && config.user_id) {
          await incrementUserUsage(config.user_id, jobsSaved);
        }

        resolve({
          success: isSuccess,
          output: isSuccess ? output : undefined,
          error: isSuccess
            ? undefined
            : errorOutput || `Process exited with code ${code}`,
          jobs_found: jobsFound,
          jobs_saved: jobsSaved,
          duration_seconds: durationSeconds,
          log_id: logId,
        });
      });

     scraper.on("error", async (error: Error) => {
        clearTimeout(timeout);
        runningScrapers.delete(logId);

        console.error(`Failed to start scraper ${logId}:`, error);

        await updateScrapingLogOnError(logId, error);

        resolve({
          success: false,
          error: `Failed to start scraper: ${error.message}`,
          log_id: logId,
        });
      });
    } catch (error) {
      console.error(`Error initializing scraper ${logId}:`, error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        log_id: logId,
      });
    }
  });
}

async function updateScrapingProgress(
  logId: string,
  jobsFound: number,
  jobsSaved: number
) {
  try {
       const supabaseAdmin = await getSupabaseAdmin();

    await supabaseAdmin
      .from("scraping_logs")
      .update({ jobs_found: jobsFound, jobs_saved: jobsSaved })
      .eq("id", logId);
  } catch (error) {
    console.warn(`Failed to update progress for ${logId}:`, error);
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
    const finalStatus = isSuccess ? "completed" : "failed";
   const supabaseAdmin = await getSupabaseAdmin();

    await supabaseAdmin
      .from("scraping_logs")
      .update({
        status: finalStatus,
        jobs_found: jobsFound,
        jobs_saved: jobsSaved,
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        error_message: errorOutput || (isSuccess ? null : "Process failed"),
      })
      .eq("id", logId);

    // Create completion audit log
    
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      action: isSuccess ? "scraper_completed" : "scraper_failed",
      entity_type: "system",
      entity_id: logId,
      new_values: {
        jobs_found: jobsFound,
        jobs_saved: jobsSaved,
        duration_seconds: durationSeconds,
        status: finalStatus,
      },
    });
  } catch (error) {
    console.error(`Failed to update final status for ${logId}:`, error);
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
  } catch (updateError) {
    console.error(`Failed to update error status for ${logId}:`, updateError);
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
    console.warn(`Failed to increment usage for user ${userId}:`, error);
  }
}

function terminateScraperProcess(
  logId: string,
  process: ChildProcessWithoutNullStreams
) {
  try {
    process.kill("SIGTERM");

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (!process.killed) {
        console.log(`Force killing scraper ${logId}`);
        process.kill("SIGKILL");
      }
    }, 5000);
  } catch (error) {
    console.error(`Failed to terminate scraper ${logId}:`, error);
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Cleanup handler for graceful shutdown
export async function cleanup() {
  console.log("Cleaning up running scrapers...");

  for (const [logId, processInfo] of runningScrapers.entries()) {
    clearTimeout(processInfo.timeout);
    terminateScraperProcess(logId, processInfo.process);

    await updateScrapingLogOnError(logId, new Error("Server shutdown"));
  }

  runningScrapers.clear();
}
