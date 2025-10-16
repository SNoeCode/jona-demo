import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = await getSupabaseAdmin();

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select(
        "name,description,price_monthly,price_yearly,max_jobs_per_month,max_resumes,max_applications_per_day,auto_scrape_enabled,priority_support,api_access,export_enabled,features,trial_days"
      )
      .eq("active", true)
      .order("price_monthly", { ascending: true });

    if (error?.code === "42P01") {
      console.warn("⚠️ subscription_plans table missing, returning empty plans");
      return NextResponse.json({ success: true, plans: [] });
    }

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    const transformedPlans = (plans ?? []).map((plan) => {
      const id = plan.name.toLowerCase();
      return {
        id,
        name: plan.name,
        description: plan.description,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        max_jobs_per_month: plan.max_jobs_per_month,
        max_resumes: plan.max_resumes,
        max_applications_per_day: plan.max_applications_per_day,
        auto_scrape_enabled: plan.auto_scrape_enabled,
        priority_support: plan.priority_support,
        api_access: plan.api_access,
        export_enabled: plan.export_enabled,
        features: plan.features,
        trial_days: plan.trial_days,
        popular: id === "pro",
        color: id === "free" ? "gray" : id === "pro" ? "blue" : "purple",
        icon: id === "free" ? "Star" : id === "pro" ? "Zap" : "Crown",
      };
    });

    return NextResponse.json({ success: true, plans: transformedPlans });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error fetching plans";
    console.error("❌ Plans fetch failed:", message);

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}