// 'use server'
// import { NextRequest, NextResponse } from "next/server";
// import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { AdminService } from "@/app/services/admin";

// import { logAdminAction } from "@/app/services/admin/admin-log-service";
// import { runAllScrapers } from "@/app/services/admin/scraperEngine";
// import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
// import type { ScraperRequest } from "@/types/admin";

// // 🧼 Utility: Extract Bearer token from Authorization header
// function extractBearerToken(request: NextRequest): string | null {
//   const authHeader = request.headers.get("Authorization");
//   if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
//   return authHeader.replace("Bearer ", "");
// }

// // 🔁 GET: Fetch system configuration
// export async function GET() {
//   try {
//            const supabaseAdmin = await getSupabaseAdmin();

//     const { data, error } = await supabaseAdmin
//       .from("system_configuration")
//       .select("*")
//       .order("key");

//     if (error) throw error;

//     const config = (data || []).reduce((acc, item) => {
//       acc[item.key] = item.value;
//       return acc;
//     }, {} as Record<string, any>);

//     return NextResponse.json(config);
//   } catch (error) {
//     console.error("Error fetching system config:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // 🧠 PUT: Update system configuration with audit logging
// export async function PUT(request: NextRequest) {
//   try {
//     const token = extractBearerToken(request);
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//        const supabaseAdmin = await getSupabaseAdmin();

//     const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
//     if (authError || !user || user.user_metadata?.role !== "admin") {
//       return NextResponse.json({ error: "Admin access required" }, { status: 403 });
//     }

//     const updates = await request.json();
//     const updatePromises = Object.entries(updates).map(([key, value]) =>
//       supabaseAdmin
//         .from("system_configuration")
//         .upsert({
//           key,
//           value: value as any,
//           updated_by: user.id,
//           updated_at: new Date().toISOString()
//         })
//     );

//     await Promise.all(updatePromises);

//     await supabaseAdmin
//       .from("admin_audit_logs")
//       .insert({
//         admin_user_id: user.id,
//         admin_email: user.email,
//         action: "system_config_updated",
//         entity_type: "system",
//         entity_id: "config",
//         new_values: updates,
//         old_values: null
//       });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error updating system config:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // 🕸️ POST: Run all scrapers with secret verification and audit logging
// export async function POST(request: NextRequest) {
//   try {
//     const supabase = createServerActionClient({ cookies });
//     const { data: { user }, error } = await supabase.auth.getUser();

//     if (error || !user || user.user_metadata?.role !== "admin") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const config: ScraperRequest & { secret: string } = await request.json();
//     if (config.secret !== process.env.SCRAPER_SECRET_TOKEN) {
//       return NextResponse.json({ error: "Invalid secret token" }, { status: 401 });
//     }

//     const sources = ["Indeed", "ZipRecruiter", "Dice"];
//     const result = await runAllScrapers(config, sources);

//     try {
//       await logAdminAction(
//         user.id,
//         user.email || "",
//         "scraper_run",
//         "scraper",
//         "all",
//         { ...config },
//       );
//     } catch (logError) {
//       console.warn("Audit log failed:", logError);
//     }

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error running all scrapers:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }