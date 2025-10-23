import { NextRequest, NextResponse } from "next/server";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import{ getSupabaseAdmin }from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
        const supabaseAdmin = await getSupabaseAdmin();
    
    // Get current running scrapers
    const { data: runningScrapers, error } = await supabaseAdmin
      .from("scraping_logs")
      .select("id")
      .eq("status", "running");

    if (error) throw error;

    if (!runningScrapers || runningScrapers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No running scrapers found"
      }, { status: 404 });
    }

    // Update all running scrapers to stopped status
    const { error: updateError } = await supabaseAdmin
      .from("scraping_logs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: "Manually stopped by admin"
      })
      .eq("status", "running");

    if (updateError) throw updateError;

    // Optional: Send SIGTERM to Python processes (requires PID tracking)
    // You could extend scraping_logs to include `pid` and use process.kill(pid)

    return NextResponse.json({
      success: true,
      message: `Stopped ${runningScrapers.length} running scraper(s)`
    });
  } catch (error) {
    console.error("Error stopping scrapers:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to stop scrapers"
    }, { status: 500 });
  }
}