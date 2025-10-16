// app/api/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, billingCycle } = await request.json();

    // Validate required fields
    if (!userId || !planId || !billingCycle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, planId, billingCycle' 
      }, { status: 400 });
    }

    // For free plan, create subscription directly
    if (planId === 'free') {
      try {
        // Get the free plan from database
        const { data: freePlan, error: planError } = await supabaseAdmin
          .from('subscription_plans')
          .select('*')
          .eq('name', 'Free')
          .single();

        if (planError || !freePlan) {
          // Create default free subscription if plan doesn't exist
          const { data: subscription, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: 'default-free',
              status: 'active',
              billing_cycle: 'monthly',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
              price_paid: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (subError) {
            console.error('Free subscription creation error:', subError);
            return NextResponse.json({ 
              success: false, 
              error: subError.message 
            }, { status: 500 });
          }

          return NextResponse.json({ 
            success: true, 
            subscription,
            message: 'Free plan activated successfully'
          });
        }

        // Create subscription with actual free plan
        const { data: subscription, error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: freePlan.id,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            price_paid: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (subError) {
          console.error('Free subscription creation error:', subError);
          return NextResponse.json({ 
            success: false, 
            error: subError.message 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          subscription,
          message: 'Free plan activated successfully'
        });

      } catch (error) {
        console.error('Free subscription error:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create free subscription' 
        }, { status: 500 });
      }
    }

    // For paid plans, you would typically create a Stripe checkout session
    // For now, return a placeholder response
    return NextResponse.json({ 
      success: false, 
      error: 'Paid subscriptions not implemented yet. Please select the free plan for now.' 
    }, { status: 501 });

  } catch (error) {
    console.error('Create subscription API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
