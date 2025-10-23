import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: allSubscriptions, error: subsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          price_monthly,
          price_yearly
        )
      `);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }
   const { data: allPayments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, created_at, status')
      .in('status', ['succeeded', 'paid']);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }
  const activeSubscriptions = allSubscriptions?.filter(
      sub => sub.status === 'active'
    ).length || 0;

    const totalRevenue = allPayments?.reduce(
      (sum, payment) => sum + (payment.amount || 0), 
      0
    ) || 0;
   const monthlyRecurringRevenue = allSubscriptions?.reduce((sum, sub) => {
      if (sub.status === 'active' && sub.subscription_plans) {
        if (sub.billing_cycle === 'monthly') {
          return sum + (sub.subscription_plans.price_monthly || 0);
        } else if (sub.billing_cycle === 'yearly') {
          // Convert yearly to monthly
          return sum + ((sub.subscription_plans.price_yearly || 0) / 12);
        }
      }
      return sum;
    }, 0) || 0;
 const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const canceledLast30Days = allSubscriptions?.filter(sub => {
      if (!sub.canceled_at) return false;
      const cancelDate = new Date(sub.canceled_at);
      return cancelDate >= thirtyDaysAgo;
    }).length || 0;

    const churnRate = activeSubscriptions > 0 
      ? ((canceledLast30Days / (activeSubscriptions + canceledLast30Days)) * 100).toFixed(2)
      : '0.00';
 const totalUsers = allSubscriptions?.length || 1;
    const averageRevenuePerUser = totalRevenue / totalUsers;
const planDistribution = {
      free: 0,
      pro: 0,
      enterprise: 0
    };

    allSubscriptions?.forEach(sub => {
      const planName = sub.subscription_plans?.name?.toLowerCase() || '';
      if (planName.includes('free')) {
        planDistribution.free++;
      } else if (planName.includes('pro')) {
        planDistribution.pro++;
      } else if (planName.includes('enterprise')) {
        planDistribution.enterprise++;
      }
    });
   const recentPayments = allPayments
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) || [];

    return NextResponse.json({
      totalRevenue,
      monthlyRecurringRevenue,
      activeSubscriptions,
      churnRate: parseFloat(churnRate),
      averageRevenuePerUser,
      planDistribution,
      payment_history: recentPayments
    }, { status: 200 });

  } catch (error) {
    console.error('Error in subscription stats route:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}