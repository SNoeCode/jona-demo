// client/src/app/api/org/verify-membership/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationSlug, userId } = body;

    // Use authenticated user's ID if not provided
    const targetUserId = userId || user.id;

    // Verify the organization exists
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", organizationSlug)
      .single();

    if (orgError || !org) {
      console.error("Organization lookup error:", orgError);
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", org.id)
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .maybeSingle();

    if (memberError) {
      console.error("Membership lookup error:", memberError);
      return NextResponse.json(
        { success: false, message: "Error checking membership" },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a member of this organization",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      memberRole: membership.role,
      membership: {
        id: membership.id,
        role: membership.role,
        department: membership.department,
        position: membership.position,
        joined_at: membership.joined_at,
      },
    });
  } catch (error: unknown) {
    console.error("Verify membership error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get("slug");

    if (!organizationSlug) {
      return NextResponse.json(
        { success: false, message: "Organization slug is required" },
        { status: 400 }
      );
    }

    // Verify the organization exists
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", organizationSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (memberError) {
      console.error("Membership lookup error:", memberError);
      return NextResponse.json(
        { success: false, message: "Error checking membership" },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a member of this organization",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      memberRole: membership.role,
      membership: {
        id: membership.id,
        role: membership.role,
        department: membership.department,
        position: membership.position,
        joined_at: membership.joined_at,
      },
    });
  } catch (error: unknown) {
    console.error("Verify membership error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}