// lib/services/admin-services/subscription.ts - Fixed admin service
"use server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type {
  AdminSubscriptionData,
  AdminSubscriptionStats,
} from "@/types/admin/admin_subscription";
import { getAdminBaseURL } from "@/services/base";

// Define proper subscription status type that matches your database
type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "unpaid";

// Define explicit types for database queries
interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: string;
  price_paid?: number | null;
  created_at: string;
  canceled_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  stripe_subscription_id?: string | null;
  plan?: {
    id: string;
    name: string;
    description?: string;
    price_monthly?: number;
    price_yearly?: number;
    features?: string;
    max_jobs_per_month?: number;
    max_resumes?: number;
    max_applications_per_day?: number;
    auto_scrape_enabled?: boolean;
    priority_support?: boolean;
    active: boolean;
  } | null;
  user_profiles?: {
    full_name?: string;
    email?: string;
  } | null;
  payment_history?: Array<{
    amount: number;
    payment_date: string;
    status: string;
  }> | null;
  user_usage?: Array<{
    id: string;
    user_id: string;
    month_year: string;
    jobs_scraped: number;
    applications_sent: number;
    applications_submitted: number;
    resumes_uploaded: number;
  }> | null;
}

interface SubscriptionUpdate {
  status: SubscriptionStatus;
  canceled_at: string;
  updated_at?: string;
}

interface PaymentInsert {
  subscription_id: string;
  amount: number;
  status: string;
  payment_date: string;
  transaction_type: string;
}

export async function getAllSubscriptions(): Promise<AdminSubscriptionData[]> {
  const supabaseAdmin = await getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
.from("user_subscriptions")
.select(`
  *,
  pplan:subscription_plans!user_subscriptions_plan_id_fkey(*),
  user_profiles:user_subscriptions_user_id_fkey(full_name,email),
  payment_history(amount, payment_date, status),
  user_usage(id, user_id, month_year, jobs_scraped, applications_sent, applications_submitted, resumes_uploaded)
`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching all subscriptions:", error);
      throw error;
    }

    return (data || []).map(
      (sub: UserSubscription): AdminSubscriptionData => ({
        user_id: sub.user_id,
        user_name: sub.user_profiles?.full_name || "Unknown",
        user_email: sub.user_profiles?.email || "Unknown",

        subscription: {
          id: sub.id,
          user_id: sub.user_id,
          plan_id: sub.plan?.id ?? "",
          status: sub.status,
          billing_cycle: sub.billing_cycle as "monthly" | "yearly",
          price_paid: sub.price_paid ?? null,
          created_at: sub.created_at,
          canceled_at: sub.canceled_at ?? null,
          current_period_start: sub.current_period_start ?? "",
          current_period_end: sub.current_period_end ?? "",
          stripe_subscription_id: sub.stripe_subscription_id ?? null,
          plan: sub.plan
            ? {
                id: sub.plan.id,
                name: sub.plan.name,
                description: sub.plan.description ?? "",
                price_monthly: sub.plan.price_monthly ?? 0,
                price_yearly: sub.plan.price_yearly ?? 0,
                features:
                  sub.plan.features?.split(",").map((f) => f.trim()) ?? [],
                max_jobs_per_month: sub.plan.max_jobs_per_month ?? 0,
                max_resumes: sub.plan.max_resumes ?? 0,
                max_applications_per_day:
                  sub.plan.max_applications_per_day ?? 0,
                auto_scrape_enabled: sub.plan.auto_scrape_enabled ?? false,
                priority_support: sub.plan.priority_support ?? false,
                active: sub.plan.active,
                price: sub.plan.price_monthly ?? 0,
              }
            : null,
        },

        total_paid:
          sub.payment_history?.reduce(
            (sum, payment) =>
              payment.status === "succeeded" ? sum + payment.amount : sum,
            0
          ) || 0,

        last_payment_date: sub.payment_history
          ? [...sub.payment_history].sort((a, b) =>
              b.payment_date.localeCompare(a.payment_date)
            )[0]?.payment_date ?? null
          : null,

        usage: (sub.user_usage || []).map((usage) => ({
          id: usage.id,
          user_id: usage.user_id,
          month_year: usage.month_year,
          jobs_scraped: usage.jobs_scraped,
          applications_sent: usage.applications_sent,
          applications_submitted: usage.applications_submitted,
          resumes_uploaded: usage.resumes_uploaded,
        })),

        // This is the missing property that fixes the TypeScript error
        payment_history: sub.payment_history ?? [],
      })
    );
  } catch (error) {
    console.error("Error in getAllSubscriptions:", error);
    throw error;
  }
}

