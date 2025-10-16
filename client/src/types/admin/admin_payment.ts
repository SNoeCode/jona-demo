export type AdminPaymentRecord = {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  subscription_id: string;
  plan_name?: string;
  billing_cycle?: "monthly" | "yearly";
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending" | "canceled";
  stripe_payment_intent_id?: string;
  payment_date?: string;
  created_at?: string;
};



