// client\src\app\(auth)\admin\subscriptions\stats\route.ts
import { NextRequest, NextResponse } from "next/server";
import {getSupabaseAdmin} from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

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
        .select("id", { count: "exact" })
    ]);

    const subscriptions = subscriptionsResult.data || [];
    const payments = paymentsResult.data || [];
    const totalUsers = usageResult.count || 0;

    // Calculate stats
    const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate MRR (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = payments.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
    const monthlyRecurringRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate churn rate (simplified)
    const canceledSubscriptions = subscriptions.filter(s => s.status === "canceled").length;
    const churnRate =
      activeSubscriptions > 0
        ? (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100
        : 0;

    // Average revenue per user
    const averageRevenuePerUser =
      activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

    // Plan distribution
    const planCounts = subscriptions.reduce((acc, sub) => {
      const plan = Array.isArray(sub.subscription_plans)
        ? sub.subscription_plans[0]
        : sub.subscription_plans;

      const planName = plan?.name?.toLowerCase() || "free";
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Add free users
    const paidUsers = subscriptions.length;
    const freeUsers = totalUsers - paidUsers;
    planCounts.free = (planCounts.free || 0) + freeUsers;

    const stats = {
      totalRevenue,
      monthlyRecurringRevenue,
      activeSubscriptions,
      churnRate: Math.round(churnRate * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      planDistribution: {
        free: planCounts.free || 0,
        pro: planCounts.pro || 0,
        premium: planCounts.premium || 0
      }
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}