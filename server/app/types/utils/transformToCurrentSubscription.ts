// import { SubscriptionPlanSchema } from "@/lib/validation/subscription";
// import { CurrentSubscription, SubscriptionPlan } from "@/types/subscription";

// export function transformToCurrentSubscription(
//   data: any,
//   plan: SubscriptionPlan | undefined
// ): CurrentSubscription {
//   if (!plan) {
//     throw new Error(`Missing plan for subscription ${data.id}`);
//   }

//   const validatedPlan = SubscriptionPlanSchema.parse(plan);

//   return {
//     id: data.id,
//     subscription_id: data.id,
//     user_id: data.user_id,
//     plan_id: data.plan_id,
//     plan_name: validatedPlan.name,
//     status: data.status,
//     billing_cycle: data.billing_cycle,
//     current_period_start: data.current_period_start ?? null,
//     current_period_end: data.current_period_end ?? null,
//     trial_start: data.trial_start ?? null,
//     trial_end: data.trial_end ?? null,
//     started_at: data.started_at ?? data.created_at,
//     canceled_at: data.canceled_at ?? null,
//     expires_at: data.current_period_end ?? null,
//     currency: data.currency ?? validatedPlan.currency,
//     price_paid: data.price_paid ?? validatedPlan.price_monthly,
//     max_jobs_per_month: validatedPlan.max_jobs_per_month,
//     max_resumes: validatedPlan.max_resumes,
//     max_applications_per_day: validatedPlan.max_applications_per_day,
//     auto_scrape_enabled: validatedPlan.auto_scrape_enabled,
//     priority_support: validatedPlan.priority_support,
//     stripe_subscription_id: data.stripe_subscription_id,
//     stripe_customer_id: data.stripe_customer_id,
//     created_at: data.created_at,
//     updated_at: data.updated_at,
//     plan: validatedPlan,
//     features: validatedPlan.features ?? {}
//   };
// }

// import { CurrentSubscription, SubscriptionPlan } from "@/types/subscription";
// import { SubscriptionPlanSchema } from "@/lib/validation/subscription";
// export function transformToCurrentSubscription(
//   data: any,
//   plan: SubscriptionPlan | undefined
// ): CurrentSubscription {
//   if (!plan) {
//     throw new Error(`Missing plan for subscription ${data.id}`);
//   }

//   const validatedPlan = SubscriptionPlanSchema.parse(plan);



//   return {
//     id: data.id,
//     subscription_id: data.id,
//     user_id: data.user_id,
//     plan_id: data.plan_id,
//     plan_name: validatedPlan.name,
//     status: data.status,
//     billing_cycle: data.billing_cycle,
//     current_period_start: data.current_period_start ?? null,
//     current_period_end: data.current_period_end ?? null,
//     trial_start: data.trial_start ?? null,
//     trial_end: data.trial_end ?? null,
//     started_at: data.started_at ?? data.created_at,
//     canceled_at: data.canceled_at ?? null,
//     expires_at: data.current_period_end ?? null,
//     currency: data.currency ?? validatedPlan.currency,
//     price_paid: data.price_paid ?? validatedPlan.price_monthly,
//     max_jobs_per_month: validatedPlan.max_jobs_per_month,
//     max_resumes: validatedPlan.max_resumes,
//     max_applications_per_day: validatedPlan.max_applications_per_day,
//     auto_scrape_enabled: validatedPlan.auto_scrape_enabled,
//     priority_support: validatedPlan.priority_support,
//     stripe_subscription_id: data.stripe_subscription_id,
//     stripe_customer_id: data.stripe_customer_id,
//     created_at: data.created_at,
//     updated_at: data.updated_at,
//     plan: validatedPlan,
//     features: validatedPlan.features

//   };
// }