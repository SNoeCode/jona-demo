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

// ─────────────────────────────────────────────────────────────
// Supabase Client
// ─────────────────────────────────────────────────────────────

function getSupabaseClient() {
  return createServerComponentClient<Database>({ cookies });
}

// ─────────────────────────────────────────────────────────────
// Subscription Services
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Usage Services
// ─────────────────────────────────────────────────────────────

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



import type { UsagePayload } from "@/types/user/index";
import { isUserUsageSummary } from "@/types/user/index";

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

// // Standalone helper functions
// export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
//   try {
//     const cookieStore = cookies();
//     const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
//     const response = await supabase
//       .from("subscription_plans")
//       .select("*")
//       .eq("active", true)
//       .order("price_monthly", { ascending: true });

//     return safeSelect<SubscriptionPlan[]>(response, "subscription_plans");
//   } catch (error) {
//     console.error("Error fetching subscription plans:", error);
//     return [];
//   }
// }

// export async function getCurrentSubscription(
//   userId: string
// ): Promise<CurrentSubscription | null> {
//   try {
//     const cookieStore = cookies();
//     const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
//     const { data, error } = await supabase.rpc(
//       "get_user_current_subscription",
//       { p_user_id: userId }
//     );

//     if (error) {
//       console.error("Error fetching current subscription:", error);
//       return null;
//     }

//     return data?.[0] || null;
//   } catch (error) {
//     console.error("getCurrentSubscription error:", error);
//     return null;
//   }
// }

// export async function updateUserProfile(
//   userId: string,
//   updates: Partial<EnhancedUserProfile>
// ): Promise<EnhancedUserProfile | null> {
//   try {
//     const cookieStore = cookies();
//     const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
//     const { data, error } = await supabase
//       .from("user_profiles")
//       .update({
//         ...updates,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", userId)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error updating user profile:", error);
//       return null;
//     }

//     return data;
//   } catch (error) {
//     console.error("updateUserProfile error:", error);
//     return null;
//   }
// }

// export async function getUsagePayload(
//   userId: string
// ): Promise<UsagePayload | null> {
//   try {
//     const cookieStore = cookies();
//     const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
//     const { data: session } = await supabase.auth.getSession();
//     if (!session.session) {
//       console.error("No valid session for usage payload");
//       return null;
//     }

//     const { data: summary, error: summaryError } = await supabase
//       .from("user_usage_summary")
//       .select("*")
//       .eq("user_id", userId)
//       .maybeSingle();

//     if (summary && isUserUsageSummary(summary)) {
//       return summary;
//     }

//     if (summaryError && summaryError.code !== "PGRST116") {
//       console.warn("Usage summary fetch failed:", summaryError.message);
//     }

//     const { data: usageData, error: usageError } = await supabase
//       .from("user_usage")
//       .select("*")
//       .eq("user_id", userId)
//       .order("month_year", { ascending: false })
//       .limit(1);

//     if (usageError) {
//       console.warn("Usage data fetch failed:", usageError.message);
//       return null;
//     }

//     return usageData?.[0] ?? null;
//   } catch (error) {
//     console.error("getUsagePayload error:", error);
//     return null;
//   }
// }

// export async function SubscriptionBundleService(userId: string) {
//   if (!userId) {
//     console.error("Invalid userId provided to SubscriptionBundleService");
//     return null;
//   }

//   try {
//     const cookieStore = cookies();
//     const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
//     const { data: { session } } = await supabase.auth.getSession();

//     if (!session?.user) {
//       console.error("No user session found");
//       return null;
//     }

//     // Update user profile with last seen
//     const updates = { lastSeen: new Date().toISOString() };
//     await updateUserProfile(userId, updates as Partial<EnhancedUserProfile>);

//     // Use Promise.allSettled to handle individual failures gracefully
//     const results = await Promise.allSettled([
//       SubscriptionService.getSubscriptionPlans(),
//       SubscriptionService.getCurrentSubscription(userId),
//       SubscriptionService.getUserSubscription(userId),
//       SubscriptionService.getUserUsage(userId),
//       SubscriptionService.getUsagePayload(userId),
//       SubscriptionService.getPaymentHistory(userId),
//       SubscriptionService.checkUsageLimits(userId),
//     ]);

