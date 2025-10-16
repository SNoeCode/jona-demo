import { supabase } from "@/lib/supabaseClient";
import { 
  EnhancedUserProfile, 
  UserProfile, 
  CurrentSubscription,
  UserUsage,
  SubscriptionPlan,
  PaymentHistory,
} from "@/types/index";
import { InsertUserProfilePayload } from "@/types/index";
import { v4 as uuidv4 } from "uuid";

export class ProfileService {
  
  // Fixed getCurrentSubscription based on your actual user_subscriptions table
  static async getCurrentSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          plan_name,
          subscription_id,
          status,
          billing_cycle,
          price_paid,
          currency,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          started_at,
          canceled_at,
          expires_at,
          created_at,
          updated_at,
          features,
          subscription_plans (
            id,
            name,
            description,
            features,
            price_monthly,
            price_yearly,
            popular
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current subscription:', error);
        return {
          success: false,
          error: error.message,
          data: null,
        };
      }

      if (!data) {
        return { 
          success: true, 
          error: null, 
          data: null 
        };
      }

      const plan = data.subscription_plans as unknown as SubscriptionPlan;
      const transformedData = {
        id: data.id,
        subscription_id: data.subscription_id || data.id, // Use subscription_id if exists, fallback to id
        user_id: data.user_id,
        plan_id: data.plan_id,
        plan_name: data.plan_name || plan?.name || 'Free',
        status: data.status,
        billing_cycle: data.billing_cycle,
        price_paid: data.price_paid,
        currency: data.currency,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        trial_start: data.trial_start,
        trial_end: data.trial_end,
        started_at: data.started_at,
        canceled_at: data.canceled_at,
        expires_at: data.expires_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        features: data.features || plan?.features || [],
        // Add subscription limits based on plan or defaults
        max_jobs_per_month: plan?.max_jobs_per_month || 50,
        max_applications_per_day: plan?.max_applications_per_day || 5,
        max_resumes: plan?.max_resumes || 1,
        auto_scrape_enabled: data.features?.includes?.('auto_scrape') || false,
        priority_support: data.features?.includes?.('priority_support') || false,
      };

