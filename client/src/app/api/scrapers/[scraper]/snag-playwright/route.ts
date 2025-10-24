import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseWithToken } from "@/lib/supabaseAdmin";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";

interface ScraperRequest {
  location?: string;
  days?: number;
  keywords?: string[];
  priority?: "low" | "medium" | "high";
  debug?: boolean;
  max_results?: number;
  headless?: boolean;
  skip_captcha?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Authenticating for snag-playwright scraper...");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Missing or malformed Authorization header");
      return NextResponse.json({ error: "Auth token missing" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("❌ Token extraction failed");
      return NextResponse.json({ error: "Auth token missing" }, { status: 401 });
    }

    const userClient = await getSupabaseWithToken(token);
    const { data: { user }, error: userErr } = await userClient.auth.getUser();

    if (userErr || !user) {
      console.error("❌ Invalid token or user not found:", userErr?.message);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("✅ User authenticated:", user.email);

    const body: ScraperRequest = await request.json();
    console.log("📦 Request body:", body);

    const admin = await getSupabaseAdmin();

    const logEntry = {
      scraper_type: "snag-playwright",
      status: "pending",
      admin_user_id: user.id,
      admin_email: user.email,
      location: body.location || "remote",
      keywords: body.keywords || [],
      debug: !!body.debug,
      priority: body.priority || "medium",
      max_results: body.max_results ?? 100,
      headless: body.headless ?? true,
      skip_captcha: body.skip_captcha ?? true,
      started_at: new Date().toISOString(),
      jobs_found: 0,
    };

    console.log("📝 Creating scraping log...");
    const { data: logData, error: logError } = await admin
      .from("scraping_logs")
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error("❌ Failed to create log:", logError);
      return NextResponse.json(
        { error: "Failed to create scraping log", details: logError },
        { status: 500 }
      );
    }

    const logId = logData.id;
    console.log("✅ Created log with ID:", logId);

    await admin.from("scraping_logs").update({ status: "running" }).eq("id", logId);

    const payload = {
      location: body.location || "remote",
      keywords: body.keywords || [],
      debug: !!body.debug,
      priority: body.priority || "medium",
      max_results: body.max_results ?? 100,
      headless: body.headless ?? true,
      skip_captcha: body.skip_captcha ?? true,
    };

    const endpoints = [
      `${FASTAPI_BASE_URL}/api/scrapers/snag-playwright/run`,
      `${FASTAPI_BASE_URL}/scrapers/snag-playwright/run`,
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log("🔗 Trying:", endpoint);
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(300000),
        });

        if (response.ok) {
          console.log("✅ Got response from:", endpoint);
          break;
        } else {
          const text = await response.text().catch(() => "");
          console.log(`❌ Endpoint ${endpoint} returned ${response.status}: ${text}`);
        }
      } catch (err) {
        lastError = err as Error;
        console.log(`❌ Fetch failed for ${endpoint}:`, { name: lastError.name, message: lastError.message });
      }
    }

    if (!response || !response.ok) {
      await admin
        .from("scraping_logs")
        .update({
          status: "failed",
          error_message: lastError?.message || "FastAPI connection failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to FastAPI",
          error: lastError?.message || "Connection failed",
          log_id: logId,
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("📊 FastAPI result:", result);

    const endTime = new Date();
    const startTime = new Date(logData.started_at);
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const updateData = {
      status: result.success ? "completed" : "failed",
      jobs_found: result.jobs_found ?? 0,
      duration_seconds: durationSeconds,
      completed_at: endTime.toISOString(),
      error_message: result.success ? null : result.message ?? null,
      updated_at: new Date().toISOString(),
    };

    console.log("📝 Updating log with results:", updateData);
    await admin.from("scraping_logs").update(updateData).eq("id", logId);

    return NextResponse.json({
      success: !!result.success,
      message: result.message ?? null,
      jobs_found: result.jobs_found ?? 0,
      duration_seconds: durationSeconds,
      log_id: logId,
      scraper_type: "snag-playwright",
    });
  } catch (error) {
    console.error("❌ Scraper error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        scraper_type: "snag-playwright",
      },
      { status: 500 }
    );
  }
}