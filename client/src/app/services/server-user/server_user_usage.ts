'use server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import {
  UserUsage,
  UsageStats,
  UsagePayload,
  UserSubscriptionLimits,
  CurrentSubscription,
} from '@/types/user';
import { isUserUsageSummary } from '@/types/user';
// import { ServerSubscriptionService, SubscriptionBundleService } from './server_user_subscription';


function getServerClient() {
  return createServerComponentClient<Database>({
    cookies: () => cookies(),
  });
}
  export async function getUserUsage(userId: string, monthYear?: string): Promise<UserUsage | null> {
    try {
      const supabase = getServerClient();
      const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user usage:', error);
        return null;
      }

      if (data) return data;

      const { data: newUsage, error: insertError } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          month_year: currentMonth,
          jobs_scraped: 0,
          applications_sent: 0,
          resumes_uploaded: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating usage record:', insertError);
        return null;
      }

      return newUsage;
    } catch (error) {
      console.error('getUserUsage error:', error);
      return null;
    }
  }


  export async function getUsagePayload(userId: string): Promise<UsagePayload | null> {
    try {
      const supabase = getServerClient();

      const { data: summary, error: summaryError } = await supabase
        .from('user_usage_summary')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (summary && isUserUsageSummary(summary)) {
        return summary;
      }

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.warn('Usage summary fetch failed:', summaryError.message);
      }

      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .order('month_year', { ascending: false })
        .limit(1);

      if (usageError) {
        console.warn('Usage data fetch failed:', usageError.message);
        return null;
      }

      return usageData?.[0] ?? null;
    } catch (error) {
      console.error('getUsagePayload error:', error);
      return null;
    }
  }

 export async function initializeUserUsage(userId: string, monthYear: string): Promise<UserUsage> {
    try {
      const supabase = getServerClient();

      const { data, error } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          month_year: monthYear,
          jobs_scraped: 0,
          applications_sent: 0,
          resumes_uploaded: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error initializing user usage:', error);
        return {
          id: '',
          user_id: userId,
          month_year: monthYear,
          jobs_scraped: 0,
          applications_sent: 0,
          resumes_uploaded: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return data;
    } catch (error) {
      console.error('initializeUserUsage error:', error);
      return {
        id: '',
        user_id: userId,
        month_year: monthYear,
        jobs_scraped: 0,
        applications_sent: 0,
        resumes_uploaded: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

   function calculateUsageStats(
    usage: UserUsage | null,
    subscription: CurrentSubscription | null
  ): UsageStats {
    const defaultLimits: UserSubscriptionLimits = {
      jobs_per_month: 50,
      applications_per_day: 5,
      resumes: 1,
      auto_scrape_enabled: false,
      priority_support: false,
    };

    const limits: UserSubscriptionLimits = subscription
      ? {
          jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
          applications_per_day:
            subscription.max_applications_per_day || defaultLimits.applications_per_day,
          resumes: subscription.max_resumes || defaultLimits.resumes,
          auto_scrape_enabled: subscription.features?.includes('auto_scrape') || false,
          priority_support: subscription.features?.includes('priority_support') || false,
        }
      : defaultLimits;

    const current = usage
      ? {
          jobs_scraped: usage.jobs_scraped || 0,
          applications_sent: usage.applications_sent || 0,
          resumes_uploaded: usage.resumes_uploaded || 0,
        }
      : {
          jobs_scraped: 0,
          applications_sent: 0,
          resumes_uploaded: 0,
        };

    return {
      current_month: current,
      limits,
      percentage_used: {
        jobs:
          limits.jobs_per_month > 0
            ? Math.round((current.jobs_scraped / limits.jobs_per_month) * 100)
            : 0,
        applications:
          limits.applications_per_day > 0
            ? Math.round((current.applications_sent / limits.applications_per_day) * 100)
            : 0,
        resumes:
          limits.resumes > 0
            ? Math.round((current.resumes_uploaded / limits.resumes) * 100)
            : 0,
      },
    };
  }
 export async function updateUserUsage(
  userId: string,
  monthYear: string,
  usage: Partial<Pick<UserUsage, "jobs_scraped" | "applications_sent" | "resumes_uploaded">>
): Promise<UserUsage | null> {
  try {
    const supabase = getServerClient(); // ✅ server-safe

    const { data, error } = await supabase
      .from("user_usage")
      .upsert({
        user_id: userId,
        month_year: monthYear,
        ...usage,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating user usage:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("updateUserUsage error:", error);
    return null;
  }

}