
import { useEffect, useState, useCallback } from "react";
import type { SubmittedJob, AuthUser } from "@/types/user/index";
import { ApplicationService } from "@/services/user-services/application-service";

export const useApplicationTracker = (userId: string, authUser?: AuthUser) => {
  const [submittedJobs, setSubmittedJobs] = useState<SubmittedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (authUser) {
        const { success, data, error: dbError } = await ApplicationService.getUserApplications(userId);

        if (success && data) {
          const transformedJobs: SubmittedJob[] = data.map((app): SubmittedJob => ({
            id: app.job_id,
            job_id: app.job_id,
            user_id: app.user_id,
            job_title: app.job_title,
            company: app.company,
            submittedTo: app.submitted_to || [],
            resumeLength: app.resume_length,
            status: app.status,
            sentAt: app.submitted_at,
          }));

          setSubmittedJobs(transformedJobs);
          localStorage.setItem(`submitted_jobs_${userId}`, JSON.stringify(transformedJobs));
          return;
        } else {
          console.warn("Failed to load from database:", dbError);
        }
      }

      const stored = localStorage.getItem(`submitted_jobs_${userId}`);
      if (stored) {
        const localJobs = JSON.parse(stored) as SubmittedJob[];
        setSubmittedJobs(localJobs);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load applications";
      console.error("Error loading applications:", err);
      setError(errorMessage);

      try {
        const stored = localStorage.getItem(`submitted_jobs_${userId}`);
        if (stored) {
          setSubmittedJobs(JSON.parse(stored));
        }
      } catch (localStorageError) {
        console.error("LocalStorage fallback failed:", localStorageError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, authUser]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const addSubmission = useCallback(
    async (
      job: Omit<SubmittedJob, "sentAt">,
      resumeData?: {
        resumeId: string;
        resumeText: string;
        userEmail: string;
      }
    ) => {
      const newEntry: SubmittedJob = {
        ...job,
        sentAt: new Date().toISOString(),
        status: "pending",
      };

      const updated = [newEntry, ...submittedJobs];
      setSubmittedJobs(updated);
      localStorage.setItem(`submitted_jobs_${userId}`, JSON.stringify(updated));

      if (resumeData && authUser) {
        try {
          const { success, data, error: submitError } = await ApplicationService.submitApplication({
            resumeId: resumeData.resumeId,
            resumeText: resumeData.resumeText,
            jobId: job.id,
            jobTitle: job.job_title,
            company: job.company,
            userId: userId,
            userEmail: resumeData.userEmail,
            submittedTo: job.submittedTo,
            resumeLength: job.resumeLength,
          });

         const updatedJobs: SubmittedJob[] = updated.map((j) =>
  j.id === job.id
    ? {
        ...j,
        status: success ? ("success" as const) : ("error" as const),
      }
    : j
);
setSubmittedJobs(updatedJobs);
localStorage.setItem(`submitted_jobs_${userId}`, JSON.stringify(updatedJobs));
        } catch (err) {
          console.error("Error saving application to database:", err);
         const updatedJobs: SubmittedJob[] = updated.map((j) =>
  j.id === job.id
    ? {
        ...j,
        status: "error" as const,
      }
    : j
);
setSubmittedJobs(updatedJobs);
localStorage.setItem(`submitted_jobs_${userId}`, JSON.stringify(updatedJobs));
        }
      }

      return newEntry;
    },
    [submittedJobs, userId, authUser]
  );

  const updateApplicationStatus = useCallback(
    (jobId: string, status: "pending" | "success" | "error") => {
      const updatedJobs = submittedJobs.map((job) =>
        job.id === jobId ? { ...job, status } : job
      );
      setSubmittedJobs(updatedJobs);
      localStorage.setItem(`submitted_jobs_${userId}`, JSON.stringify(updatedJobs));
    },
    [submittedJobs, userId]
  );

  const hasAppliedTo = useCallback(
    (jobId: string): boolean => {
      return submittedJobs.some((job) => job.id === jobId);
    },
    [submittedJobs]
  );

  const getStats = useCallback(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: submittedJobs.length,
      pending: submittedJobs.filter((job) => job.status === "pending").length,
      successful: submittedJobs.filter((job) => job.status === "success").length,
      failed: submittedJobs.filter((job) => job.status === "error").length,
      thisMonth: submittedJobs.filter((job) => new Date(job.sentAt) >= thisMonth).length,
      thisWeek: submittedJobs.filter((job) => new Date(job.sentAt) >= thisWeek).length,
    };
  }, [submittedJobs]);

  return {
    submittedJobs,
    addSubmission,
    updateApplicationStatus,
    hasAppliedTo,
    getStats,
    isLoading,
    error,
    refreshApplications: loadApplications,
  };
};