// // src/app/api/jobs/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getSupabaseWithToken, getSupabaseAdmin } from "@/lib/supabaseAdmin";

// export async function GET(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get("authorization") || "";
//     const token = authHeader.replace(/^Bearer\s+/i, "").trim();

//     if (!token) {
//       return NextResponse.json({ success: false, message: "Auth token required" }, { status: 401 });
//     }

//     // Create a user-scoped client so RLS sees auth.uid()
//     const userClient = await getSupabaseWithToken(token);

//     // Query jobs as the user (RLS applies)
//     const { data: jobsData, error: jobsErr } = await userClient
//       .from("jobs")
//       .select("*")
//       .order("date", { ascending: false });

//     if (jobsErr) {
//       console.error("Error fetching jobs as user:", jobsErr);
//       return NextResponse.json({ success: false, message: jobsErr.message }, { status: 500 });
//     }

//     // Query the user's job status rows (also user-scoped)
//     const { data: statusData, error: statusErr } = await userClient
//       .from("user_job_status")
//       .select("*")
//       .eq("user_id", userClient.auth.getUser ? (await userClient.auth.getUser()).data?.user?.id : undefined);

//     if (statusErr) {
//       console.error("Error fetching user_job_status as user:", statusErr);
//       // fallback: continue with empty statuses
//     }

//     const statusMap = new Map((statusData || []).map((s: any) => [s.job_id, s]));

//     const combined = (jobsData || []).map((job: any) => ({
//       ...job,
//       user_job_status: statusMap.get(job.id) || null,
//     }));

//     return NextResponse.json({ success: true, jobs: combined });
//   } catch (err) {
//     console.error("GET /api/jobs error:", err);
//     return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
//   }
// }