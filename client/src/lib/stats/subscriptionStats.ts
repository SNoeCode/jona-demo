import { SupabaseClient } from "@supabase/supabase-js";

export async function getSubscriptionStats(supabaseAdmin: SupabaseClient) {
  const [subscriptionsResult, paymentsResult, usageResult] = await Promise.all([
    supabaseAdmin
      .from("user_subscriptions")
      .select(`
        status,
        subscription_plans!user_subscriptions_plan_id_fkey (
          name,
          price_monthly
        )
      `),
    supabaseAdmin
      .from("subscription_payments")
      .select("amount, created_at"),
    supabaseAdmin
      .from("users")
      .select("id", { count: "exact" }),
  ]);

  const subscriptions = subscriptionsResult.data || [];
  const payments = paymentsResult.data || [];
  const totalUsers = usageResult.count || 0;

  const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPayments = payments.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
  const monthlyRecurringRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);

  const canceledSubscriptions = subscriptions.filter(s => s.status === "canceled").length;
  const churnRate =
    activeSubscriptions > 0
      ? (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100
      : 0;

  const averageRevenuePerUser =
    activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

  const planCounts = subscriptions.reduce((acc, sub) => {
    const plan = Array.isArray(sub.subscription_plans)
      ? sub.subscription_plans[0]
      : sub.subscription_plans;

    const planName = plan?.name?.toLowerCase() || "free";
    acc[planName] = (acc[planName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paidUsers = subscriptions.length;
  const freeUsers = totalUsers - paidUsers;
  planCounts.free = (planCounts.free || 0) + freeUsers;

  return {
    totalRevenue,
    monthlyRecurringRevenue,
    activeSubscriptions,
    churnRate: Math.round(churnRate * 100) / 100,
    averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
    planDistribution: {
      free: planCounts.free || 0,
      pro: planCounts.pro || 0,
      enterprise: planCounts.enterprise || 0,
      premium: planCounts.premium || 0,
    },
  };
}