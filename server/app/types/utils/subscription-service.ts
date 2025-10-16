
// // utils/subscription-service.ts
// import { supabase } from "@/lib/supabaseClient";
// import type {
//   CurrentSubscription,
//   StripeCheckoutSession,
//   SubscriptionPlan

// } from "@/types/index";
// import { SubscriptionPlanSchema } from "@/lib/validation/subscription";
// export interface CreateSubscriptionPayload {
//   userId: string;
//   planId: string;
//   billingCycle: "monthly" | "yearly" | "lifetime";
//   priceOverride?: number;
//   trialDays?: number;
// }
//  interface SubscriptionData {
//   id: string;
//   user_id: string;
//   plan_id: string;
//   status: string;
//   billing_cycle: string;
//   price_paid: number | null;
//   currency: string;
//   current_period_start: string | null;
//   current_period_end: string | null;
//   trial_start: string | null;
//   trial_end: string | null;
//   started_at: string;
//   created_at: string;
//   updated_at: string;
//   canceled_at?: string | null;
// }

// export class SubscriptionService {
//   /**
//    * Create a new subscription for a user
//    */
//   static async createSubscription(
//     payload: CreateSubscriptionPayload
//   ): Promise<SubscriptionData> {
//     try {
//       const { userId, planId, billingCycle, priceOverride, trialDays } =
//         payload;

//       // First, get the subscription plan details
//       const { data: planData, error: planError } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("id", planId)
//         .eq("active", true)
//         .single();

//       if (planError || !planData) {
//         throw new Error(`Subscription plan not found: ${planId}`);
//       }

//       // Calculate price based on billing cycle
//       const price: number =
//         priceOverride ??
//         (billingCycle === "yearly"
//           ? planData.price_yearly
//           : planData.price_monthly) ??
//         0;

//       // Calculate period dates
//       const now = new Date();
//       const trialDuration = trialDays || planData.trial_days || 0;

//       let trialStart: Date | null = null;
//       let trialEnd: Date | null = null;
//       let currentPeriodStart: Date | null = null;
//       let currentPeriodEnd: Date | null = null;
//       let status = "active";

//       if (trialDuration > 0) {
//         trialStart = now;
//         trialEnd = new Date(
//           now.getTime() + trialDuration * 24 * 60 * 60 * 1000
//         );
//         status = "trialing";
//         currentPeriodStart = trialStart;
//         currentPeriodEnd = trialEnd;
//       } else if (price > 0) {
//         // For paid plans without trial, set the current period
//         currentPeriodStart = now;
//         if (billingCycle === "yearly") {
//           currentPeriodEnd = new Date(
//             now.getTime() + 365 * 24 * 60 * 60 * 1000
//           );
//         } else {
//           currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
//         }
//       }

//       // Check if user already has an active subscription
//       const { data: existingSubscription } = await supabase
//         .from("user_subscriptions")
//         .select("id, status")
//         .eq("user_id", userId)
//         .in("status", ["active", "trialing", "past_due"])
//         .single();

//       if (existingSubscription) {
//         // Cancel existing subscription first
//         await supabase
//           .from("user_subscriptions")
//           .update({
//             status: "canceled",
//             canceled_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .eq("id", existingSubscription.id);
//       }

//       // Create the subscription record
//       const subscriptionData = {
//         user_id: userId,
//         plan_id: planId,
//         status,
//         billing_cycle: billingCycle,
//         price_paid: price,
//         currency: "USD",
//         current_period_start: currentPeriodStart?.toISOString() || null,
//         current_period_end: currentPeriodEnd?.toISOString() || null,
//         trial_start: trialStart?.toISOString() || null,
//         trial_end: trialEnd?.toISOString() || null,
//         started_at: now.toISOString(),
//         created_at: now.toISOString(),
//         updated_at: now.toISOString(),
//       };

//       const { data: subscription, error: subscriptionError } = await supabase
//         .from("user_subscriptions")
//         .insert([subscriptionData])
//         .select()
//         .single();

//       if (subscriptionError) {
//         throw new Error(
//           `Failed to create subscription: ${subscriptionError.message}`
//         );
//       }

//       // Initialize usage tracking for the current month
//       await this.initializeUsageTracking(userId, subscription.id);

