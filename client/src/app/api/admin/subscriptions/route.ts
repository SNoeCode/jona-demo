// client/src/app/api/admin/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const plan = searchParams.get("plan") || "all";

    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin
      .from("user_subscriptions")
      .select(
        `
        *,
        subscription_plans (
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
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (plan && plan !== "all") {
      const { data: planData } = await supabaseAdmin
        .from("subscription_plans")
        .select("id")
        .ilike("name", `%${plan}%`);

      if (planData && planData.length > 0) {
        query = query.in(
          "plan_id",
          planData.map((p) => p.id)
        );
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: subscriptions, error, count } = await query;

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          subscriptions: [],
          total: 0,
          page,
          limit,
        },
        { status: 200 }
      );
    }
    const enhancedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const { data: userData, error: userError } =
            await supabaseAdmin.auth.admin.getUserById(sub.user_id);

          if (userError) {
            console.error(`Error fetching user ${sub.user_id}:`, userError);
          }

          const userName =
            userData?.user?.user_metadata?.name ||
            userData?.user?.user_metadata?.full_name ||
            userData?.user?.email?.split("@")[0] ||
            "Unknown User";
          const userEmail = userData?.user?.email || "No email";
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch =
              userName.toLowerCase().includes(searchLower) ||
              userEmail.toLowerCase().includes(searchLower);

            if (!matchesSearch) {
              return null;
            }
          }

          // Get payment history
          const { data: payments } = await supabaseAdmin
            .from("subscription_payments")
            .select("amount, created_at, status")
            .eq("subscription_id", sub.id)
            .order("created_at", { ascending: false });

          const totalPaid =
            payments?.reduce((sum, payment) => {
              if (payment.status === "succeeded" || payment.status === "paid") {
                return sum + (payment.amount || 0);
              }
              return sum;
            }, 0) || 0;

          const lastPaymentDate = payments?.find(
            (p) => p.status === "succeeded" || p.status === "paid"
          )?.created_at;

          // Get usage data
          const { data: usage } = await supabaseAdmin
            .from("user_usage")
            .select("*")
            .eq("user_id", sub.user_id)
            .order("month_year", { ascending: false })
            .limit(3);

          return {
            user_id: sub.user_id,
            user_name: userName,
            user_email: userEmail,
            subscription: {
              id: sub.id,
              user_id: sub.user_id,
              plan_id: sub.plan_id,
              status: sub.status,
              billing_cycle: sub.billing_cycle,
              price_paid: sub.price_paid,
              current_period_start: sub.current_period_start,
              current_period_end: sub.current_period_end,
              cancel_at_period_end: sub.cancel_at_period_end,
              canceled_at: sub.canceled_at,
              stripe_subscription_id: sub.stripe_subscription_id,
              stripe_customer_id: sub.stripe_customer_id,
              created_at: sub.created_at,
              updated_at: sub.updated_at,
              plan: sub.subscription_plans,
            },
            total_paid: totalPaid,
            last_payment_date: lastPaymentDate,
            usage: usage || [],
            payment_history: payments || [],
          };
        } catch (error) {
          console.error(`Error processing subscription ${sub.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (from search filter or errors)
    const filteredSubscriptions = enhancedSubscriptions.filter(
      (sub) => sub !== null
    );

    return NextResponse.json(
      {
        subscriptions: filteredSubscriptions,
        total: search ? filteredSubscriptions.length : count || 0,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in admin subscriptions route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
