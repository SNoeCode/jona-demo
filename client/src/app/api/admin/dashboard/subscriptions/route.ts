export const dynamic = "force-dynamic";
// client\src\app\api\admin\dashboard\subscriptions\route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSubscriptionStats } from "@/lib/stats/subscriptionStats";

export async function GET() {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const stats = await getSubscriptionStats(supabaseAdmin);
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.log("hottotototoototootototootototot")
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
