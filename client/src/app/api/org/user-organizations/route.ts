// client/src/app/api/org/user-organizations/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Fetch user's organizations using the RPC function
    const { data: organizations, error: orgsError } = await supabase.rpc(
      "get_user_organizations",
      {
        user_uuid: user.id,
      }
    );

    if (orgsError) {
      console.error("Error fetching user organizations:", orgsError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch organizations",
          error: orgsError.message,
        },
        { status: 500 }
      );
    }

    // Return serializable data
    const serializedOrganizations = (organizations || []).map((org: any) => ({
      organization_id: org.organization_id,
      organization_name: org.organization_name,
      organization_slug: org.organization_slug,
      user_role: org.user_role,
      joined_at: org.joined_at,
      member_count: org.member_count || 0,
      active_jobs: org.active_jobs || 0,
    }));

    return NextResponse.json({
      success: true,
      organizations: serializedOrganizations,
    });
  } catch (error: unknown) {
    console.error("Get user organizations error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}