// client/src/app/api/scrapers/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createErrorResponse, createSuccessResponse } from "@/utils/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const scraperType = searchParams.get("scraper_type");

    console.log("📋 Fetching logs: limit=", limit, "scraper_type=", scraperType);

    const cookieStore = cookies();
    const authCookie = cookieStore.get("sb-access-token") || cookieStore.get("supabase-auth-token");
    if (!authCookie) {
      console.warn("⚠️ No auth cookie found, proceeding with admin client for read access");
    }

    const maybeAdmin = getSupabaseAdmin();
    const supabaseAdmin = maybeAdmin instanceof Promise ? await maybeAdmin : maybeAdmin;

    let query = supabaseAdmin
      .from("scraping_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (scraperType && scraperType !== "all") {
      query = query.eq("scraper_type", scraperType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase admin fetch error:", error);
      return createErrorResponse("Failed to fetch scraping logs", 500);
    }

    console.log(`✅ Fetched ${Array.isArray(data) ? data.length : 0} logs from Supabase (admin)`);
    return createSuccessResponse(data || []);
  } catch (err) {
    console.error("❌ Logs fetch error:", err);
    return createErrorResponse(err instanceof Error ? err.message : "Failed to fetch scraping logs", 500);
  }
}
