// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// import type { DashboardStatsProps } from "@/types/application";
interface Params {
  params: {
    id: string;
  };
}


export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Here you would also cancel the Stripe subscription if applicable
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // if (data.stripe_subscription_id) {
    //   await stripe.subscriptions.cancel(data.stripe_subscription_id);
    // }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
