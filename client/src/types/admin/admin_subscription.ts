import { PaymentRecord, SubscriptionPlan, UserUsage } from "@/types/user/index";


export interface AdminSubscriptionStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  planDistribution: {
    free: number;
    pro: number;
    enterprise: number;
    [key: string]: number;
  },
      payment_history: Payment[];
}


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
    created_at: string;
    canceled_at: string | null;
      payment_history?: PaymentRecord[];

    current_period_start: string;
    current_period_end: string;
    stripe_subscription_id: string | null;
    plan: SubscriptionPlan | null;
  };
  total_paid: number;
  last_payment_date: string | null;
  usage: UserUsage[];
    payment_history: Payment[];
}
export interface Payment {
  amount: number;
  payment_date: string;
  status: string;
}