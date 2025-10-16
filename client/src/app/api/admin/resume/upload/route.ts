// import { NextRequest, NextResponse } from "next/server";
// // import { cookies } from "next/headers";
// // import { decode } from "jsonwebtoken";
// import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// export async function POST(req: NextRequest) {
//   try {
//     const token = cookies().get("sb-access-token")?.value;
//     const decoded = token ? decode(token) as any : null;

//     if (!decoded || !decoded.sub) {
//       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//     }

//     const { resumeId, resume_url, title, status } = await req.json();

//     if (!resumeId) {
//       return NextResponse.json({ success: false, error: "Missing resume ID" }, { status: 400 });
//     }

//     const updateData: Record<string, any> = {
//       updated_at: new Date().toISOString(),
//     };

//     if (resume_url) updateData.resume_url = resume_url;
//     if (title) updateData.title = title;
//     if (status) updateData.status = status;

//     const supabase = await getSupabaseAdmin();

//     const { error } = await supabase
//       .from("resumes")
//       .update(updateData)
//       .eq("id", resumeId)
//       .eq("user_id", decoded.sub);

//     if (error) {
//       return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Resume updated successfully",
//     });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Unknown error occurred";
//     return NextResponse.json({ success: false, error: message }, { status: 500 });
//   }
// }