//     // Extract results, using defaults for failed promises
//     const [
//       plansResult,
//       currentSubscriptionResult,
//       userSubscriptionResult,
//       usageResult,
//       usagePayloadResult,
//       paymentHistoryResult,
//       usageLimitsResult,
//     ] = results;

//     return {
//       user: session.user,
//       plans: plansResult.status === "fulfilled" ? plansResult.value : [],
//       currentSubscription:
//         currentSubscriptionResult.status === "fulfilled"
//           ? currentSubscriptionResult.value
//           : null,
//       userSubscription:
//         userSubscriptionResult.status === "fulfilled"
//           ? userSubscriptionResult.value
//           : null,
//       usage: usageResult.status === "fulfilled" ? usageResult.value : null,
//       usagePayload:
//         usagePayloadResult.status === "fulfilled"
//           ? usagePayloadResult.value
//           : null,
//       paymentHistory:
//         paymentHistoryResult.status === "fulfilled"
//           ? paymentHistoryResult.value
//           : [],
//       usageLimits:
//         usageLimitsResult.status === "fulfilled"
//           ? usageLimitsResult.value
//           : {
//               canScrapeJobs: true,
//               canSendApplications: true,
//               canUploadResumes: true,
//               limits: {
//                 max_jobs_per_month: 50,
//                 max_applications_per_day: 5,
//                 max_resumes: 1,
//               },
//               usage: null,
//             },
//     };
//   } catch (error) {
//     console.error("SubscriptionBundleService error:", error);
//     return null;
//   }
// }
// Get all subscription plans

// import type {
//   SubscriptionPlan,
//   UserSubscription,
//   PaymentHistory,
//   UserUsage,
//   CurrentSubscription,
//   EnhancedUserProfile,
//   StripeCheckoutSession,
//  BaseDashboardStats,
//   Job,
//   UserUsageSummary,
//   UsagePayload,
// } from "@/types/user/index";
// import { ensureUserProfileExists } from "./user-service";
// import { isUserUsageSummary } from "@/types/user/index";
// import { safeSelect } from "@/lib/safeFetch";

// export class SubscriptionService {
//   // Get all subscription plans
//   static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
//     try {
//       const response = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("active", true)
//         .order("price_monthly", { ascending: true });

//       return safeSelect<SubscriptionPlan[]>(response, "subscription_plans");
//     } catch (error) {
//       console.error("Error fetching subscription plans:", error);
//       return [];
//     }
//   }
  