export async function getSubscriptionStats(): Promise<AdminSubscriptionStats> {
  try {
    // Try API endpoint first
    const baseURL = getAdminBaseURL();
    const response = await fetch(`${baseURL}/subscriptions/stats`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const subscriptions = await getAllSubscriptions();

  const totalRevenue = subscriptions.reduce(
    (sum, sub) => sum + sub.total_paid,
    0
  );

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.subscription.status === "active"
  ).length;

  const monthlyRecurringRevenue = subscriptions.reduce((sum, sub) => {
    const { status, billing_cycle, price_paid } = sub.subscription;
    if (status === "active") {
      const monthly =
        billing_cycle === "yearly" ? (price_paid ?? 0) / 12 : price_paid ?? 0;
      return sum + monthly;
    }
    return sum;
  }, 0);

  const thisMonthCanceled = subscriptions.filter((sub) => {
    const canceledAt = sub.subscription.canceled_at;
    if (!canceledAt) return false;
    const cancelDate = new Date(canceledAt);
    const now = new Date();
    return (
      cancelDate.getMonth() === now.getMonth() &&
      cancelDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const churnRate =
    activeSubscriptions > 0
      ? (thisMonthCanceled / activeSubscriptions) * 100
      : 0;
  // const payment_history = subscriptions.flatMap(sub => sub.subscription.plan ? sub.payment_history || [] : []);

  const averageRevenuePerUser =
    activeSubscriptions > 0 ? monthlyRecurringRevenue / activeSubscriptions : 0;

  const planDistribution: Record<string, number> = {};

  subscriptions.forEach((sub) => {
    const planName = sub.subscription.plan?.name?.toLowerCase() || "free";
    planDistribution[planName] = (planDistribution[planName] || 0) + 1;
  });
  const normalizedPlanDistribution = {
    free: planDistribution.free ?? 0,
    pro: planDistribution.pro ?? 0,
    enterprise: planDistribution.enterprise ?? 0,
    ...planDistribution,
  };

  return {
    totalRevenue,
    monthlyRecurringRevenue,
    activeSubscriptions,
    churnRate,
    averageRevenuePerUser,
    planDistribution: normalizedPlanDistribution,
    payment_history: [],
  };
}

export async function getSubscriptions(
  page = 1,
  search = "",
  status = "all",
  plan = "all"
): Promise<{
  subscriptions: AdminSubscriptionData[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    // Try API endpoint first
    const baseURL = getAdminBaseURL();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(search && { search }),
      ...(status !== "all" && { status }),
      ...(plan !== "all" && { plan }),
    });

    const response = await fetch(`${baseURL}/subscriptions?${params}`);
    if (response.ok) {
      return response.json();
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  // Fallback to direct queries
  const allSubscriptions = await getAllSubscriptions();

  let filtered = allSubscriptions;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (sub) =>
        sub.user_name?.toLowerCase().includes(searchLower) ||
        sub.user_email?.toLowerCase().includes(searchLower)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((sub) => sub.subscription.status === status);
  }

  if (plan !== "all") {
    filtered = filtered.filter(
      (sub) => sub.subscription.plan?.name?.toLowerCase() === plan.toLowerCase()
    );
  }

  const limit = 20;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    subscriptions: paginated,
    total: filtered.length,
    page,
    limit,
  };
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  try {
    // Try API endpoint first
    const baseURL = getAdminBaseURL();
    const response = await fetch(
      `${baseURL}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) return;
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  // Fallback to direct Supabase update with proper typing
  const supabaseAdmin = await getSupabaseAdmin();

  const updateData: SubscriptionUpdate = {
    status: "canceled",
    canceled_at: new Date().toISOString(),
  };

  // Cast to any to bypass type checking temporarily
  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update(updateData as any)
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error canceling subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

export async function refundSubscription(
  subscriptionId: string,
  amount: number
): Promise<void> {
  try {
    // Try API endpoint first
    const baseURL = getAdminBaseURL();
    const response = await fetch(
      `${baseURL}/subscriptions/${subscriptionId}/refund`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      }
    );
    if (response.ok) return;
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  // Fallback to direct Supabase insert with proper typing
  const supabaseAdmin = await getSupabaseAdmin();

  const refundData: PaymentInsert = {
    subscription_id: subscriptionId,
    amount: -amount, // Negative amount for refund
    status: "succeeded",
    payment_date: new Date().toISOString(),
    transaction_type: "refund",
  };

  // Cast to any to bypass type checking temporarily
  const { error } = await supabaseAdmin
    .from("payment_history")
    .insert([refundData as any]);

  if (error) {
    console.error("Error processing refund:", error);
    throw new Error("Failed to process refund");
  }
}

export async function exportSubscriptions(
  format: "csv" | "json" | "xlsx" = "csv"
): Promise<void> {
  try {
    // Try API endpoint first
    const baseURL = getAdminBaseURL();
    const response = await fetch(
      `${baseURL}/export/subscriptions?format=${format}`
    );
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscriptions_export_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }
  } catch {
    console.warn("API endpoint unavailable, falling back to CSV generation");
  }

  // Fallback to client-side CSV generation
  const subscriptions = await getAllSubscriptions();
  const headers = [
    "User ID",
    "User Name",
    "User Email",
    "Plan Name",
    "Status",
    "Billing Cycle",
    "Price Paid",
    "Total Paid",
    "Created At",
    "Canceled At",
    "Current Period End",
    "Stripe ID",
  ];

  const rows = subscriptions.map((sub) => [
    sub.user_id,
    sub.user_name,
    sub.user_email,
    sub.subscription.plan?.name || "Unknown",
    sub.subscription.status,
    sub.subscription.price_paid?.toString() || "0",
    sub.total_paid.toString(),
    sub.subscription.created_at || "",
    sub.subscription.canceled_at || "",
    sub.subscription.current_period_end || "",
    sub.subscription.stripe_subscription_id || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((field) => `"${field?.toString().replace(/"/g, '""') || ""}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscriptions_export_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function getSubscriptionOverview(): Promise<{
  subscriptions: AdminSubscriptionData[];
  stats: AdminSubscriptionStats;
}> {
  const subscriptions = await getAllSubscriptions();
  const stats = await getSubscriptionStats();
  return { subscriptions, stats };
}

// "use server";

// import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// import { getAdminBaseURL } from "@/app/api/admin/base";
// import type {
//   AdminSubscriptionData,
//   AdminSubscriptionStats,
// } from "@/types/admin";
// import { transformToCurrentSubscription } from "@/utils/transformToCurrentSubscription";

// export async function getAllSubscriptions(): Promise<AdminSubscriptionData[]> {
//   const supabaseAdmin = await getSupabaseAdmin();

//   const { data, error } = await supabaseAdmin
//     .from("user_subscriptions")
//     .select(`
//       *,
//       plan:subscription_plans(*),
//       user_profiles!user_subscriptions_user_id_fkey(full_name, email),
//       payment_history!payment_history_subscription_id_fkey(amount, status, payment_date),
//       user_usage(month_year, jobs_scraped, applications_sent, resumes_uploaded)
//     `)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching all subscriptions:", error);
//     throw error;
//   }
// return (data || []).map((sub: any) => {
//   if (!sub.plan) {
//     throw new Error(`Missing plan for subscription ${sub.id}`);
//   }

//   const subscription = transformToCurrentSubscription(sub, sub.plan);

//   return {
//     user_id: sub.user_id,
//     user_name: sub.user_profiles?.full_name ?? "Unknown",
//     user_email: sub.user_profiles?.email ?? "Unknown",
//     subscription, // ✅ Now guaranteed to include a valid plan
//     total_paid: sub.total_paid ?? 0,
//     last_payment_date: sub.last_payment_date ?? null,
//     usage: sub.user_usage ?? [],
//     payment_history: Array.isArray(sub.payment_history)
//       ? [...sub.payment_history].sort(
//           (a, b) =>
//             new Date(b.payment_date).getTime() -
//             new Date(a.payment_date).getTime()
//         )
//       : []
//   };
// });
// }
// export async function getSubscriptionStats(): Promise<AdminSubscriptionStats> {
//   const subscriptions = await getAllSubscriptions();

//   const totalRevenue = subscriptions.reduce(
//     (sum, sub) => sum + sub.total_paid,
//     0
//   );

//   const activeSubscriptions = subscriptions.filter(
//     (sub) => sub.subscription.status === "active"
//   ).length;

//   const monthlyRecurringRevenue = subscriptions.reduce((sum, sub) => {
//     const { status, billing_cycle, price_paid } = sub.subscription;
//     if (status === "active") {
//       const monthly =
//         billing_cycle === "yearly"
//           ? (price_paid ?? 0) / 12
//           : price_paid ?? 0;
//       return sum + monthly;
//     }
//     return sum;
//   }, 0);

//   const thisMonthCanceled = subscriptions.filter((sub) => {
//     const canceledAt = sub.subscription.canceled_at;
//     return (
//       canceledAt &&
//       new Date(canceledAt).getMonth() === new Date().getMonth()
//     );
//   }).length;

//   const churnRate =
//     activeSubscriptions > 0
//       ? (thisMonthCanceled / activeSubscriptions) * 100
//       : 0;

//   const averageRevenuePerUser =
//     activeSubscriptions > 0
//       ? monthlyRecurringRevenue / activeSubscriptions
//       : 0;

//   const planDistribution: Record<string, number> = {};
//   subscriptions.forEach((sub) => {
//     const planName = sub.subscription.plan?.name?.toLowerCase() ?? "unknown";
//     planDistribution[planName] = (planDistribution[planName] || 0) + 1;
//   });

//   return {
//     totalRevenue,
//     monthlyRecurringRevenue,
//     activeSubscriptions,
//     churnRate,
//     averageRevenuePerUser,
//     planDistribution,
//   };
// }

// export async function getSubscriptionOverview(): Promise<{
//   subscriptions: AdminSubscriptionData[];
//   stats: AdminSubscriptionStats;
// }> {
//   const subscriptions = await getAllSubscriptions();
//   const stats = await getSubscriptionStats();
//   return { subscriptions, stats };
// }

// export async function getSubscriptions(
//   page = 1,
//   search = "",
//   status = "all",
//   plan = "all"
// ): Promise<{
//   subscriptions: AdminSubscriptionData[];
//   total: number;
//   page: number;
//   limit: number;
// }> {
//   try {
//     const params = new URLSearchParams({
//       page: page.toString(),
//       limit: "20",
//       ...(search && { search }),
//       ...(status !== "all" && { status }),
//       ...(plan !== "all" && { plan }),
//     });

//     const response = await fetch(
//       `${getAdminBaseURL()}/subscriptions?${params}`
//     );
//     if (response.ok) {
//       return response.json();
//     }
//   } catch {
//     console.warn("API endpoint unavailable, falling back to direct DB queries");
//   }

//   const allSubscriptions = await getAllSubscriptions();

//   let filtered = allSubscriptions;
//   if (search) {
//     filtered = filtered.filter(
//       (sub) =>
//         sub.user_name?.toLowerCase().includes(search.toLowerCase()) ||
//         sub.user_email?.toLowerCase().includes(search.toLowerCase())
//     );
//   }
//   if (status !== "all") {
//     filtered = filtered.filter(
//       (sub) => sub.subscription.status === status
//     );
//   }
//   if (plan !== "all") {
//     filtered = filtered.filter(
//       (sub) =>
//         sub.subscription.plan?.name?.toLowerCase() === plan.toLowerCase()
//     );
//   }

//   const limit = 20;
//   const offset = (page - 1) * limit;
//   const paginated = filtered.slice(offset, offset + limit);

//   return {
//     subscriptions: paginated,
//     total: filtered.length,
//     page,
//     limit,
//   };
// }
// export async function cancelSubscription(subscriptionId: string): Promise<void> {
//   try {
//     const response = await fetch(
//       `${getAdminBaseURL()}/subscriptions/${subscriptionId}/cancel`,
//       { method: "POST" }
//     );
//     if (response.ok) return;
//   } catch {
//     console.warn("API endpoint unavailable, falling back to direct DB queries");
//   }

//   const supabaseAdmin = await getSupabaseAdmin();
//   const { error } = await supabaseAdmin
//     .from("user_subscriptions")
//     .update({
//       status: "canceled",
//       canceled_at: new Date().toISOString(),
//     })
//     .eq("id", subscriptionId);

//   if (error) {
//     console.error("Error canceling subscription:", error);
//     throw error;
//   }
// }

// export async function refundSubscription(
//   subscriptionId: string,
//   amount: number
// ): Promise<void> {
//   try {
//     const response = await fetch(
//       `${getAdminBaseURL()}/subscriptions/${subscriptionId}/refund`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount }),
//       }
//     );
//     if (response.ok) return;
//   } catch {
//     console.warn("API endpoint unavailable, falling back to direct DB queries");
//   }

//   const supabaseAdmin = await getSupabaseAdmin();
//   const { error } = await supabaseAdmin.from("payment_history").insert({
//     subscription_id: subscriptionId,
//     amount: -Math.abs(amount),
//     currency: "USD",
//     status: "refunded",
//     transaction_type: "refund",
//     payment_date: new Date().toISOString(),
//     description: "Manual refund",
//     is_free: false,
//   });

//   if (error) {
//     console.error("Error processing refund:", error);
//     throw error;
//   }
// }

// export async function exportSubscriptions(
//   format: "csv" | "json" | "xlsx" = "csv"
// ): Promise<void> {
//   try {
//     const response = await fetch(
//       `${getAdminBaseURL()}/export/subscriptions?format=${format}`
//     );
//     if (response.ok) {
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `subscriptions_export.${format}`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//       return;
//     }
//   } catch {
//     console.warn("API endpoint unavailable, falling back to CSV generation");
//   }

//   const subscriptions = await getAllSubscriptions();
//   const headers = [
//     "user_id",
//     "user_name",
//     "user_email",
//     "plan_name",
//     "status",
//     "billing_cycle",
//     "price_paid",
//     "total_paid",
//     "created_at",
//     "canceled_at",
//   ];

//   const rows = subscriptions.map((sub) => [
//     sub.user_id,
//     sub.user_name,
//     sub.user_email,
//     sub.subscription.plan?.name || "Unknown",
//     sub.subscription.status,
//     sub.subscription.billing_cycle,
//     sub.subscription.price_paid?.toString() || "0",
//     sub.total_paid.toString(),
//     sub.subscription.created_at || "",
//     sub.subscription.canceled_at || "",
//   ]);

//   const csvContent = [headers, ...rows]
//     .map((row) => row.map((field) => `"${field}"`).join(","))
//     .join("\n");

//   const blob = new Blob([csvContent], { type: "text/csv" });
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `subscriptions_export.csv`;
//   document.body.appendChild(a);
//   a.click();
//   window.URL.revokeObjectURL(url);
//   document.body.removeChild(a);
// }
