
import { z } from "zod";
export const ParsedFeatureFlagsSchema = z.record(z.boolean());


export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price_monthly: z.number(),
  price_yearly: z.number(),
  currency: z.string(),
  trial_days: z.number(),
  max_jobs_per_month: z.number(),
  max_resumes: z.number(),
  max_applications_per_day: z.number(),
  auto_scrape_enabled: z.boolean(),
  priority_support: z.boolean(),
  api_access: z.boolean(),
  export_enabled: z.boolean(),
  features: z.record(z.boolean()),
  active: z.boolean(),
  popular: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  stripe_price_id_monthly: z.string().optional(),
  stripe_price_id_yearly: z.string().optional()
});
export const CurrentSubscriptionSchema = z.object({
  id: z.string(),
  subscription_id: z.string(),
  user_id: z.string(),
  plan_id: z.string(),
  plan_name: z.string(),
  status: z.enum(["active", "canceled", "expired", "past_due", "unpaid"]),
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  trial_start: z.string().nullable().optional(),
  trial_end: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  canceled_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  max_jobs_per_month: z.number(),
  max_resumes: z.number(),
  max_applications_per_day: z.number(),
  auto_scrape_enabled: z.boolean(),
  priority_support: z.boolean(),
  billing_cycle: z.enum(["monthly", "yearly", "lifetime"]),
   stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  currency: z.string().optional(),
  price_paid: z.number(),
  current_subscription: z.string(),
//   features: z.record(z.boolean()),
//   plan: z.any()
  plan: SubscriptionPlanSchema.optional(),
  features: ParsedFeatureFlagsSchema.optional()

});

