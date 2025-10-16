

export const dynamic = "force-dynamic";

// client\src\app\subscriptions\route.ts
import { NextRequest, NextResponse } from "next/server";
// import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { BaseDashboardStats } from "@/types/user/index";

import {getSupabaseAdmin} from "@/lib/supabaseAdmin";


interface Params {
  params: {
    id: string;
  };
}
// app/api/admin/subscriptions/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        users!user_subscriptions_user_id_fkey (
          id,
          name,
          email
        ),
        subscription_plans!user_subscriptions_plan_id_fkey (
          id,
          name,
          description,
          price_monthly,
          price_yearly,
          features,
          max_jobs_per_month,
          max_resumes,
          max_applications_per_day,
          auto_scrape_enabled,
          priority_support,
          active
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      // Join with users table for name/email search
      const { data: userIds } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      
      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds.map(u => u.id));
      } else {
        // No matching users, return empty result
        return NextResponse.json({
          subscriptions: [],
          total: 0,
          page,
          limit
        }, { status: 200 });
      }
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (plan && plan !== 'all') {
      const { data: planIds } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .ilike('name', plan);
      
      if (planIds && planIds.length > 0) {
        query = query.in('plan_id', planIds.map(p => p.id));
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Enhance subscription data
    const enhancedSubscriptions = await Promise.all(
      (data || []).map(async (sub) => {
        // Get total payments and usage data
        const [paymentsResult, usageResult] = await Promise.all([
          supabaseAdmin
            .from('subscription_payments')
            .select('amount, created_at')
            .eq('subscription_id', sub.id),
          supabaseAdmin
            .from('user_usage')
            .select('*')
            .eq('user_id', sub.user_id)
            .order('month_year', { ascending: false })
            .limit(3)
        ]);

        const totalPaid = paymentsResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const lastPaymentDate = paymentsResult.data?.[0]?.created_at;

        return {
          user_id: sub.user_id,
          user_name: sub.users?.name || 'N/A',
          user_email: sub.users?.email || 'N/A',
          subscription: {
            ...sub,
            plan: sub.subscription_plans
          },
          total_paid: totalPaid,
          last_payment_date: lastPaymentDate,
          usage: usageResult.data || []
        };
      })
    );

    return NextResponse.json({
      subscriptions: enhancedSubscriptions,
      total: count,
      page,
      limit
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}