//       console.log("✅ Subscription created successfully:", subscription.id);
//       return subscription;
//     } catch (error) {
//       console.error("❌ Subscription creation failed:", error);
//       throw error;
//     }
//   }


//   private static async initializeUsageTracking(
//     userId: string,
//     subscriptionId: string
//   ): Promise<void> {
//     try {
//       const now = new Date();
//       const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//       const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//       const monthYear = `${now.getFullYear()}-${String(
//         now.getMonth() + 1
//       ).padStart(2, "0")}`;

//       const usageData = {
//         user_id: userId,
//         subscription_id: subscriptionId,
//         period_start: monthStart.toISOString(),
//         period_end: monthEnd.toISOString(),
//         month_year: monthYear,
//         jobs_scraped: 0,
//         applications_sent: 0,
//         applications_submitted: 0,
//         resumes_uploaded: 0,
//         api_calls: 0,
//         exports_generated: 0,
//         total_search_time_minutes: 0,
//         successful_job_matches: 0,
//         daily_limit_exceeded_count: 0,
//         monthly_limit_exceeded_count: 0,
//         created_at: now.toISOString(),
//         updated_at: now.toISOString(),
//       };

//       const { error: usageError } = await supabase
//         .from("user_usage")
//         .upsert([usageData], {
//           onConflict: "user_id, month_year",
//           ignoreDuplicates: false,
//         });

//       if (usageError) {
//         console.warn("Failed to initialize usage tracking:", usageError);
//       }
//     } catch (error) {
//       console.error("Usage tracking initialization failed:", error);
//     }
//   }

//   /**
//    * Get current active subscription for a user
//    */
//   static async getCurrentSubscription(
//     userId: string
//   ): Promise<CurrentSubscription | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_subscriptions")
//         .select(
//           `
//           *,
//           subscription_plans!inner(*)
//         `
//         )
//         .eq("user_id", userId)
//         .in("status", ["active", "trialing", "past_due"])
//         .order("created_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (error) {
//         console.error("Error fetching current subscription:", error);
//         return null;
//       }

//       if (!data) return null;

//       // Transform to CurrentSubscription format
//       const plan = data.subscription_plans;
// return {
//   id: data.id,
//   subscription_id: data.id,
//   user_id: data.user_id,
//   plan_id: data.plan_id,
//   plan_name: plan.name,
//   status: data.status,
//   current_period_start: data.current_period_start,
//   current_period_end: data.current_period_end,
//   trial_start: data.trial_start ?? null,
//   trial_end: data.trial_end ?? null,
//   started_at: data.started_at ?? null,
//   canceled_at: data.canceled_at ?? null,
//   expires_at: data.current_period_end ?? null,
//   created_at: data.created_at ?? null,
//   updated_at: data.updated_at ?? null,
//   max_jobs_per_month: plan.max_jobs_per_month,
//   max_resumes: plan.max_resumes,
//   max_applications_per_day: plan.max_applications_per_day,
//   auto_scrape_enabled: plan.auto_scrape_enabled,
//   priority_support: plan.priority_support,
//   billing_cycle: data.billing_cycle,
//   currency: data.currency ?? plan.currency,
//   price_paid: data.price_paid ?? plan.price_monthly,
//   plan: SubscriptionPlanSchema.parse(plan),
//   features: plan.features
// };    } catch (error) {
//       console.error("getCurrentSubscription error:", error);
//       return null;
//     }
//   }

//   /**
//    * Get user subscription details
//    */
//   static async getUserSubscription(
//     userId: string
//   ): Promise<SubscriptionData | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_subscriptions")
//         .select("*")
//         .eq("user_id", userId)
//         .in("status", ["active", "trialing", "past_due"])
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

  
//   static async getSubscriptionPlans(): Promise<any[]> {
//     try {
//       const { data, error } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("active", true)
//         .order("price_monthly", { ascending: true });

//       if (error) {
//         console.error("Error fetching subscription plans:", error);
//         return [];
//       }

//       return data || [];
//     } catch (error) {
//       console.error("getSubscriptionPlans error:", error);
//       return [];
//     }
//   }

