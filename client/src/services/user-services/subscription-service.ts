"use server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import type {
  SubscriptionPlan,
  UserSubscription,
  PaymentHistory,
  UserUsage,
  CurrentSubscription,
} from "@/types/user/index";
import { safeSelect } from "@/lib/safeFetch";
import type { UsagePayload } from "@/types/user/index";
import { isUserUsageSummary } from "@/types/user/index";



function getSupabaseClient() {
  return createServerComponentClient<Database>({ cookies });
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("price_monthly", { ascending: true });

    return safeSelect<SubscriptionPlan[]>(response, "subscription_plans");
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return [];
  }
}

export async function getCurrentSubscription(
  userId: string
): Promise<CurrentSubscription | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        status,
        billing_cycle,
        price_paid,
        current_period_end,
        subscription_plans!inner (
          name,
          auto_scrape_enabled,
          priority_support,
          max_jobs_per_month,
          max_applications_per_day,
          max_resumes,
          features
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.subscription_plans) return null;

    const plan = Array.isArray(data.subscription_plans)
      ? data.subscription_plans[0]
      : data.subscription_plans;

    return {
      subscription_id: data.id,
      plan_name: plan.name,
      billing_cycle: data.billing_cycle,
      status: data.status,
      current_period_end: data.current_period_end,
      max_jobs_per_month: plan.max_jobs_per_month,
      max_resumes: plan.max_resumes,
      max_applications_per_day: plan.max_applications_per_day,
      auto_scrape_enabled: plan.auto_scrape_enabled,
      priority_support: plan.priority_support,
      features: Array.isArray(plan.features)
        ? plan.features.join(", ")
        : plan.features,
      price_paid: data.price_paid,
    };
  } catch (error) {
    console.error("getCurrentSubscription error:", error);
    return null;
  }
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("getUserSubscription error:", error);
    return null;
  }
}

export async function getUserUsage(
  userId: string,
  monthYear?: string
): Promise<UserUsage | null> {
  try {
    const supabase = getSupabaseClient();
    const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

    const { data, error } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", currentMonth)
      .maybeSingle();

    if (error) return null;
    if (!data) return await initializeUserUsage(userId, currentMonth);
    return data;
  } catch (error) {
    console.error("getUserUsage error:", error);
    return {
      id: "",
      user_id: userId,
      month_year: monthYear || new Date().toISOString().slice(0, 7),
      jobs_scraped: 0,
      applications_sent: 0,
      resumes_uploaded: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function initializeUserUsage(
  userId: string,
  monthYear: string
): Promise<UserUsage> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_usage")
      .insert({
        user_id: userId,
        month_year: monthYear,
        jobs_scraped: 0,
        applications_sent: 0,
        resumes_uploaded: 0,
      })
      .select()
      .single();

    if (error || !data) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("initializeUserUsage error:", error);
    return {
      id: "",
      user_id: userId,
      month_year: monthYear,
      jobs_scraped: 0,
      applications_sent: 0,
      resumes_uploaded: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateUserUsage(
  userId: string,
  monthYear: string,
  usage: Partial<
    Pick<UserUsage, "jobs_scraped" | "applications_sent" | "resumes_uploaded">
  >
): Promise<UserUsage | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_usage")
      .upsert({
        user_id: userId,
        month_year: monthYear,
        ...usage,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("updateUserUsage error:", error);
    return null;
  }
}

export async function incrementUsage(
  userId: string,
  type: "jobs_scraped" | "applications_sent" | "resumes_uploaded",
  amount: number = 1
): Promise<void> {
  try {
    const monthYear = new Date().toISOString().slice(0, 7);
    let currentUsage = await getUserUsage(userId, monthYear);
    if (!currentUsage) {
      currentUsage = await initializeUserUsage(userId, monthYear);
    }

    const updatedUsage = {
      [type]: (currentUsage[type] || 0) + amount,
    };

    await updateUserUsage(userId, monthYear, updatedUsage);
  } catch (error) {
    console.error("incrementUsage error:", error);
  }
}
export async function checkUsageLimits(userId: string): Promise<{
  canScrapeJobs: boolean;
  canSendApplications: boolean;
  canUploadResumes: boolean;
  limits: any;
  usage: UserUsage | null;
}> {
  try {
    const subscription = await getCurrentSubscription(userId);
    const usage = await getUserUsage(userId);
    const defaultLimits = {
      max_jobs_per_month: 50,
      max_applications_per_day: 5,
      max_resumes: 1,
    };

    if (!subscription) {
      return {
        canScrapeJobs: (usage?.jobs_scraped || 0) < defaultLimits.max_jobs_per_month,
        canSendApplications: (usage?.applications_sent || 0) < defaultLimits.max_applications_per_day,
        canUploadResumes: (usage?.resumes_uploaded || 0) < defaultLimits.max_resumes,
        limits: defaultLimits,
        usage,
      };
    }

    return {
      canScrapeJobs:
        subscription.max_jobs_per_month === -1 ||
        (usage?.jobs_scraped || 0) < (subscription.max_jobs_per_month ?? 0),
      canSendApplications:
        subscription.max_applications_per_day === -1 ||
        (usage?.applications_sent || 0) < (subscription.max_applications_per_day ?? 0),
      canUploadResumes:
        subscription.max_resumes === -1 ||
        (usage?.resumes_uploaded || 0) < (subscription.max_resumes ?? 0),
      limits: {
        max_jobs_per_month: subscription.max_jobs_per_month,
        max_applications_per_day: subscription.max_applications_per_day,
        max_resumes: subscription.max_resumes,
      },
      usage,
    };
  } catch (error) {
    console.error("checkUsageLimits error:", error);
    return {
      canScrapeJobs: true,
      canSendApplications: true,
      canUploadResumes: true,
      limits: {
        max_jobs_per_month: 50,
        max_applications_per_day: 5,
        max_resumes: 1,
      },
      usage: null,
    };
  }
}

export async function getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    const response = await supabase
      .from("payment_history")
      .select("*")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false });

    return safeSelect<PaymentHistory[]>(response, "payment_history");
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return [];
  }
}

export async function getUsagePayload(userId: string): Promise<UsagePayload | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("No valid session for usage payload");
      return null;
    }

    const { data: summary, error: summaryError } = await supabase
      .from("user_usage_summary")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (summary && isUserUsageSummary(summary)) {
      return summary;
    }

    if (summaryError && summaryError.code !== "PGRST116") {
      console.warn("Usage summary fetch failed:", summaryError.message);
    }

    const { data: usageData, error: usageError } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .order("month_year", { ascending: false })
      .limit(1);

    if (usageError) {
      console.warn("Usage data fetch failed:", usageError.message);
      return null;
    }

    return usageData?.[0] ?? null;
  } catch (error) {
    console.error("getUsagePayload error:", error);
    return null;
  }
}
