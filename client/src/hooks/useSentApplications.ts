import { useEffect, useState, useCallback } from "react";
import { ApplicationService } from "@/services/user-services/application-service";

import type { ApplicationRecord } from "@/types/user";

interface SentApplication {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: 'pending' | 'success' | 'error' | 'trailing';
  sentAt: string;
  resume_id: string;
  user_email: string;
  submitted_to?: string[];
  resume_length?: number;
  appliedVia?: string;
}

export const useSentApplications = (userId: string) => {
  const [applications, setApplications] = useState<SentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!userId) {
      setApplications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { success, data, error: serviceError } = await ApplicationService.getUserApplications(userId);
      if (success && data) {
        const transformedApplications: SentApplication[] = data.map((app: ApplicationRecord) => ({
          id: app.id,
          job_id: app.job_id,
          job_title: app.job_title,
          company: app.company,
          status: app.status || 'pending',
          sentAt: app.submitted_at,
          resume_id: app.resume_id,
          user_email: app.user_email,
          submitted_to: app.submitted_to,
          resume_length: app.resume_length,
        }));
        setApplications(transformedApplications);
      } else {
        setError(serviceError || 'Failed to load applications');
        setApplications([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      console.error('Error loading sent applications:', err);
      setError(errorMessage);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const refreshApplications = useCallback(() => {
    loadApplications();
  }, [loadApplications]);

  const getStats = useCallback(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      success: applications.filter(app => app.status === 'success').length,
      failed: applications.filter(app => app.status === 'error').length,
      thisMonth: applications.filter(app => new Date(app.sentAt) >= thisMonth).length,
      thisWeek: applications.filter(app => new Date(app.sentAt) >= thisWeek).length,
    };
  }, [applications]);

  return {
    applications,
    loading,
    error,
    refreshApplications,
    getStats
  };
};