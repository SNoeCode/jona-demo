import { supabase } from "@/lib/supabaseClient";
import { safeSelect } from "@/lib/safeFetch";
import type { JobApplication, SubmitApplicationParams, ApplicationRecord, SubmittedJob } from "@/types/user";

export class ApplicationService {
  static async getSubmittedJobs(userId: string): Promise<SubmittedJob[]> {
    const response = await supabase
      .from("submitted_jobs")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<SubmittedJob[]>(response, "submitted_jobs");
  }

  static async getJobApplications(userId: string): Promise<JobApplication[]> {
    const response = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<JobApplication[]>(response, "job_applications");
  }

  static async getApplicationRecords(userId: string): Promise<ApplicationRecord[]> {
    const response = await supabase
      .from("application_records")
      .select("*")
      .eq("user_id", userId);

    return safeSelect<ApplicationRecord[]>(response, "application_records");
  }

  static async createApplication(applicationData: {
    job_id: string;
    job_title: string;
    company: string;
    status: 'pending' | 'success' | 'error';
    submitted_at: string;
    user_email: string;
    resume_id?: string;
    user_id?: string;
  }): Promise<{
    success: boolean;
    data?: ApplicationRecord;
    error?: string;
  }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return {
          success: false,
          error: 'Authentication required'
        };
      }
   const userId = applicationData.user_id || session.user.id;

       const fullApplicationData = {
        ...applicationData,
        user_id: userId,
        resume_id: applicationData.resume_id || '', // Default empty string if not provided
        resume_text: '', // Default empty string for now
        submitted_to: [], // Default empty array
        resume_length: 0, // Default 0 for now
      };

      console.log('Creating application record:', fullApplicationData);
  const { data, error } = await supabase
        .from('applications')
        .insert([fullApplicationData])
        .select()
        .single();

      if (error) {
        console.error('Application creation error:', error);
        return {
          success: false,
          error: `Failed to create application: ${error.message}`
        };
      }

      console.log('Application created successfully:', data);

      return {
        success: true,
        data: data as ApplicationRecord
      };

    } catch (error) {
      console.error('createApplication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async submitApplication(params: SubmitApplicationParams): Promise<{
    success: boolean;
    data?: ApplicationRecord;
    error?: string;
  }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      const applicationData: Omit<ApplicationRecord, 'id'> = {
        resume_id: params.resumeId,
        resume_text: params.resumeText,
        job_id: params.jobId,
        job_title: params.jobTitle,
        company: params.company,
        user_id: params.userId,
        user_email: params.userEmail,
        submitted_at: new Date().toISOString(),
        submitted_to: params.submittedTo || [],
        resume_length: params.resumeLength || params.resumeText.length,
        status: 'pending'
      };

      console.log('Submitting application:', applicationData);

      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error('Application submission error:', error);
        return {
          success: false,
          error: `Failed to save application: ${error.message}`
        };
      }

      console.log('Application submitted successfully:', data);

      return {
        success: true,
        data: data as ApplicationRecord
      };

    } catch (error) {
      console.error('Application service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

   static async getUserApplications(userId: string): Promise<{
    success: boolean;
    data?: ApplicationRecord[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return {
          success: false,
          error: error.message
        };
      }
console.log("Fetched applications:", data);
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('getUserApplications error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

 static async updateApplicationStatus(
    applicationId: string, 
    status: 'pending' | 'success' | 'error'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error('updateApplicationStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getApplicationStats(userId: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      pending: number;
      successful: number;
      failed: number;
      thisMonth: number;
      thisWeek: number;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status, submitted_at')
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      const stats = {
        total: data.length,
        pending: data.filter(app => app.status === 'pending').length,
        successful: data.filter(app => app.status === 'success').length,
        failed: data.filter(app => app.status === 'error').length,
        thisMonth: data.filter(app => 
          new Date(app.submitted_at) >= thisMonth
        ).length,
        thisWeek: data.filter(app => 
          new Date(app.submitted_at) >= thisWeek
        ).length,
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('getApplicationStats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

static async hasAppliedToJob(userId: string, jobId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .limit(1);

      if (error) {
        console.error('Error checking application status:', error);
        return false;
      }

      return (data?.length || 0) > 0;

    } catch (error) {
      console.error('hasAppliedToJob error:', error);
      return false;
    }
  }
};