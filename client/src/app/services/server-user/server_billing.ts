// app/actions/subscription-actions.ts
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database';
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

/**
 * Update subscription billing cycle
 */
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

/**
 * Reactivate a canceled subscription
 */
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