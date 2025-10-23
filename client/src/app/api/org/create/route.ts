// client/src/app/api/org/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const body = await request.json();
    
    const {
      name,
      slug: rawSlug,
      industry,
      size,
      website,
      adminUserId,
      adminPosition,
    } = body;

    // Validation
    if (!adminUserId || !name || !rawSlug) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: adminUserId, name, slug" },
        { status: 400 }
      );
    }

    const slug = String(rawSlug).toLowerCase().trim();

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .ilike("slug", slug)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Organization slug already taken" },
        { status: 409 }
      );
    }

    // Insert organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name,
        slug,
        industry: industry || null,
        size: size || null,
        website: website || null,
        settings: {},
        metadata: {},
        is_active: true,
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error("Organization creation error:", orgError);
      return NextResponse.json(
        { success: false, message: orgError?.message ?? "Failed to create organization" },
        { status: 500 }
      );
    }

    // Add admin as owner (let database handle timestamps)
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: adminUserId,
        role: "owner",
        position: adminPosition || null,
        invitation_accepted: true,
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Member creation error, rolling back:", memberError);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { success: false, message: memberError.message },
        { status: 500 }
      );
    }

    // Update user record
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        current_organization_id: org.id,
        is_org_owner: true,
      })
      .eq("id", adminUserId);

    if (userError) {
      console.error("Warning: Failed to update user record:", userError);
    }

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationSlug: org.slug,
      organization: org,
    });

  } catch (err) {
    console.error("Create organization error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error occurred";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}