// app/api/org/manager-dashboard/route.ts
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ success: false, message: "Missing token" }, { status: 401 });

  const supabase = await getSupabaseAdmin(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

  const { organizationSlug } = await request.json();

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
    .single();

  if (!membership || membership.role !== "org_manager") {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  const { data: assignedMembers } = await supabase
    .from("organization_members")
    .select("id, user_id, department, role, joined_at, is_active, users (id, name, email)")
    .eq("manager_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true);

  const userIds = assignedMembers.map((m) => m.user_id);

  const { data: applications } = await supabase
    .from("applications")
    .select("id")
    .in("user_id", userIds);

  const stats = {
    totalAssigned: assignedMembers.length,
    totalApplications: applications.length,
    monthlyGrowth: 12, // Replace with actual growth logic
  };

  return NextResponse.json({
    success: true,
    members: assignedMembers.map((m) => ({
      id: m.id,
      name: m.users.name,
      email: m.users.email,
      role: m.role,
      department: m.department,
      joinedAt: m.joined_at,
      status: m.is_active ? "active" : "inactive",
    })),
    stats,
  });
}