// client/src/app/api/org/stats/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID required" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const { data: stats, error } = await supabase.rpc(
      "get_organization_stats",
      { org_uuid: organizationId }
    );

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    const { data: usage } = await supabase
      .from("organization_usage")
      .select("*")
      .eq("organization_id", organizationId)
      .order("month", { ascending: false })
      .limit(12);

    const { data: subscription } = await supabase
      .from("organization_subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {},
      usage: usage || [],
      subscription: subscription || null,
    });
} catch (error: unknown) {
  console.error("Accept invitation error:", error);

  const message =
    error instanceof Error ? error.message : "Unexpected error occurred";

  return NextResponse.json(
    { success: false, message },
    { status: 500 }
  );
}
}