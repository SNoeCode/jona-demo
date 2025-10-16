// client/src/types/admin/admin_subscription.ts

export interface AdminSubscriptionData {
  user_id: string;
  user_name: string;
  user_email: string;
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'active' | 'canceled' | 'expired' | 'past_due' | 'unpaid';
    billing_cycle: 'monthly' | 'yearly';
    price_paid: number | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    created_at: string;
    updated_at: string;
    plan: {
      id: string;
      name: string;
      description: string | null;
      price_monthly: number;
      price_yearly: number;
      features: any;
      max_jobs_per_month: number;
      max_resumes: number;
      max_applications_per_day: number;
      auto_scrape_enabled: boolean;
      priority_support: boolean;
      active: boolean;
    } | null;
  };
  total_paid: number;
  last_payment_date: string | null;
  usage: Array<{
    id: string;
    user_id: string;
    month_year: string;
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
    created_at: string;
    updated_at: string;
  }>;
  payment_history: Array<{
    amount: number;
    created_at: string;
    status: string;
  }>;
}

export interface AdminSubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  payment_history: Array<{
    amount: number;
    created_at: string;
    status?: string;
  }>;
  planDistribution: {
    free: number;
    pro: number;
    enterprise: number;
  };
}