import { UserUsage } from "@/types/user/usage";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  max_jobs_per_month?: number;
  max_resumes?: number;
  max_applications_per_day?: number;
  auto_scrape_enabled: boolean;
  priority_support: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  price?: number;
  popular?: boolean;
}
export type StripeCheckoutMetadata = {
  user_id: string;
  plan_id: string;
  referral_code?: string;
  campaign?: string;
  [key: string]: string | undefined; // allows for custom keys
};
export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_date?: string;
  created_at?: string;
}
export interface StripeCheckoutSession {
  url: string;
  session_id: string;
  success?: boolean;
  error?: string;
}

export interface SubscriptionLimits {
  jobs_per_month: number;
  resumes: number;
  applications_per_day: number;
  auto_scrape_enabled: boolean;
  priority_support: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  price_paid?: number;
  created_at?: string;
  updated_at?: string;
  canceled_at?: string;
  plan?: SubscriptionPlan;
}



export interface CurrentSubscription {
  subscription_id: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_end: string;
  max_jobs_per_month?: number;
  max_resumes?: number;
  max_applications_per_day?: number;
  auto_scrape_enabled?: boolean;
  priority_support?: boolean;
  features?: string;
price_paid?: number;
}

export interface PaymentRecord {
  amount: number;
  payment_date: string;
  status: string;
}


export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "unpaid";
export type BillingCycle = "monthly" | "yearly";
export type PaymentStatus = "succeeded" | "failed" | "pending" | "canceled";