// static async getCurrentSubscription(
//   userId: string
// ): Promise<CurrentSubscription | null> {
//   try {
//     const { data, error } = await supabase
//       .from("user_subscriptions")
//       .select(`
//         id,
//         status,
//         billing_cycle,
//         price_paid,
//         current_period_end,
//         subscription_plans!inner (
//           name,
//           auto_scrape_enabled,
//           priority_support,
//           max_jobs_per_month,
//           max_applications_per_day,
//           max_resumes,
//           features
//         )
//       `)
//       .eq("user_id", userId)
//       .eq("status", "active")
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (error) {
//       console.error("Error fetching current subscription:", error);
//       return null;
//     }

//     if (!data || !data.subscription_plans) {
//       return null;
//     }

//     const plan = Array.isArray(data.subscription_plans) 
//       ? data.subscription_plans[0] 
//       : data.subscription_plans;

//     const subscription: CurrentSubscription = {
//       subscription_id: data.id,
//       plan_name: plan.name,
//       billing_cycle: data.billing_cycle,
//       status: data.status,
//       current_period_end: data.current_period_end,
//       max_jobs_per_month: plan.max_jobs_per_month,
//       max_resumes: plan.max_resumes,
//       max_applications_per_day: plan.max_applications_per_day,
//       auto_scrape_enabled: plan.auto_scrape_enabled,
//       priority_support: plan.priority_support,
//       features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features,
//       price_paid: data.price_paid,
//     };

//     return subscription;
//   } catch (error) {
//     console.error("getCurrentSubscription error:", error);
//     return null;
//   }
// }

//   static async getUserSubscription(
//     userId: string
//   ): Promise<UserSubscription | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_subscriptions")
//         .select(
//           `
//           *,
//           plan:subscription_plans(*)
//         `
//         )
//         .eq("user_id", userId)
//         .eq("status", "active")
//         .order("created_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (error) {
//         console.error("Error fetching user subscription:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("getUserSubscription error:", error);
//       return null;
//     }
//   }
//   static async getUserUsage(
//     userId: string,
//     monthYear?: string
//   ): Promise<UserUsage | null> {
//     try {
//       const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

//       const { data, error } = await supabase
//         .from("user_usage")
//         .select("*")
//         .eq("user_id", userId)
//         .eq("month_year", currentMonth)
//         .maybeSingle();

//       if (error) {
//         console.error("Error fetching user usage:", error);
//         return null;
//       }

//       if (!data) {
//                 return await this.initializeUserUsage(userId, currentMonth);
//       }
//       return data;
//     } catch (error) {
//       console.error("getUserUsage error:", error);
//       return {
//         id: "",
//         user_id: userId,
//         month_year: monthYear || new Date().toISOString().slice(0, 7),
//         jobs_scraped: 0,
//         applications_sent: 0,
//         resumes_uploaded: 0,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//     }
//   }
//   static async initializeUserUsage(
//     userId: string,
//     monthYear: string
//   ): Promise<UserUsage> {
//     try {
//       const { data, error } = await supabase
//         .from("user_usage")
//         .insert({
//           user_id: userId,
//           month_year: monthYear,
//           jobs_scraped: 0,
//           applications_sent: 0,
//           resumes_uploaded: 0,
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error initializing user usage:", error);
//         return {
//           id: "",
//           user_id: userId,
//           month_year: monthYear,
//           jobs_scraped: 0,
//           applications_sent: 0,
//           resumes_uploaded: 0,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         };
//       }

//       return data;
//     } catch (error) {
//       console.error("initializeUserUsage error:", error);
//       return {
//         id: "",
//         user_id: userId,
//         month_year: monthYear,
//         jobs_scraped: 0,
//         applications_sent: 0,
//         resumes_uploaded: 0,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//     }
//   }
//   static async updateUserUsage(
//     userId: string,
//     monthYear: string,
//     usage: Partial<
//       Pick<UserUsage, "jobs_scraped" | "applications_sent" | "resumes_uploaded">
//     >
//   ): Promise<UserUsage | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_usage")
//         .upsert({
//           user_id: userId,
//           month_year: monthYear,
//           ...usage,
//           updated_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error updating user usage:", error);
//         return null;
//       }
//       return data;
//     } catch (error) {
//       console.error("updateUserUsage error:", error);
//       return null;
//     }
//   }

//   static async incrementUsage(
//     userId: string,
//     type: "jobs_scraped" | "applications_sent" | "resumes_uploaded",
//     amount: number = 1
//   ): Promise<void> {
//     try {
//       const monthYear = new Date().toISOString().slice(0, 7);

//       // Get current usage or use defaults
//       let currentUsage = await this.getUserUsage(userId, monthYear);
//       if (!currentUsage) {
//         currentUsage = await this.initializeUserUsage(userId, monthYear);
//       }

//       const updatedUsage = {
//         [type]: (currentUsage[type] || 0) + amount,
//       };

//       await this.updateUserUsage(userId, monthYear, updatedUsage);
//     } catch (error) {
//       console.error("incrementUsage error:", error);
//     }
//   }

//   static async checkUsageLimits(userId: string): Promise<{
//     canScrapeJobs: boolean;
//     canSendApplications: boolean;
//     canUploadResumes: boolean;
//     limits: any;
//     usage: UserUsage | null;
//   }> {
//     try {
//       const subscription = await this.getCurrentSubscription(userId);
//       const usage = await this.getUserUsage(userId);
//       const defaultLimits = {
//         max_jobs_per_month: 50,
//         max_applications_per_day: 5,
//         max_resumes: 1,
//       };
//       if (!subscription) {
//         return {
//           canScrapeJobs:
//             (usage?.jobs_scraped || 0) < defaultLimits.max_jobs_per_month,
//           canSendApplications:
//             (usage?.applications_sent || 0) <
//             defaultLimits.max_applications_per_day,
//           canUploadResumes:
//             (usage?.resumes_uploaded || 0) < defaultLimits.max_resumes,
//           limits: defaultLimits,
//           usage,
//         };
//       }
//       const canScrapeJobs =
//         subscription.max_jobs_per_month === -1 ||
//         (usage?.jobs_scraped || 0) < (subscription.max_jobs_per_month ?? 0);

//       const canSendApplications =
//         subscription.max_applications_per_day === -1 ||
//         (usage?.applications_sent || 0) <
//           (subscription.max_applications_per_day ?? 0);

//       const canUploadResumes =
//         subscription.max_resumes === -1 ||
//         (usage?.resumes_uploaded || 0) < (subscription.max_resumes ?? 0);

//       return {
//         canScrapeJobs,
//         canSendApplications,
//         canUploadResumes,
//         limits: {
//           max_jobs_per_month: subscription.max_jobs_per_month,
//           max_applications_per_day: subscription.max_applications_per_day,
//           max_resumes: subscription.max_resumes,
//         },
//         usage,
//       };
//     } catch (error) {
//       console.error("checkUsageLimits error:", error);
//       return {
//         canScrapeJobs: true,
//         canSendApplications: true,
//         canUploadResumes: true,
//         limits: {
//           max_jobs_per_month: 50,
//           max_applications_per_day: 5,
//           max_resumes: 1,
//         },
//         usage: null,
//       };
//     }
//   }

//   static async createCheckoutSession(
//     userId: string,
//     planId: string,
//     billingCycle: "monthly" | "yearly"
//   ): Promise<StripeCheckoutSession> {
//     const response = await fetch("/api/stripe/create-checkout-session", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         userId,
//         planId,
//         billingCycle,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to create checkout session");
//     }

//     return await response.json();
//   }
//   static async cancelSubscription(subscriptionId: string): Promise<void> {
//     try {
//       const { error } = await supabase
//         .from("user_subscriptions")
//         .update({
//           status: "canceled",
//           canceled_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", subscriptionId);

//       if (error) {
//         console.error("Error canceling subscription:", error);
//         throw error;
//       }
//     } catch (error) {
//       console.error("cancelSubscription error:", error);
//       throw error;
//     }
//   }
//   static async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
//     try {
//       const response = await supabase
//         .from("payment_history")
//         .select("*")
//         .eq("user_id", userId)
//         .order("payment_date", { ascending: false });

//       return safeSelect<PaymentHistory[]>(response, "payment_history");
//     } catch (error) {
//       console.error("Error fetching payment history:", error);
//       return [];
//     }
//   }
//   static async getUsagePayload(userId: string): Promise<UsagePayload | null> {
//     try {
//       const { data: session } = await supabase.auth.getSession();
//       if (!session.session) {
//         console.error("No valid session for usage payload");
//         return null;
//       }
//       const { data: summary, error: summaryError } = await supabase
//         .from("user_usage_summary")
//         .select("*")
//         .eq("user_id", userId)
//         .maybeSingle();

//       if (summary && isUserUsageSummary(summary)) {
//         return summary;
//       }

//       if (summaryError && summaryError.code !== "PGRST116") {
//         console.warn("Usage summary fetch failed:", summaryError.message);
//       }
//       const { data: usageData, error: usageError } = await supabase
//         .from("user_usage")
//         .select("*")
//         .eq("user_id", userId)
//         .order("month_year", { ascending: false })
//         .limit(1);

//       if (usageError) {
//         console.warn("Usage data fetch failed:", usageError.message);
//         return null;
//       }

//       return usageData?.[0] ?? null;
//     } catch (error) {
//       console.error("getUsagePayload error:", error);
//       return null;
//     }
//   }
// }

// export async function getCurrentSubscription(
//   userId: string
// ): Promise<CurrentSubscription | null> {
//   try {
//     const { data, error } = await supabase.rpc(
//       "get_user_current_subscription",
//       {   p_user_id: userId
//  }
//     );

//     if (error) {
//       console.error("Error fetching current subscription:", error);
//       return null;
//     }

//     return data?.[0] || null;
//   } catch (error) {
//     console.error("getCurrentSubscription error:", error);
//     return null;
//   }
// }

// export async function updateUserProfile(
//   userId: string,
//   updates: Partial<EnhancedUserProfile>
// ): Promise<EnhancedUserProfile | null> {
//   try {
//     const { data, error } = await supabase
//       .from("user_profiles")
//       .update({
//         ...updates,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", userId)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error updating user profile:", error);
//       return null;
//     }

//     return data;
//   } catch (error) {
//     console.error("updateUserProfile error:", error);
//     return null;
//   }
// }
// export async function getUsagePayload(
//   userId: string
// ): Promise<UsagePayload | null> {
//   try {
//     const { data: session } = await supabase.auth.getSession();
//     if (!session.session) {
//       console.error("No valid session for usage payload");
//       return null;
//     }
// const { data: summary, error: summaryError } = await supabase
//       .from("user_usage_summary")
//       .select("*")
//       .eq("user_id", userId)
//       .maybeSingle();

//     if (summary && isUserUsageSummary(summary)) {
//       return summary;
//     }

//     if (summaryError && summaryError.code !== "PGRST116") {
//       console.warn("Usage summary fetch failed:", summaryError.message);
//     }
//   const { data: usageData, error: usageError } = await supabase
//       .from("user_usage")
//       .select("*")
//       .eq("user_id", userId)
//       .order("month_year", { ascending: false })
//       .limit(1);

//     if (usageError) {
//       console.warn("Usage data fetch failed:", usageError.message);
//       return null;
//     }

//     return usageData?.[0] ?? null;
//   } catch (error) {
//     console.error("getUsagePayload error:", error);
//     return null;
//   }
// }

// import { AuthUser } from "@/types/user/index";

// export async function SubscriptionBundleService(user: AuthUser) {
//   if (!user?.id) {
//     console.error("Invalid user provided to SubscriptionBundleService");
//     return null;
//   }

//   try {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session?.user) {
//       console.error("No user session found");
//       return null;
//     }

//     // Update user profile with last seen
//     const updates = { lastSeen: new Date().toISOString() };
//     await updateUserProfile(user.id, updates as Partial<EnhancedUserProfile>);

//     const userId = user.id;

//     // Use Promise.allSettled to handle individual failures gracefully
//     const results = await Promise.allSettled([
//       SubscriptionService.getSubscriptionPlans(),
//       SubscriptionService.getCurrentSubscription(userId),
//       SubscriptionService.getUserSubscription(userId),
//       SubscriptionService.getUserUsage(userId),
//       SubscriptionService.getUsagePayload(userId),
//       SubscriptionService.getPaymentHistory(userId),
//       SubscriptionService.checkUsageLimits(userId),
//     ]);

//     // Extract results, using defaults for failed promises
//     const [
//       plansResult,
//       currentSubscriptionResult,
//       userSubscriptionResult,
//       usageResult,
//       usagePayloadResult,
//       paymentHistoryResult,
//       usageLimitsResult,
//     ] = results;

//     return {
//       user,
//       plans: plansResult.status === "fulfilled" ? plansResult.value : [],
//       currentSubscription:
//         currentSubscriptionResult.status === "fulfilled"
//           ? currentSubscriptionResult.value
//           : null,
//       userSubscription:
//         userSubscriptionResult.status === "fulfilled"
//           ? userSubscriptionResult.value
//           : null,
//       usage: usageResult.status === "fulfilled" ? usageResult.value : null,
//       usagePayload:
//         usagePayloadResult.status === "fulfilled"
//           ? usagePayloadResult.value
//           : null,
//       paymentHistory:
//         paymentHistoryResult.status === "fulfilled"
//           ? paymentHistoryResult.value
//           : [],
//       usageLimits:
//         usageLimitsResult.status === "fulfilled"
//           ? usageLimitsResult.value
//           : {
//               canScrapeJobs: true,
//               canSendApplications: true,
//               canUploadResumes: true,
//               limits: {
//                 max_jobs_per_month: 50,
//                 max_applications_per_day: 5,
//                 max_resumes: 1,
//               },
//               usage: null,
//             },
//     };
//   } catch (error) {
//     console.error("SubscriptionBundleService error:", error);
//     return null;
//   }
// }
