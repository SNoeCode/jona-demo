import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookies() 
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
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
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // Fetch usage data for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usage, error: usageError } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", currentMonth)
      .maybeSingle();

    if (usageError) {
      console.error("Error fetching usage:", usageError);
    }

    // Fetch payment history
    const { data: payments, error: paymentsError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    return NextResponse.json({
      subscription: subscription || null,
      usage: usage || {
        jobs_scraped: 0,
        applications_sent: 0,
        resumes_uploaded: 0,
      },
      payments: payments || [],
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}