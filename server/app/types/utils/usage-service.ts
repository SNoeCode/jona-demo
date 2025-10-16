import { supabase } from "@/lib/supabaseClient";
import {
  UserUsage,
  UsageStats,
  UsagePayload,
  UserSubscriptionLimits,
  CurrentSubscription,
} from "@/types/index";
import { isUserUsageSummary } from "@/types/index";
import { SubscriptionService } from "./subscription-service";
export class UsageService {
  static async getUserUsage(
    userId: string,
    monthYear?: string
  ): Promise<UserUsage | null> {
    try {
      // Validate session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("No valid session for usage access");
        return null;
      }

      const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

      const { data, error } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", currentMonth)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user usage:", error);
        return null;
      }

      if (data) return data;

      // If no record exists, initialize it
      const { data: newUsage, error: insertError } = await supabase
        .from("user_usage")
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
        console.error("Error creating usage record:", insertError);
        return null;
      }

      return newUsage;
    } catch (error) {
      console.error("getUserUsage error:", error);
      return null;
    }
  }

  static calculateUsageStats(
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
          jobs_per_month:
            subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
          applications_per_day:
            subscription.max_applications_per_day ||
            defaultLimits.applications_per_day,
          resumes: subscription.max_resumes || defaultLimits.resumes,
          auto_scrape_enabled:
            subscription.features?.includes("auto_scrape") || false,
          priority_support:
            subscription.features?.includes("priority_support") || false,
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
            ? Math.round(
                (current.applications_sent / limits.applications_per_day) * 100
              )
            : 0,
        resumes:
          limits.resumes > 0
            ? Math.round((current.resumes_uploaded / limits.resumes) * 100)
            : 0,
      },
    };
  }

  static async getUsagePayload(userId: string): Promise<UsagePayload | null> {
    try {
      // Validate session
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("No valid session for usage payload");
        return null;
      }

      // Try to fetch usage summary first
      const { data: summary, error: summaryError } = await supabase
        .from("user_usage_summary")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (summary && isUserUsageSummary(summary)) {
        return summary;
      }

      if (summaryError && summaryError.code !== "PGRST116") {
        console.warn("Usage summary fetch failed:", summaryError.message);
      }

      // Fallback to raw usage
      const { data: usageData, error: usageError } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", userId)
        .order("month_year", { ascending: false })
        .limit(1);

      if (usageError) {
        console.warn("Usage data fetch failed:", usageError.message);
        return null;
      }

      return usageData?.[0] ?? null;
    } catch (error) {
      console.error("getUsagePayload error:", error);
      return null;
    }
  }

  // Initialize user usage for a month
  static async initializeUserUsage(
    userId: string,
    monthYear: string
  ): Promise<UserUsage> {
    try {
      const { data, error } = await supabase
        .from("user_usage")
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
        console.error("Error initializing user usage:", error);
        // Return default instead of throwing
        return {
          id: "",
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
      console.error("initializeUserUsage error:", error);
      return {
        id: "",
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

  // Update user usage with better error handling
  static async updateUserUsage(
    userId: string,
    monthYear: string,
    usage: Partial<
      Pick<UserUsage, "jobs_scraped" | "applications_sent" | "resumes_uploaded">
    >
  ): Promise<UserUsage | null> {
    try {
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

  // Increment usage counters
  static async incrementUsage(
    userId: string,
    type: "jobs_scraped" | "applications_sent" | "resumes_uploaded",
    amount: number = 1
  ): Promise<void> {
    try {
      const monthYear = new Date().toISOString().slice(0, 7);

      // Get current usage or use defaults
      let currentUsage = await this.getUserUsage(userId, monthYear);
      if (!currentUsage) {
        currentUsage = await this.initializeUserUsage(userId, monthYear);
      }

      const updatedUsage = {
        [type]: (currentUsage[type] || 0) + amount,
      };

      await this.updateUserUsage(userId, monthYear, updatedUsage);
    } catch (error) {
      console.error("incrementUsage error:", error);
    }
  }

  static async checkUsageLimits(userId: string): Promise<{
    canScrapeJobs: boolean;
    canSendApplications: boolean;
    canUploadResumes: boolean;
    limits: any;
    usage: UserUsage | null;
  }> {
    try {
      const subscription = await SubscriptionService.getCurrentSubscription(userId);
      const usage = await this.getUserUsage(userId);

      // Default limits for free plan
      const defaultLimits = {
        max_jobs_per_month: 50,
        max_applications_per_day: 5,
        max_resumes: 1,
      };

      if (!subscription) {
        return {
          canScrapeJobs:
            (usage?.jobs_scraped || 0) < defaultLimits.max_jobs_per_month,
          canSendApplications:
            (usage?.applications_sent || 0) <
            defaultLimits.max_applications_per_day,
          canUploadResumes:
            (usage?.resumes_uploaded || 0) < defaultLimits.max_resumes,
          limits: defaultLimits,
          usage,
        };
      }

      const canScrapeJobs =
        subscription.max_jobs_per_month === -1 ||
        (usage?.jobs_scraped || 0) < (subscription.max_jobs_per_month ?? 0);

      const canSendApplications =
        subscription.max_applications_per_day === -1 ||
        (usage?.applications_sent || 0) <
          (subscription.max_applications_per_day ?? 0);

      const canUploadResumes =
        subscription.max_resumes === -1 ||
        (usage?.resumes_uploaded || 0) < (subscription.max_resumes ?? 0);

      return {
        canScrapeJobs,
        canSendApplications,
        canUploadResumes,
        limits: {
          max_jobs_per_month: subscription.max_jobs_per_month,
          max_applications_per_day: subscription.max_applications_per_day,
          max_resumes: subscription.max_resumes,
        },
        usage,
      };
    } catch (error) {
      console.error("checkUsageLimits error:", error);
      // Return safe defaults
      return {
        canScrapeJobs: true,
        canSendApplications: true,
        canUploadResumes: true,
        limits: {
          max_jobs_per_month: 50,
          max_applications_per_day: 5,
          max_resumes: 1,
        },
        usage: null,
      };
    }
  }
}
// // utils/usage-service.ts
// import { supabase } from "@/lib/supabaseClient";
// import type { UserUsage } from "@/types/index";

// export class UsageService {
//   static async getUserUsage(userId: string): Promise<UserUsage | null> {
//     try {
//       const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

//       const { data, error } = await supabase
//         .from("user_usage")
//         .select("*")
//         .eq("user_id", userId)
//         .eq("month_year", currentMonth)
//         .maybeSingle();

//       if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
//         console.error("Error fetching user usage:", error);
//         // Don't return null, return a default usage object
//       }

//       if (!data) {
//         // Create a default usage record
//         const defaultUsage: UserUsage = {
//           id: crypto.randomUUID(), // Generate a UUID for the record
//           user_id: userId,
//           month_year: currentMonth,
//           jobs_scraped: 0,
//           applications_sent: 0,
//           resumes_uploaded: 0,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         };

//         try {
//           const { data: newUsage, error: insertError } = await supabase
//             .from("user_usage")
//             .insert(defaultUsage)
//             .select()
//             .single();

//           if (insertError) {
//             console.warn("Could not create usage record:", insertError);
//             // Return default usage even if insert fails
//             return defaultUsage;
//           }

//           return newUsage;
//         } catch (insertErr) {
//           console.warn("Could not insert usage record:", insertErr);
//           return defaultUsage;
//         }
//       }

//       return data;
//     } catch (error) {
//       console.error("getUserUsage error:", error);
      
//       // Return a safe default instead of null
//       return {
//         id: crypto.randomUUID(),
//         user_id: userId,
//         month_year: new Date().toISOString().slice(0, 7),
//         jobs_scraped: 0,
//         applications_sent: 0,
//         resumes_uploaded: 0,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };
//     }
//   }

//   static async updateUserUsage(
//     userId: string, 
//     updates: Partial<UserUsage>
//   ): Promise<UserUsage | null> {
//     try {
//       const currentMonth = new Date().toISOString().slice(0, 7);
      
//       const { data, error } = await supabase
//         .from("user_usage")
//         .upsert({
//           user_id: userId,
//           month_year: currentMonth,
//           ...updates,
//           updated_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error updating usage:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("updateUserUsage error:", error);
//       return null;
//     }
//   }

//   static async incrementUsage(
//     userId: string, 
//     field: 'jobs_scraped' | 'applications_sent' | 'resumes_uploaded',
//     amount: number = 1
//   ): Promise<boolean> {
//     try {
//       const currentUsage = await this.getUserUsage(userId);
      
//       if (!currentUsage) {
//         console.error("Could not get current usage");
//         return false;
//       }

//       const updatedUsage = {
//         ...currentUsage,
//         [field]: (currentUsage[field] || 0) + amount,
//         updated_at: new Date().toISOString(),
//       };

//       const result = await this.updateUserUsage(userId, updatedUsage);
//       return !!result;
//     } catch (error) {
//       console.error("incrementUsage error:", error);
//       return false;
//     }
//   }

//   static async initializeUserUsage(userId: string): Promise<UserUsage | null> {
//     try {
//       const currentMonth = new Date().toISOString().slice(0, 7);
      
//       const defaultUsage: UserUsage = {
//         id: crypto.randomUUID(),
//         user_id: userId,
//         month_year: currentMonth,
//         jobs_scraped: 0,
//         applications_sent: 0,
//         resumes_uploaded: 0,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };

//       const { data, error } = await supabase
//         .from("user_usage")
//         .insert(defaultUsage)
//         .select()
//         .single();

//       if (error) {
//         console.error("Error initializing usage:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("initializeUserUsage error:", error);
//       return null;
//     }
//   }

//   static async checkUsageLimits(userId: string, subscription: any = null) {
//     try {
//       const usage = await this.getUserUsage(userId);
      
//       const defaultLimits = {
//         jobs_per_month: 50,
//         applications_per_day: 5,
//         resumes: 1,
//       };

//       const limits = subscription ? {
//         jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
//         applications_per_day: subscription.max_applications_per_day || defaultLimits.applications_per_day,
//         resumes: subscription.max_resumes || defaultLimits.resumes,
//       } : defaultLimits;

//       const current = usage ? {
//         jobs_scraped: usage.jobs_scraped || 0,
//         applications_sent: usage.applications_sent || 0,
//         resumes_uploaded: usage.resumes_uploaded || 0,
//       } : {
//         jobs_scraped: 0,
//         applications_sent: 0,
//         resumes_uploaded: 0,
//       };

//       return {
//         within_limits: {
//           jobs: current.jobs_scraped < limits.jobs_per_month,
//           applications: current.applications_sent < limits.applications_per_day,
//           resumes: current.resumes_uploaded < limits.resumes,
//         },
//         current,
//         limits,
//         usage_percentage: {
//           jobs: Math.round((current.jobs_scraped / limits.jobs_per_month) * 100),
//           applications: Math.round((current.applications_sent / limits.applications_per_day) * 100),
//           resumes: Math.round((current.resumes_uploaded / limits.resumes) * 100),
//         }
//       };
//     } catch (error) {
//       console.error("checkUsageLimits error:", error);
//       return {
//         within_limits: { jobs: true, applications: true, resumes: true },
//         current: { jobs_scraped: 0, applications_sent: 0, resumes_uploaded: 0 },
//         limits: { jobs_per_month: 50, applications_per_day: 5, resumes: 1 },
//         usage_percentage: { jobs: 0, applications: 0, resumes: 0 }
//       };
//     }
//   }

//   static async getUsagePayload(userId: string) {
//     try {
//       const usage = await this.getUserUsage(userId);
//       return usage;
//     } catch (error) {
//       console.error("getUsagePayload error:", error);
//       return null;
//     }
//   }
// }