
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database';
import { CurrentSubscription } from '@/types/user/index';
import type { StripeCheckoutSession } from '@/types/user/index';
export async function createCheckoutSessionAction(
  planId: string,
  billingCycle: "monthly" | "yearly"
): Promise<{ success: boolean; data?: StripeCheckoutSession; error?: string }> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          planId,
          billingCycle,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || "Failed to create checkout session" 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("createCheckoutSessionAction error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Cancel a user's subscription
 */
export async function cancelSubscriptionAction(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.user_id !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Cancel the subscription
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
      return { success: false, error: error.message };
    }

    // Revalidate paths that might show subscription data
    revalidatePath('/dashboard');
    revalidatePath('/subscription');
    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error("cancelSubscriptionAction error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    })
export async function getCurrentSubscription(
    userId: string
  ): Promise<CurrentSubscription | null> {
    try {
    
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          status,
          billing_cycle,
          price_paid,
          current_period_end,
          subscription_plans!inner (
            name,
            auto_scrape_enabled,
            priority_support,
            max_jobs_per_month,
            max_applications_per_day,
            max_resumes,
            features
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching current subscription:", error);
        return null;
      }

      if (!data || !data.subscription_plans) {
        return null;
      }

      const plan = Array.isArray(data.subscription_plans) 
        ? data.subscription_plans[0] 
        : data.subscription_plans;

      const subscription: CurrentSubscription = {
        subscription_id: data.id,
        plan_name: plan.name,
        billing_cycle: data.billing_cycle,
        status: data.status,
        current_period_end: data.current_period_end,
        max_jobs_per_month: plan.max_jobs_per_month,
        max_resumes: plan.max_resumes,
        max_applications_per_day: plan.max_applications_per_day,
        auto_scrape_enabled: plan.auto_scrape_enabled,
        priority_support: plan.priority_support,
        features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features,
        price_paid: data.price_paid,
      };

      return subscription;
    } catch (error) {
      console.error("getCurrentSubscription error:", error);
      return null;
    }
  }

export async function updateBillingCycleAction(
  subscriptionId: string,
  newCycle: "monthly" | "yearly"
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.user_id !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update billing cycle
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        billing_cycle: newCycle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error updating billing cycle:", error);
      return { success: false, error: error.message };
    }

    revalidatePath('/subscription');
    
    return { success: true };
  } catch (error) {
    console.error("updateBillingCycleAction error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}



export async function reactivateSubscriptionAction(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership and status
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("user_id, status")
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.user_id !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (subscription.status !== 'canceled') {
      return { success: false, error: 'Subscription is not canceled' };
    }

    // Reactivate
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error reactivating subscription:", error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/subscription');
    
    return { success: true };
  } catch (error) {
    console.error("reactivateSubscriptionAction error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