//   /**
//    * Update subscription status
//    */
//   static async updateSubscriptionStatus(
//     subscriptionId: string,
//     status: string,
//     additionalData?: Partial<SubscriptionData>
//   ): Promise<boolean> {
//     try {
//       const updateData = {
//         status,
//         updated_at: new Date().toISOString(),
//         ...additionalData,
//       };

//       if (status === "canceled") {
//         updateData.canceled_at = new Date().toISOString();
//       }

//       const { error } = await supabase
//         .from("user_subscriptions")
//         .update(updateData)
//         .eq("id", subscriptionId);

//       if (error) {
//         console.error("Error updating subscription status:", error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error("updateSubscriptionStatus error:", error);
//       return false;
//     }
//   }
// static async getPlans(): Promise<SubscriptionPlan[]> {
//   const { data, error } = await supabase
//     .from("subscription_plans")
//     .select("*")
//     .eq("active", true)
//     .order("price_monthly", { ascending: true });

//   if (error || !data) {
//     throw new Error("Failed to fetch subscription plans");
//   }

//   return data;
// }
//   static async hasActiveSubscription(userId: string): Promise<boolean> {
//     try {
//       const subscription = await this.getCurrentSubscription(userId);
//       return (
//         subscription !== null &&
//         ["active", "trialing"].includes(subscription.status)
//       );
//     } catch (error) {
//       console.error("hasActiveSubscription error:", error);
//       return false;
//     }
//   }


//   static async getSubscriptionLimits(userId: string): Promise<{
//     max_jobs_per_month: number;
//     max_resumes: number;
//     max_applications_per_day: number;
//     auto_scrape_enabled: boolean;
//     priority_support: boolean;
//     // api_access: boolean;
//     // export_enabled: boolean;
//   }> {
//     try {
//       const subscription = await this.getCurrentSubscription(userId);

//       if (!subscription) {
//         // Return free plan limits
//         return {
//           max_jobs_per_month: 10,
//           max_resumes: 1,
//           max_applications_per_day: 5,
//           auto_scrape_enabled: false,
//           priority_support: false,
//           // api_access: false,
//           // export_enabled: false,
//         };
//       }

//       return {
//         max_jobs_per_month: subscription.max_jobs_per_month,
//         max_resumes: subscription.max_resumes,
//         max_applications_per_day: subscription.max_applications_per_day,
//         auto_scrape_enabled: subscription.auto_scrape_enabled,
//         priority_support: subscription.priority_support,
//         // api_access: subscription.features?.api_access || false,
//         // export_enabled: subscription.features?.export_enabled || false,
//       };
//     } catch (error) {
//       console.error("getSubscriptionLimits error:", error);
//       // Return safe defaults
//       return {
//         max_jobs_per_month: 10,
//         max_resumes: 1,
//         max_applications_per_day: 5,
//         auto_scrape_enabled: false,
//         priority_support: false,
//         // api_access: false,
//         // export_enabled: false,
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

//   static async checkSubscriptionExpiry(userId: string): Promise<{
//     isExpired: boolean;
//     expiresIn: number; // days
//     subscription: CurrentSubscription | null;
//   }> {
//     try {
//       const subscription = await this.getCurrentSubscription(userId);

//       if (!subscription || !subscription.current_period_end) {
//         return {
//           isExpired: false,
//           expiresIn: 0,
//           subscription,
//         };
//       }

//       const now = new Date();
//       const expiryDate = new Date(subscription.current_period_end);
//       const diffTime = expiryDate.getTime() - now.getTime();
//       const expiresIn = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//       return {
//         isExpired: expiresIn <= 0,
//         expiresIn,
//         subscription,
//       };
//     } catch (error) {
//       console.error("checkSubscriptionExpiry error:", error);
//       return {
//         isExpired: false,
//         expiresIn: 0,
//         subscription: null,
//       };
//     }
//   }
// }

// // Types for CurrentSubscription (if not already defined)
// // export interface CurrentSubscription {
// //   id: string;
// //   subscription_id: string;
// //   plan_name: string;
// //   status: string;
// //   current_period_start: string | null;
// //   current_period_end: string | null;
// //   max_jobs_per_month: number;
// //   max_resumes: number;
// //   max_applications_per_day: number;
// //   auto_scrape_enabled: boolean;
// //   priority_support: boolean;
// //   billing_cycle: string;
// //   price_paid: number | null;
// //   features: any;
// // }
