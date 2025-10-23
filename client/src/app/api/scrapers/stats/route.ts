// client/src/app/api/scrapers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ScrapingLog = {
  id: string;
  scraper_type?: string | null;
  status?: string | null;
  jobs_found?: number | null;
  duration_seconds?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  [key: string]: any;
};

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching scraper stats...");

    const maybeAdmin = getSupabaseAdmin();
    const supabase = maybeAdmin instanceof Promise ? await maybeAdmin : maybeAdmin;

    const { data: logsRaw, error } = await supabase
      .from<"scraping_logs", ScrapingLog>("scraping_logs")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch stats:", error);
      return NextResponse.json({ error: "Failed to fetch stats", details: error }, { status: 500 });
    }

    const logs: ScrapingLog[] = Array.isArray(logsRaw) ? logsRaw : [];

    const totalSessions = logs.length;
    const totalJobsFound = logs.reduce((sum: number, log: ScrapingLog) => sum + (log.jobs_found || 0), 0);

    const completedLogs = logs.filter((log) => log.status === "completed");
    const successfulLogs = logs.filter((log) => log.status === "completed" && (log.jobs_found || 0) > 0);

    const avgDuration =
      completedLogs.length > 0
        ? completedLogs.reduce((sum: number, log: ScrapingLog) => sum + (log.duration_seconds || 0), 0) /
          completedLogs.length
        : 0;

    const successRate = totalSessions > 0 ? Math.round((successfulLogs.length / totalSessions) * 100) : 0;

    const statsByScraper: Record<string, { total: number; completed: number; failed: number; jobs_found: number }> =
      {};

    logs.forEach((log) => {
      const type = (log.scraper_type || "unknown") as string;
      if (!statsByScraper[type]) statsByScraper[type] = { total: 0, completed: 0, failed: 0, jobs_found: 0 };
      statsByScraper[type].total++;
      if (log.status === "completed") statsByScraper[type].completed++;
      if (log.status === "failed") statsByScraper[type].failed++;
      statsByScraper[type].jobs_found += log.jobs_found || 0;
    });

    const stats = {
      totalSessions,
      totalJobsFound,
      averageDuration: Math.round(avgDuration * 10) / 10,
      successRate,
      completedSessions: completedLogs.length,
      failedSessions: logs.filter((l) => l.status === "failed").length,
      runningSessions: logs.filter((l) => l.status === "running").length,
      statsByScraper,
    };

    console.log("✅ Stats calculated:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error in stats endpoint:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

