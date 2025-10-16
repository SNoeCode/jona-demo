// app/actions/getCurrentSubscription.ts
"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function getCurrentSubscription(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;

  return {
    subscription_id: data.id,
    plan_name: data.subscription_plans?.name ?? "Unknown",
    billing_cycle: data.billing_cycle,
    status: data.status,
    current_period_end: data.current_period_end,
    price_paid: data.price_paid,
  };
}