      return {
        success: true,
        data: transformedData,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }
static async createUserProfile(payload: InsertUserProfilePayload) {
    try {
      const profileData = {
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📦 Creating user profile:", profileData);

      const { data, error } = await supabase
        .from("user_profiles")
        .insert([profileData])
        .select();

      if (error) {
        console.error("❌ Profile creation error:", error);
        throw new Error(`Profile creation failed: ${error.message}`);
      }

      console.log("✅ Profile created successfully:", data);
      return data;
    } catch (err) {
      console.error("❌ Profile creation failed:", err);
      throw err;
    }
  }

  // Get subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("price_monthly", { ascending: true });

      if (error) {
        console.error("Error fetching subscription plans:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("getSubscriptionPlans error:", error);
      return [];
    }
  }

  // Get user profile from user_profiles table
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("getUserProfile error:", error);
      return null;
    }
  }

  // Enhanced user profile with aggregated data
  static async getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.warn("Could not fetch user profile:", profileError);
      }

      // Get basic user info from users table (fallback)
      let basicUser = null;
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .maybeSingle();

      if (!userError && userData) {
        basicUser = userData;
      } else {
        // Fallback to auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === userId) {
          basicUser = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          };
        }
      }

      // Get application and resume counts with error handling
      let applicationCount = 0;
      let resumeCount = 0;

      try {
        const { data: appData } = await supabase
          .from("user_job_status")
          .select("user_id")
          .eq("user_id", userId)
          .eq("applied", true);
        applicationCount = appData?.length || 0;
      } catch (error) {
        console.warn("Could not fetch application count:", error);
      }

      try {
        const { data: resumeData } = await supabase
          .from("resumes")
          .select("user_id")
          .eq("user_id", userId);
        resumeCount = resumeData?.length || 0;
      } catch (error) {
        console.warn("Could not fetch resume count:", error);
      }

      const enhancedProfile: EnhancedUserProfile = {
        id: userId,
        // name: profile?.full_name || basicUser?.name || 'User',
        email: profile?.email || basicUser?.email || 'user@example.com',
        full_name: profile?.full_name || basicUser?.name || 'User',
        avatar_url: profile?.avatar_url,
        bio: profile?.bio,
        company: profile?.company,
        job_title: profile?.job_title,
        location: profile?.location || "Unknown",
        phone: profile?.phone,
        website: profile?.website,
        linkedin_url: profile?.linkedin_url,
        github_url: profile?.github_url,
        experience_level: profile?.experience_level,
        preferred_job_types: profile?.preferred_job_types || [],
        preferred_locations: profile?.preferred_locations || [],
        salary_range_min: profile?.salary_range_min,
        salary_range_max: profile?.salary_range_max,
        resume_url: profile?.resume_url,
        role: profile?.role || 'job_seeker',
        subscription_plan: profile?.subscription_plan || 'free',
        is_admin: profile?.is_admin || false,
        joined_date: profile?.created_at || new Date().toISOString(),
        last_login: new Date().toISOString(),
        status: "active",
        applications_sent: applicationCount,
        resumes_uploaded: resumeCount,
        profile_completed: !!profile?.full_name,
        subscription_type: profile?.subscription_plan || "free",
        created_at: profile?.created_at,
        updated_at: profile?.updated_at,
      };

      return enhancedProfile;

    } catch (error) {
      console.error("getEnhancedUserProfile error:", error);
      
      // Return minimal fallback profile
      return {
        id: userId,
        email: "user@example.com",
        full_name: "User",
        joined_date: new Date().toISOString(),
        last_login: new Date().toISOString(),
        status: "active",
        applications_sent: 0,
        resumes_uploaded: 0,
        profile_completed: false,
        subscription_type: "free",
        location: "Unknown",
        role: "job_seeker",
        subscription_plan: "free",
        is_admin: false,
      };
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("updateUserProfile error:", error);
      return null;
    }
  }

  // Get user usage
  static async getUserUsage(userId: string): Promise<UserUsage | null> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data, error } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", currentMonth)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user usage:", error);
        return null;
      }

      if (!data) {
        // Create default usage record
  

const defaultUsage = {
  id: uuidv4(), // ✅ required
  user_id: userId,
  month_year: currentMonth,
  jobs_scraped: 0,
  applications_sent: 0,
  resumes_uploaded: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
        const { data: newUsage, error: insertError } = await supabase
          .from("user_usage")
          .insert(defaultUsage)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating usage record:", insertError);
          return defaultUsage; // Return the default even if insert fails
        }

        return newUsage;
      }

      return data;
    } catch (error) {
      console.error("getUserUsage error:", error);
      // Return default usage on error
      return {
         id: userId,
        user_id: userId,
        month_year: new Date().toISOString().slice(0, 7),
        jobs_scraped: 0,
        applications_sent: 0,
        resumes_uploaded: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Calculate usage statistics
  static calculateUsageStats(
    usage: UserUsage | null, 
    subscription: CurrentSubscription | null
  ) {
    const defaultLimits = {
      jobs_per_month: 50,
      applications_per_day: 5,
      resumes: 1,
      auto_scrape_enabled: false,
      priority_support: false,
    };

    const limits = subscription ? {
      jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
      applications_per_day: subscription.max_applications_per_day || defaultLimits.applications_per_day,
      resumes: subscription.max_resumes || defaultLimits.resumes,
      auto_scrape_enabled: subscription.auto_scrape_enabled || false,
      priority_support: subscription.priority_support || false,
    } : defaultLimits;

    const current = usage ? {
      jobs_scraped: usage.jobs_scraped || 0,
      applications_sent: usage.applications_sent || 0,
      resumes_uploaded: usage.resumes_uploaded || 0,
    } : {
      jobs_scraped: 0,
      applications_sent: 0,
      resumes_uploaded: 0,
    };

    return {
      current_month: current,
      limits,
      percentage_used: {
        jobs: limits.jobs_per_month > 0 ? Math.round((current.jobs_scraped / limits.jobs_per_month) * 100) : 0,
        applications: limits.applications_per_day > 0 ? Math.round((current.applications_sent / limits.applications_per_day) * 100) : 0,
        resumes: limits.resumes > 0 ? Math.round((current.resumes_uploaded / limits.resumes) * 100) : 0,
      }
    };
  }

  // Get payment history
  static async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.error("Error fetching payment history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("getPaymentHistory error:", error);
      return [];
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
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
}
// import { supabase } from "@/lib/supabaseClient";

// export class ProfileService {
  
//   // Simplified getCurrentSubscription that works with your current setup
//   static async getCurrentSubscription(userId: string) {
//     try {
//       // Try the most basic approach first
//       let query = supabase
//         .from('user_subscriptions')
//         .select('*')  // Select all columns first to see what exists
//         .eq('user_id', userId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       let { data, error } = await query;

//       // If user_subscriptions doesn't work, try subscriptions table
//       if (error && error.message.includes('does not exist')) {
//         console.log('Trying subscriptions table...');
//         const { data: subData, error: subError } = await supabase
//           .from('subscriptions')
//           .select('*')
//           .eq('user_id', userId)
//           .eq('status', 'active')
//           .order('created_at', { ascending: false })
//           .limit(1)
//           .maybeSingle();
        
//         data = subData;
//         error = subError;
//       }

//       if (error) {
//         console.error('Error fetching subscription:', error);
//         return {
//           success: false,
//           error: error.message,
//           data: null,
//         };
//       }

//       if (!data) {
//         return {
//           success: true,
//           error: null,
//           data: null,
//         };
//       }

//       // Transform whatever data we get into a consistent format
//       const transformedData = {
//         id: data.id,
//         user_id: data.user_id,
//         plan_id: data.plan_id,
//         plan_name: data.plan_name || 'Free',
//         status: data.status,
//         current_period_end: data.current_period_end,
//         features: data.features || [],
//         // Add other fields as they exist in your actual table
//         billing_cycle: data.billing_cycle,
//         price_paid: data.price_paid,
//         currency: data.currency,
//         created_at: data.created_at,
//       };

//       return {
//         success: true,
//         data: transformedData,
//         error: null,
//       };

//     } catch (error) {
//       console.error('getCurrentSubscription error:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//         data: null,
//       };
//     }
//   }

//   // Get subscription plans
//   static async getSubscriptionPlans() {
//     try {
//       const { data, error } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .order("price_monthly", { ascending: true });

//       if (error) {
//         console.error("Error fetching subscription plans:", error);
//         return [];
//       }

//       return data || [];
//     } catch (error) {
//       console.error("getSubscriptionPlans error:", error);
//       return [];
//     }
//   }

//   // Simplified getEnhancedUserProfile - avoid problematic tables
//   static async getEnhancedUserProfile(userId: string) {
//     try {
//       // Try to get current auth user
//       const { data: { user: authUser } } = await supabase.auth.getUser();
      
//       let baseUser = null;
      
//       if (authUser && authUser.id === userId) {
//         baseUser = {
//           id: authUser.id,
//           email: authUser.email,
//           name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
//         };
//       } else {
//         // Fallback
//         baseUser = {
//           id: userId,
//           email: 'user@example.com',
//           name: 'User',
//         };
//       }

//       // Try to get profile data if the table exists
//       let profile = null;
//       try {
//         const { data: profileData } = await supabase
//           .from("user_profiles")
//           .select("*")
//           .eq("id", userId)
//           .maybeSingle();
//         profile = profileData;
//       } catch (profileError) {
//         console.warn("Could not fetch user profile:", profileError);
//       }

//       // Get counts with error handling
//       let applicationCount = 0;
//       let resumeCount = 0;

//       try {
//         const { data: appData } = await supabase
//           .from("user_job_status")
//           .select("user_id", { count: 'exact' })
//           .eq("user_id", userId)
//           .eq("applied", true);
//         applicationCount = appData?.length || 0;
//       } catch (error) {
//         console.warn("Could not fetch application count");
//       }

//       try {
//         const { data: resumeData } = await supabase
//           .from("resumes")
//           .select("user_id", { count: 'exact' })
//           .eq("user_id", userId);
//         resumeCount = resumeData?.length || 0;
//       } catch (error) {
//         console.warn("Could not fetch resume count");
//       }

//       return {
//         ...baseUser,
//         full_name: profile?.full_name || baseUser.name,
//         email: profile?.email || baseUser.email,
//         joined_date: profile?.created_at || new Date().toISOString(),
//         last_login: new Date().toISOString(),
//         status: "active",
//         applications_sent: applicationCount,
//         resumes_uploaded: resumeCount,
//         profile_completed: !!profile?.full_name,
//         subscription_type: "free",
//         location: profile?.location || "Unknown",
//       };

//     } catch (error) {
//       console.error("getEnhancedUserProfile error:", error);
      
//       // Return minimal fallback
//       return {
//         id: userId,
//         email: "user@example.com",
//         name: "User",
//         full_name: "User",
//         joined_date: new Date().toISOString(),
//         last_login: new Date().toISOString(),
//         status: "active",
//         applications_sent: 0,
//         resumes_uploaded: 0,
//         profile_completed: false,
//         subscription_type: "free",
//         location: "Unknown",
//       };
//     }
//   }

//   // Basic user profile operations
//   static async getUserProfile(userId: string) {
//     try {
//       const { data, error } = await supabase
//         .from("user_profiles")
//         .select("*")
//         .eq("id", userId)
//         .maybeSingle();

//       if (error) {
//         console.error("Error fetching user profile:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("getUserProfile error:", error);
//       return null;
//     }
//   }

//   static async updateUserProfile(userId: string, updates: any) {
//     try {
//       const { data, error } = await supabase
//         .from("user_profiles")
//         .upsert({
//           id: userId,
//           ...updates,
//           updated_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error updating user profile:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("updateUserProfile error:", error);
//       return null;
//     }
//   }

//   // Usage stats calculation
//   static calculateUsageStats(usage: any, subscription: any) {
//     const defaultLimits = {
//       jobs_per_month: 50,
//       applications_per_day: 5,
//       resumes: 1,
//       auto_scrape_enabled: false,
//       priority_support: false,
//     };

//     const limits = subscription ? {
//       jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
//       applications_per_day: subscription.max_applications_per_day || defaultLimits.applications_per_day,
//       resumes: subscription.max_resumes || defaultLimits.resumes,
//       auto_scrape_enabled: subscription.features?.includes?.('auto_scrape') || false,
//       priority_support: subscription.features?.includes?.('priority_support') || false,
//     } : defaultLimits;

//     const current = usage ? {
//       jobs_scraped: usage.jobs_scraped || 0,
//       applications_sent: usage.applications_sent || 0,
//       resumes_uploaded: usage.resumes_uploaded || 0,
//     } : {
//       jobs_scraped: 0,
//       applications_sent: 0,
//       resumes_uploaded: 0,
//     };

//     return {
//       current_month: current,
//       limits,
//       percentage_used: {
//         jobs: limits.jobs_per_month > 0 ? Math.round((current.jobs_scraped / limits.jobs_per_month) * 100) : 0,
//         applications: limits.applications_per_day > 0 ? Math.round((current.applications_sent / limits.applications_per_day) * 100) : 0,
//         resumes: limits.resumes > 0 ? Math.round((current.resumes_uploaded / limits.resumes) * 100) : 0,
//       }
//     };
//   }

//   // Payment history
//   static async getPaymentHistory(userId: string) {
//     try {
//       const { data, error } = await supabase
//         .from("payment_history")
//         .select("*")
//         .eq("user_id", userId)
//         .order("payment_date", { ascending: false });

//       if (error) {
//         console.error("Error fetching payment history:", error);
//         return [];
//       }

//       return data || [];
//     } catch (error) {
//       console.error("getPaymentHistory error:", error);
//       return [];
//     }
//   }
// }
// import { supabase } from "@/lib/supabaseClient";
// import { 
//   EnhancedUserProfile, 
//   UserProfile, 
//   AuthUser, 
//   CurrentSubscription,
//   UserUsage,
// SubscriptionPlan,
//   PaymentHistory,
//   ExperienceLevel
// } from "@/types/index";

// import { safeSelect, safeSingle } from "@/lib/safeFetch";
// import type { InsertUserProfilePayload } from "@/types/profile";
// // interface SubscriptionPlan {
// //   id: string;
// //   name: string;
// //   description?: string;
// //   price: number; // Required main price field
// //   currency?: string;
// //   billing_period?: string;
// //   features?: string; // jsonb in database
// //   max_jobs?: number;
// //   max_applications?: number;
// //   is_active?: boolean;
// //   created_at?: string;
// //   updated_at?: string;
// //   billing_cycle?: string;
// //   max_jobs_per_month?: number;
// //   max_applications_per_month?: number;
// //   max_resumes?: number;
// //   active?: boolean;
// //   price_monthly?: number;
// //   price_yearly?: number;
// //   max_applications_per_day?: number;
// //   auto_scrape_enabled?: boolean;
// //   priority_support?: boolean;
// //   popular?: boolean;
// //   // Stripe integration fields
// //   stripe_price_id_monthly?: string;
// //   stripe_price_id_yearly?: string;
// // }
// export class ProfileService {
//   static async getUserProfile(userId: string): Promise<UserProfile | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_profiles")
//         .select("*")
//         .eq("id", userId)
//         .maybeSingle();

//       if (error) {
//         console.error("Error fetching user profile:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("getUserProfile error:", error);
//       return null;
//     }
//   }
  
  
//   static async getCurrentSubscription(userId: string) {
//     try {
//       const { data, error } = await supabase
//       .from('user_subscriptions')
//       .select(`
//         id,
//         name,
//         user_id,
//         plan_id,
//         plan_name,
//         status,
//         billing_cycle,
//         price_paid,
//         currency,
//         current_period_start,
//         current_period_end,
//         trial_start,
//         trial_end,
//         started_at,
//         canceled_at,
//         expires_at,
//         created_at,
//         updated_at,
//         features,
//         subscription_plans (
//           id,
//           name,
//           description,
//           features,
//           price_monthly,
//           price_yearly,
//           popular
//           )
//           `)
//           .eq('user_id', userId)
//       .eq('status', 'active')
//       .order('created_at', { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (error) {
//       console.error('Error fetching current subscription:', error);
//       return {
//         success: false,
//         error: error.message,
//         data: null,
//       };
//     }
    
//     if (!data) {
//   return { success: false, error: "No subscription found", data: null };
// }

// const plan = data.subscription_plans as unknown as SubscriptionPlan;
//     const transformedData = data
//     ? {
//           id: data.id,
//           user_id: data.user_id,
//           plan_id: data.plan_id,
//        plan_name: data.plan_name ?? plan.name ?? 'Free',
//   features: data.features ?? plan.features ?? [],
//           status: data.status,
//           billing_cycle: data.billing_cycle,
//           price_paid: data.price_paid,
//           currency: data.currency,
//           current_period_start: data.current_period_start,
//           current_period_end: data.current_period_end,
//           trial_start: data.trial_start,
//           trial_end: data.trial_end,
//           started_at: data.started_at,
//           canceled_at: data.canceled_at,
//           expires_at: data.expires_at,
//           created_at: data.created_at,
//           updated_at: data.updated_at,
//             }
//       : null;

//     return {
//       success: true,
//       data: transformedData,
//       error: null,
//     };
//   } catch (error) {
//     console.error('Error fetching current subscription:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//       data: null,
//     };
//   }
// }
//   // Update user profile
//   static async updateUserProfile(
//     userId: string, 
//     updates: Partial<UserProfile>
//   ): Promise<UserProfile | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_profiles")
//         .upsert({
//           id: userId,
//           ...updates,
//           updated_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) {
//         console.error("Error updating user profile:", error);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error("updateUserProfile error:", error);
//       return null;
//     }
//   }

//   static async uploadAvatar(userId: string, file: File): Promise<{ avatar_url: string } | null> {
//     try {
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${userId}.${fileExt}`;
//       const filePath = `avatars/${fileName}`;

//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('user-avatars')
//         .upload(filePath, file, { upsert: true });

//       if (uploadError) {
//         console.error("Error uploading avatar:", uploadError);
//         return null;
//       }

//       const { data: { publicUrl } } = supabase.storage
//         .from('user-avatars')
//         .getPublicUrl(filePath);

//       await this.updateUserProfile(userId, { avatar_url: publicUrl });

//       return { avatar_url: publicUrl };
//     } catch (error) {
//       console.error("uploadAvatar error:", error);
//       return null;
//     }
//   }

//   static async createUserProfile(payload: InsertUserProfilePayload) {
//     try {
//       const profileData = {
//         ...payload,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };

//       console.log("📦 Creating user profile:", profileData);

//       const { data, error } = await supabase
//         .from("user_profiles")
//         .insert([profileData])
//         .select();

//       if (error) {
//         console.error("❌ Profile creation error:", error);
//         throw new Error(`Profile creation failed: ${error.message}`);
//       }

//       console.log("✅ Profile created successfully:", data);
//       return data;
//     } catch (err) {
//       console.error("❌ Profile creation failed:", err);
//       throw err;
//     }
//   }



// static async getEnhancedUserProfile(
//     userId: string
//   ): Promise<EnhancedUserProfile> {
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", userId)
//       .single();

//     if (userError || !user) throw userError || new Error("User not found");

//     const { data: profile } = await supabase
//       .from("user_profiles")
//       .select("*")
//       .eq("id", userId)
//       .single();

//     const { data: applicationCountData } = await supabase
//       .from("user_job_status")
//       .select("user_id")
//       .eq("user_id", userId)
//       .eq("applied", true);

//     const { data: resumeCountData } = await supabase
//       .from("resumes")
//       .select("user_id")
//       .eq("user_id", userId);

//     return {
//       ...user,
//       full_name: profile?.full_name || user.name,
//       email: profile?.email || "Unknown",
//       joined_date: profile?.created_at || new Date().toISOString(),
//       last_login: new Date().toISOString(),
//       status: "active",
//       applications_sent: applicationCountData?.length || 0,
//       resumes_uploaded: resumeCountData?.length || 0,
//       profile_completed: !!profile?.full_name,
//       subscription_type: "free",
//       location: profile?.location || "Unknown",
//     };
//   }

//   static async getUserUsage(userId: string): Promise<UserUsage | null> {
//     try {
//       const currentMonth = new Date().toISOString().slice(0, 7);

//       const { data, error } = await supabase
//         .from("user_usage")
//         .select("*")
//         .eq("user_id", userId)
//         .eq("month_year", currentMonth)
//         .maybeSingle();

//       if (error && error.code !== 'PGRST116') {
//         console.error("Error fetching user usage:", error);
//       }

//       if (!data) {
//         const { data: newUsage, error: insertError } = await supabase
//           .from("user_usage")
//           .insert({
//             user_id: userId,
//             month_year: currentMonth,
//             jobs_scraped: 0,
//             applications_sent: 0,
//             resumes_uploaded: 0,
//           })
//           .select()
//           .single();

//         if (insertError) {
//           console.error("Error creating usage record:", insertError);
//           return null;
//         }

//         return newUsage;
//       }

//       return data;
//     } catch (error) {
//       console.error("getUserUsage error:", error);
//       return null;
//     }
//   }

//   // Get subscription plans
//   static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
//     try {
//       const { data, error } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("active", true)
//         .order("price_monthly", { ascending: true });

//       if (error) {
//         console.error("Error fetching subscription plans:", error);
//         return [];
//       }

//       return data || [];
//     } catch (error) {
//       console.error("getSubscriptionPlans error:", error);
//       return [];
//     }
//   }

//   static async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
//     try {
//       const { data, error } = await supabase
//         .from("payment_history")
//         .select("*")
//         .eq("user_id", userId)
//         .order("payment_date", { ascending: false });

//       if (error) {
//         console.error("Error fetching payment history:", error);
//         return [];
//       }

//       return data || [];
//     } catch (error) {
//       console.error("getPaymentHistory error:", error);
//       return [];
//     }
//   }

//   static calculateUsageStats(
//     usage: UserUsage | null, 
//     subscription: CurrentSubscription | null
//   ) {
//     const defaultLimits = {
//       jobs_per_month: 50,
//       applications_per_day: 5,
//       resumes: 1,
//       auto_scrape_enabled: false,
//       priority_support: false,
//     };

//     const limits = subscription ? {
//       jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
//       applications_per_day: subscription.max_applications_per_day || defaultLimits.applications_per_day,
//       resumes: subscription.max_resumes || defaultLimits.resumes,
//       auto_scrape_enabled: subscription.features?.includes('auto_scrape') || false,
//       priority_support: subscription.features?.includes('priority_support') || false,
//     } : defaultLimits;

//     const current = usage ? {
//       jobs_scraped: usage.jobs_scraped || 0,
//       applications_sent: usage.applications_sent || 0,
//       resumes_uploaded: usage.resumes_uploaded || 0,
//     } : {
//       jobs_scraped: 0,
//       applications_sent: 0,
//       resumes_uploaded: 0,
//     };

//     return {
//       current_month: current,
//       limits,
//       percentage_used: {
//         jobs: limits.jobs_per_month > 0 ? Math.round((current.jobs_scraped / limits.jobs_per_month) * 100) : 0,
//         applications: limits.applications_per_day > 0 ? Math.round((current.applications_sent / limits.applications_per_day) * 100) : 0,
//         resumes: limits.resumes > 0 ? Math.round((current.resumes_uploaded / limits.resumes) * 100) : 0,
//       }
//     };
//   }

//   static async createCheckoutSession(
//     userId: string,
//     planId: string,
//     billingCycle: 'monthly' | 'yearly'
//   ): Promise<{ url: string } | null> {
//     try {
//       const response = await fetch("/api/stripe/create-checkout-session", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           userId,
//           planId,
//           billingCycle,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to create checkout session");
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("createCheckoutSession error:", error);
//       return null;
//     }
//   }

//   // Cancel subscription
//   static async cancelSubscription(subscriptionId: string): Promise<boolean> {
//     try {
//       const { error } = await supabase
//         .from("user_subscriptions")
//         .update({
//           status: "canceled",
//           canceled_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", subscriptionId);

//       if (error) {
//         console.error("Error canceling subscription:", error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error("cancelSubscription error:", error);
//       return false;
//     }
//   }
// }

// // import { supabase } from "@/lib/supabaseClient";
// // import { 
// //   EnhancedUserProfile, 
// //   UserProfile, 
// //   AuthUser, 
// //   CurrentSubscription,
// //   UserUsage,
// //   SubscriptionPlan,
// //   PaymentHistory,
// //   ExperienceLevel
// // } from "@/types/index";
// // import { safeSelect, safeSingle } from "@/lib/safeFetch";

// // export class ProfileService {
// //   // Get user profile from user_profiles table
// //   static async getUserProfile(userId: string): Promise<UserProfile | null> {
// //     try {
// //       const { data, error } = await supabase
// //         .from("user_profiles")
// //         .select("*")
// //         .eq("id", userId)
// //         .maybeSingle();

// //       if (error) {
// //         console.error("Error fetching user profile:", error);
// //         return null;
// //       }

// //       return data;
// //     } catch (error) {
// //       console.error("getUserProfile error:", error);
// //       return null;
// //     }
// //   }

// //   // Update user profile
// //   static async updateUserProfile(
// //     userId: string, 
// //     updates: Partial<UserProfile>
// //   ): Promise<UserProfile | null> {
// //     try {
// //       const { data, error } = await supabase
// //         .from("user_profiles")
// //         .upsert({
// //           id: userId,
// //           ...updates,
// //           updated_at: new Date().toISOString(),
// //         })
// //         .select()
// //         .single();

// //       if (error) {
// //         console.error("Error updating user profile:", error);
// //         return null;
// //       }

// //       return data;
// //     } catch (error) {
// //       console.error("updateUserProfile error:", error);
// //       return null;
// //     }
// //   }

// //   // Upload and update avatar
// //   static async uploadAvatar(userId: string, file: File): Promise<{ avatar_url: string } | null> {
// //     try {
// //       const fileExt = file.name.split('.').pop();
// //       const fileName = `${userId}.${fileExt}`;
// //       const filePath = `avatars/${fileName}`;

// //       // Upload file to Supabase Storage
// //       const { data: uploadData, error: uploadError } = await supabase.storage
// //         .from('user-avatars')
// //         .upload(filePath, file, { upsert: true });

// //       if (uploadError) {
// //         console.error("Error uploading avatar:", uploadError);
// //         return null;
// //       }

// //       // Get public URL
// //       const { data: { publicUrl } } = supabase.storage
// //         .from('user-avatars')
// //         .getPublicUrl(filePath);

// //       // Update profile with new avatar URL
// //       await this.updateUserProfile(userId, { avatar_url: publicUrl });

// //       return { avatar_url: publicUrl };
// //     } catch (error) {
// //       console.error("uploadAvatar error:", error);
// //       return null;
// //     }
// //   }

// //   // Get enhanced user profile with subscription and usage data
// //   static async getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
// //     try {
// //       const [profile, subscription, usage] = await Promise.allSettled([
// //         this.getUserProfile(userId),
// //         this.getCurrentSubscription(userId),
// //         this.getUserUsage(userId)
// //       ]);

// //       const baseProfile = profile.status === 'fulfilled' ? profile.value : null;
      
// //       if (!baseProfile) {
// //         // Create default profile if none exists
// //         const defaultProfile: Partial<UserProfile> = {
// //           id: userId,
// //           created_at: new Date().toISOString(),
// //           updated_at: new Date().toISOString(),
// //         };
        
// //         const createdProfile = await this.updateUserProfile(userId, defaultProfile);
// //         if (!createdProfile) return null;
        
// //         return {
// //           ...createdProfile,
// //           current_subscription: subscription.status === 'fulfilled' ? subscription.value : null,
// //           usage: usage.status === 'fulfilled' ? usage.value : null,
// //           lastSeen: new Date().toISOString(),
// //         };
// //       }

// //       return {
// //         ...baseProfile,
// //         current_subscription: subscription.status === 'fulfilled' ? subscription.value : null,
// //         usage: usage.status === 'fulfilled' ? usage.value : null,
// //         lastSeen: new Date().toISOString(),
// //       };
// //     } catch (error) {
// //       console.error("getEnhancedUserProfile error:", error);
// //       return null;
// //     }
// //   }

// //   // Get current subscription (reusing from SubscriptionService)
// //   static async getCurrentSubscription(userId: string): Promise<CurrentSubscription | null> {
// //     try {
// //       const { data, error } = await supabase.rpc(
// //         "get_user_current_subscription",
// //         { user_uuid: userId }
// //       );

// //       if (error) {
// //         console.error("Error fetching current subscription:", error);
// //         return null;
// //       }

// //       return data?.[0] || null;
// //     } catch (error) {
// //       console.error("getCurrentSubscription error:", error);
// //       return null;
// //     }
// //   }

// //   // Get user usage (reusing from SubscriptionService)
// //   static async getUserUsage(userId: string): Promise<UserUsage | null> {
// //     try {
// //       const currentMonth = new Date().toISOString().slice(0, 7);

// //       const { data, error } = await supabase
// //         .from("user_usage")
// //         .select("*")
// //         .eq("user_id", userId)
// //         .eq("month_year", currentMonth)
// //         .maybeSingle();

// //       if (error && error.code !== 'PGRST116') {
// //         console.error("Error fetching user usage:", error);
// //       }

// //       if (!data) {
// //         // Initialize usage record
// //         const { data: newUsage, error: insertError } = await supabase
// //           .from("user_usage")
// //           .insert({
// //             user_id: userId,
// //             month_year: currentMonth,
// //             jobs_scraped: 0,
// //             applications_sent: 0,
// //             resumes_uploaded: 0,
// //           })
// //           .select()
// //           .single();

// //         if (insertError) {
// //           console.error("Error creating usage record:", insertError);
// //           return null;
// //         }

// //         return newUsage;
// //       }

// //       return data;
// //     } catch (error) {
// //       console.error("getUserUsage error:", error);
// //       return null;
// //     }
// //   }

// //   // Get subscription plans
// //   static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
// //     try {
// //       const { data, error } = await supabase
// //         .from("subscription_plans")
// //         .select("*")
// //         .eq("active", true)
// //         .order("price_monthly", { ascending: true });

// //       if (error) {
// //         console.error("Error fetching subscription plans:", error);
// //         return [];
// //       }

// //       return data || [];
// //     } catch (error) {
// //       console.error("getSubscriptionPlans error:", error);
// //       return [];
// //     }
// //   }

// //   // Get payment history
// //   static async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
// //     try {
// //       const { data, error } = await supabase
// //         .from("payment_history")
// //         .select("*")
// //         .eq("user_id", userId)
// //         .order("payment_date", { ascending: false });

// //       if (error) {
// //         console.error("Error fetching payment history:", error);
// //         return [];
// //       }

// //       return data || [];
// //     } catch (error) {
// //       console.error("getPaymentHistory error:", error);
// //       return [];
// //     }
// //   }

// //   // Calculate usage statistics
// //   static calculateUsageStats(
// //     usage: UserUsage | null, 
// //     subscription: CurrentSubscription | null
// //   ) {
// //     const defaultLimits = {
// //       jobs_per_month: 50,
// //       applications_per_day: 5,
// //       resumes: 1,
// //       auto_scrape_enabled: false,
// //       priority_support: false,
// //     };

// //     const limits = subscription ? {
// //       jobs_per_month: subscription.max_jobs_per_month || defaultLimits.jobs_per_month,
// //       applications_per_day: subscription.max_applications_per_day || defaultLimits.applications_per_day,
// //       resumes: subscription.max_resumes || defaultLimits.resumes,
// //       auto_scrape_enabled: subscription.features?.includes('auto_scrape') || false,
// //       priority_support: subscription.features?.includes('priority_support') || false,
// //     } : defaultLimits;

// //     const current = usage ? {
// //       jobs_scraped: usage.jobs_scraped || 0,
// //       applications_sent: usage.applications_sent || 0,
// //       resumes_uploaded: usage.resumes_uploaded || 0,
// //     } : {
// //       jobs_scraped: 0,
// //       applications_sent: 0,
// //       resumes_uploaded: 0,
// //     };

// //     return {
// //       current_month: current,
// //       limits,
// //       percentage_used: {
// //         jobs: limits.jobs_per_month > 0 ? Math.round((current.jobs_scraped / limits.jobs_per_month) * 100) : 0,
// //         applications: limits.applications_per_day > 0 ? Math.round((current.applications_sent / limits.applications_per_day) * 100) : 0,
// //         resumes: limits.resumes > 0 ? Math.round((current.resumes_uploaded / limits.resumes) * 100) : 0,
// //       }
// //     };
// //   }

// //   // Create Stripe checkout session
// //   static async createCheckoutSession(
// //     userId: string,
// //     planId: string,
// //     billingCycle: 'monthly' | 'yearly'
// //   ): Promise<{ url: string } | null> {
// //     try {
// //       const response = await fetch("/api/stripe/create-checkout-session", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           userId,
// //           planId,
// //           billingCycle,
// //         }),
// //       });

// //       if (!response.ok) {
// //         throw new Error("Failed to create checkout session");
// //       }

// //       return await response.json();
// //     } catch (error) {
// //       console.error("createCheckoutSession error:", error);
// //       return null;
// //     }
// //   }

// //   // Cancel subscription
// //   static async cancelSubscription(subscriptionId: string): Promise<boolean> {
// //     try {
// //       const { error } = await supabase
// //         .from("user_subscriptions")
// //         .update({
// //           status: "canceled",
// //           canceled_at: new Date().toISOString(),
// //           updated_at: new Date().toISOString(),
// //         })
// //         .eq("id", subscriptionId);

// //       if (error) {
// //         console.error("Error canceling subscription:", error);
// //         return false;
// //       }

// //       return true;
// //     } catch (error) {
// //       console.error("cancelSubscription error:", error);
// //       return false;
// //     }
// //   }
// // }

