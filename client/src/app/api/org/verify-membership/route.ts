// src/app/api/org/verify-membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = (body.organizationSlug || "").toLowerCase().trim();
    const userId = body.userId;

    console.log('🔍 Verify membership:', { slug, userId });

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "organizationSlug required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId required" },
        { status: 400 }
      );
    }

    const admin = await getSupabaseAdmin();
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (orgErr) {
      console.error("❌ Org lookup error:", orgErr);
      return NextResponse.json(
        { success: false, message: "Database error finding organization" },
        { status: 500 }
      );
    }

    if (!org) {
      console.log('❌ Organization not found:', slug);
      return NextResponse.json(
        { success: false, message: `Organization "${slug}" not found` },
        { status: 404 }
      );
    }

    console.log('✅ Found organization:', org);

    const { data: member, error: memErr } = await admin
      .from("organization_members")
      .select("id, role, is_active")
      .eq("organization_id", org.id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (memErr) {
      console.error("❌ Membership lookup error:", memErr);
      return NextResponse.json(
        { success: false, message: "Database error checking membership" },
        { status: 500 }
      );
    }

    if (!member) {
      console.log('❌ User is not a member of this organization');
      return NextResponse.json(
        { success: false, message: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    console.log('✅ Found membership:', member);

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationSlug: org.slug,
      organizationName: org.name,
      memberRole: member.role,
      memberActive: member.is_active,
    });
  } catch (err) {
    console.error("❌ verify-membership error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}