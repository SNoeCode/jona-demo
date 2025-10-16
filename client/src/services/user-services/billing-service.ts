"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { safeSelect } from "@/lib/safeFetch";
import type {
  CurrentSubscription,
  PaymentHistory,
  BillingCycle,
  StripeCheckoutMetadata,
} from "@/types/user";

export async function getCurrentSubscription(userId: string): Promise<CurrentSubscription | null> {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase.rpc("get_user_current_subscription", {
      user_uuid: userId,
    });

    if (error) {
      console.error("Error fetching current subscription:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("getCurrentSubscription error:", error);
    return null;
  }
}

export async function getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
  const supabase = createServerComponentClient({ cookies });

  try {
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

export async function createCheckoutSession(
  userId: string,
  planId: string,
  billingCycle: BillingCycle
): Promise<StripeCheckoutMetadata | null> {
  try {
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planId, billingCycle }),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    return await response.json();
  } catch (error) {
    console.error("createCheckoutSession error:", error);
    return null;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error canceling subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("cancelSubscription error:", error);
    return false;
  }
}
