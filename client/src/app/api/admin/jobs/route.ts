export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getJobs,createJob } from "@/services/admin/admin_jobs";
import { logAdminAction } from "@/services/admin/admin-log-service";
import {getSupabaseAdmin} from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    try {
      const jobs = await getJobs(page, search, status);
      return NextResponse.json(jobs);
    } catch (apiError) {
      console.warn("API endpoint unavailable, falling back to direct DB queries");
    }
   const supabaseAdmin = await getSupabaseAdmin();

    // Fallback logic
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
    if (fallbackError) throw fallbackError;

    return NextResponse.json({ jobs: data, total: count, page, limit }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {

  const supabase = createServerActionClient({ cookies });
   const supabaseAdmin = await getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobData = await request.json();

    try {
      const job = await createJob(jobData);

      await logAdminAction(

        user.id,
        user.email || "",
        "job_created",
        "job",
        job.id,
        jobData
      );

      return NextResponse.json(job);
    } catch (apiError) {
      console.warn("API endpoint unavailable, falling back to direct DB insert");
    }

    // Fallback logic
    const { data: fallbackJob, error: fallbackError } = await supabaseAdmin
      .from("jobs")
      .insert(jobData)
      .select()
      .single();

    if (fallbackError) throw fallbackError;

    await logAdminAction(
      user.id,
      user.email || "",
      "job_created",
      "job",
      fallbackJob.id,
      jobData
    );

    return NextResponse.json(fallbackJob, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
