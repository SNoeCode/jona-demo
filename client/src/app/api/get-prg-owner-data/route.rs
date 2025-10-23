import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ success: false, message: "Missing token" }, { status: 401 });

  const supabase = await getSupabaseAdmin(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

  const body = await request.json();
  const { organizationSlug } = body;
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", organizationSlug)
    .single();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 });
  }

  const { data: prgData } = await supabase
    .from("programs")
    .select("*")
    .eq("organization_id", org.id);

  return NextResponse.json({ success: true, prgData });
}