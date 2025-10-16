// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// import type { BaseDashboardStats } from "@/types/application";

interface Params {
  params: {
    id: string;
  };
}
// app/api/admin/subscriptions/[id]/refund/route.ts
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { amount } = await request.json();

    // Here you would process the refund with Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const refund = await stripe.refunds.create({
    //   payment_intent: paymentIntentId,
    //   amount: amount * 100, // Convert to cents
    // });
  const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
    // For now, just log the refund request
   
      .from('subscription_payments')
      .insert({
        subscription_id: params.id,
        amount: -amount,
        type: 'refund',
        created_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, amount }, { status: 200 });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}