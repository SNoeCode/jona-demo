// app/api/admin/resumes/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
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
    const search = searchParams.get("search");

    const supabaseAdmin = await getSupabaseAdmin();

    let resumeQuery = supabaseAdmin
      .from("resumes")
      .select(
        `
        *,
        users!resumes_user_id_fkey (
          id,
          name,
          email
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      resumeQuery = resumeQuery.or(`file_name.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    resumeQuery = resumeQuery.range(from, to);

    const { data: resumeData, error: resumeError, count } = await resumeQuery;

    if (resumeError) {
      console.error("Error fetching resumes:", resumeError);
      throw resumeError;
    }

    const enhancedResumes = await Promise.all(
      (resumeData || []).map(async (resume) => {
        const [comparisonCount, applicationCount] = await Promise.all([
          supabaseAdmin
            .from("resume_comparisons")
            .select("match_score", { count: "exact" })
            .eq("resume_id", resume.id),
          supabaseAdmin
            .from("user_job_status")
            .select("id", { count: "exact" })
            .eq("user_id", resume.user_id)
            .eq("applied", true)
        ]);

        const matchScores =
          comparisonCount.data?.map((c) => c.match_score).filter((s) => s !== null) || [];
        const avgMatchScore =
          matchScores.length > 0
            ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
            : 0;

        return {
          ...resume,
          user_name: resume.users?.name || "N/A",
          user_email: resume.users?.email || "N/A",
          original_filename: resume.file_name,
          uploaded_date: resume.created_at,
          match_score: avgMatchScore,
          applications_sent: applicationCount.count || 0,
          file_url: resume.file_path,
          parsed_content: resume.content
        };
      })
    );

    const result = {
      resumes: enhancedResumes,
      total: count || 0,
      page,
      limit
    };

    return NextResponse.json(serializeForClient(result), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/admin/resumes:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        resumes: [],
        total: 0,
        page: 1,
        limit: 50
      },
      { status: 500 }
    );
  }
}