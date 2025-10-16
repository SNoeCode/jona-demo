// client/src/app/services/admin/admin-service.ts
"use server";
import { supabase } from "@/lib/supabaseClient";

export class AdminService {
  private getAuthHeaders = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      
      if (error) {
        console.warn("Error getting session:", error.message);
      }

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || "dev-token"}`,
      };
    } catch (error) {
      console.warn("Failed to get auth headers:", error);
      return {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-token",
      };
    }
  };

  // Jobs Management
  async getAllJobs(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .limit(params?.limit || 50)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { data: [], error };
    }
  }

  async deleteJob(jobId: string) {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error };
    }
  }

  async updateJob(jobId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating job:', error);
      return { data: null, error };
    }
  }

  // Resumes Management
  async getAllResumes(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .limit(params?.limit || 50)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching resumes:', error);
      return { data: [], error };
    }
  }

  async deleteResume(resumeId: string) {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting resume:', error);
      return { success: false, error };
    }
  }

  // Subscription Management
  async getSubscriptionStats() {
    try {
          const stats = {
        total_subscriptions: 0,
        active_subscriptions: 0,
        trial_subscriptions: 0,
        expired_subscriptions: 0,
        monthly_revenue: 0,
        churn_rate: 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      return { 
        data: {
          total_subscriptions: 0,
          active_subscriptions: 0,
          trial_subscriptions: 0,
          expired_subscriptions: 0,
          monthly_revenue: 0,
          churn_rate: 0
        }, 
        error 
      };
    }
  }

  async getAllSubscriptions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    try {
           const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(params?.limit || 50)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return { data: [], error };
    }
  }

  async updateSubscription(subscriptionId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { data: null, error };
    }
  }

  // User Management
  async getAllUsers(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    try {
      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [], error };
    }
  }

  async updateUser(userId: string, updates: any) {
    try {
           return { data: null, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  }

  // Analytics
  async getAnalytics(timeframe: string = '7d') {
    try {
      // Mock analytics data
      const analytics = {
        jobs_scraped: 0,
        applications_submitted: 0,
        user_registrations: 0,
        active_users: 0,
        conversion_rate: 0
      };

      return { data: analytics, error: null };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { data: null, error };
    }
  }

  // Error Handling Helper
  handleError(error: any) {
    console.error('AdminService Error:', error);
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }

  // System Status
  async getSystemStatus() {
    try {
      return {
        status: 'operational',
        database: 'connected',
        scrapers: 'available',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'unknown',
        scrapers: 'unknown',
        last_updated: new Date().toISOString(),
        error: this.handleError(error)
      };
    }
  }
}

// Export singleton instance
// export const AdminService = new AdminService();