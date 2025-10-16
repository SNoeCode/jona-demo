
// ===== METRICS TYPES =====
export interface AdminMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth_rate: number;
  };
  users: {
    total: number;
    active: number;
    new_this_month: number;
  };
  subscriptions: {
    active: number;
    canceled: number;
    churn_rate: number;
  };
  jobs: {
    total: number;
    applied: number;
    success_rate: number;
  };
}