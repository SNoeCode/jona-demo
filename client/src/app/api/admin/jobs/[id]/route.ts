// app/api/admin/jobs/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getJobs, createJob } from "@/services/admin/admin_jobs";
import { logAdminAction } from "@/services/admin/admin-log-service";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Helper to serialize data for client components
function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    console.log("Fetching jobs - page:", page, "search:", search, "status:", status);

    try {
      const result = await getJobs(page, search, status);
      
      // Serialize the data to ensure it's safe for client components
      const serialized = serializeForClient(result);
      
      console.log(`Successfully fetched ${serialized.jobs.length} jobs`);
      return NextResponse.json(serialized);
    } catch (serviceError) {
      console.error("Service error, using fallback:", serviceError);

      // Fallback to direct DB query
      const supabaseAdmin = await getSupabaseAdmin();
      
      let query = supabaseAdmin
        .from("jobs")
        .select("*", { count: "exact" })
        .order("inserted_at", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
      }

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: fallbackError, count } = await query;
      
      if (fallbackError) {
        console.error("Fallback query error:", fallbackError);
        throw fallbackError;
      }

      const result = { 
        jobs: data || [], 
        total: count || 0, 
        page, 
        limit 
      };

      return NextResponse.json(serializeForClient(result));
    }
  } catch (error) {
    console.error("Error in GET /api/admin/jobs:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        jobs: [],
        total: 0,
        page: 1,
        limit: 50
      },
      { status: 500 }
    );
  }
}
