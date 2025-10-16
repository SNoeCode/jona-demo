
"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { JobService } from "@/services/user-services/job-service";
import { supabase } from "@/lib/supabaseClient";
import type { AuthUser, Job } from "@/types/user/index";
import { TabNavigation } from "@/components/dashboard/TabsNavigation";
import { JobTrackerTab } from "@/components/dashboard/JobTrackerTab";
import { ResumeTab } from "@/components/resume/ResumeTab";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { NotificationsTab } from "@/components/notifications/NotificationTab";
import { CalendarTab } from "./CalendarTab";
import { CalendarWidget } from "./CalendarWidget";
import { Dispatch, SetStateAction } from "react";
import { useJobStatusWriter } from "@/hooks/useUserJobStatus";
import {
  SubmittedJob,
  DashboardStatsProps,
  JobApplication,
  UserJobStatus,
  BaseDashboardStats,
  JobStats,
  Resume,
} from "@/types/user/index";
import { useAuth } from "@/context/AuthUserContext";
import Profile from "@/components/profile/Profile";
import { useRouter } from "next/navigation";
export interface DashboardProps {
  user: AuthUser;
  applications: JobApplication[];
  stats: BaseDashboardStats;
  allJobs: (Job & Partial<UserJobStatus>)[];
  userResumes: Resume[];
  darkMode: boolean; // ✅ Add this line
  setCurrentPageAction?: (page: string | ((prev: string) => string)) => void;
}
export interface JobTrackerTabProps {
  jobs: Job[];
  onJobUpdateAction: (jobId: string, update: Partial<Job>) => void;
  onApplyStatusChangeAction: (jobId: string, applied: boolean) => void;
  onToggleSavedAction: (jobId: string, currentSaved: boolean) => Promise<void>;
  darkMode: boolean;
  userId: string;
  userEmail: string; // Add this line
}
export type JobStatus =
  | "applied"
  | "pending"
  | "interview"
  | "rejected"
  | "offer";

export default function Dashboard({
  user,
  setCurrentPageAction,
  applications,
  stats,
  allJobs,
  userResumes,
}: DashboardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previousTab, setPreviousTab] = useState("dashboard");
  const [tabDirection, setTabDirection] = useState<"left" | "right">("right");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [todayOnly, setTodayOnly] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState({
    active: false,
    lastRun: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Use the fixed hook
  const { upsertStatus } = useJobStatusWriter();
  const {authUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const localKey = `user_preferences_${user.id}`;
  const [jobCount, setJobCount] = useState<number | null>(null);
  const router = useRouter();
  const fetchJobs = async (): Promise<Job[]> => {
    try {
      setIsLoading(true);
      const allJobs = await JobService.getAllJobs(user.id);
      console.log("📦 Total jobs fetched:", allJobs.length);
      setJobs(allJobs);
      setScrapingStatus({
        active: true,
        lastRun: new Date().toLocaleString(),
      });
      return allJobs;
    } catch (error) {
      console.error("❌ Failed to fetch jobs:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    const sub = supabase
      .channel("jobs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          const { eventType, new: newJob, old: oldJob } = payload;

          const transformJob = (job: any): Job => ({
            id: job.id,
            title: job.title,
            company: job.company ?? undefined,
            job_location: job.job_location ?? undefined,
            salary: job.salary ?? undefined,
            site: job.site || "",
            date: job.date
              ? new Date(job.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            applied: job.applied ?? false,
            saved: job.saved ?? false,
            url: job.url || "",
            job_description: job.job_description ?? undefined,
            category: job.category ?? undefined,
            priority: job.priority ?? undefined,
            status: job.status ?? undefined,
            search_term: job.search_term ?? undefined,
            skills: job.skills ?? [],
            inserted_at: job.inserted_at ?? null,
          });

          setJobs((prev: Job[]) => {
            switch (eventType) {
              case "INSERT":
                return [transformJob(newJob), ...prev];
              case "UPDATE":
                return prev.map((j) =>
                  j.id === newJob.id ? { ...j, ...transformJob(newJob) } : j
                );
              case "DELETE":
                return prev.filter((j) => j.id !== oldJob.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [user.id]);

  useEffect(() => {
    const verifyCount = async () => {
      const dbCount = await JobService.getJobCount();
      setJobCount(dbCount);
    };
    verifyCount();
  }, [jobs.length]);

  const mismatch = jobCount !== null && jobCount !== jobs.length;

  useEffect(() => {
    const stored = localStorage.getItem(localKey);
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        // Load preferences (if any)
      } catch (error) {
        console.error("Failed to parse user preferences:", error);
      }
    }
  }, [user.id]);

  const toggleJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      await upsertStatus({
        user_id: user.id,
        job_id: jobId,
        status,
        applied: status === "applied",
        created_at: new Date().toISOString(),
      });

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status, applied: status === "applied" } : j
        )
      );
    } catch (error) {
      console.error("❌ Failed to update job status:", error);
    }
  };

  const handleToggleSaved = async (jobId: string, currentSaved: boolean) => {
    try {
      await upsertStatus({
        user_id: user.id,
        job_id: jobId,
        saved: !currentSaved,
        created_at: new Date().toISOString(),
      });

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, saved: !currentSaved } : j))
      );
    } catch (error) {
      console.error("❌ Failed to toggle saved status:", error);
    }
  };

  const handleJobsUpdate = async (jobId: string, update: Partial<Job>) => {
    try {
      await JobService.updateUserJobStatus(user.id, jobId, update);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, ...update } : j))
      );
      const userActions = JSON.parse(
        localStorage.getItem(`user_actions_${user.id}`) || "{}"
      );
      userActions[jobId] = { ...userActions[jobId], ...update };
      localStorage.setItem(
        `user_actions_${user.id}`,
        JSON.stringify(userActions)
      );
    } catch (error) {
      console.error("❌ Failed to update job:", error);
    }
  };

  const handleApplyStatusChange = async (jobId: string, applied: boolean) => {
    try {
      await JobService.updateUserJobStatus(user.id, jobId, { applied });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, applied } : j))
      );
      const userActions = JSON.parse(
        localStorage.getItem(`user_actions_${user.id}`) || "{}"
      );
      userActions[jobId] = { ...userActions[jobId], applied };
      localStorage.setItem(
        `user_actions_${user.id}`,
        JSON.stringify(userActions)
      );
    } catch (error) {
      console.error("❌ Failed to update applied status:", error);
    }
  };

  const handleRefreshJobs = () => {
    fetchJobs();
  };

  const handleTabChange = (newTab: string) => {
    // Updated to include calendar in the tab order
    const order = [
      "dashboard",
      "calendar",
      "resume",
      "settings",
      "notifications",
    ];
    const oldIndex = order.indexOf(activeTab);
    const newIndex = order.indexOf(newTab);
    setTabDirection(newIndex > oldIndex ? "right" : "left");
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
         
            {/* Main Job Tracker */}
            <JobTrackerTab
        jobs={jobs}
        onJobUpdateAction={handleJobsUpdate}
        onApplyStatusChangeAction={handleApplyStatusChange}
        onToggleSavedAction={handleToggleSaved}
        darkMode={darkMode}
        userId={user.id}
        userEmail={user.email ?? ''} // Add this line
      />
          </div>
        );
    case "calendar":
  return (
    <>
      <CalendarWidget
        jobs={jobs}
        userId={user.id}
        darkMode={false}
        onOpenFullCalendar={() => router.push("/calendar")}
      />
      <CalendarTab
        jobs={jobs}
        darkMode={darkMode}
        userId={user.id}
      />
    </>
  );
      case "resume":
        return (
          <ResumeTab
            user={{ ...user, email: user.email ?? "" }}
            darkMode={darkMode}
          />
        );
      case "settings":
        return (
          <SettingsTab
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            scrapingStatus={scrapingStatus}
          />
        );
      case "notifications":
        return (
          <NotificationsTab jobs={jobs} darkMode={darkMode} userId={user.id} />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefreshJobs}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh Jobs"}
            </button>
            <span className="text-sm text-gray-500">
              Last updated: {scrapingStatus.lastRun || "Never"}
            </span>
          </div>
        </div>

      <TabNavigation
          activeTab={activeTab}
          onTabChangeAction={handleTabChange}
          darkMode={darkMode}
          user={user}
          jobs={jobs}
        />

        <div
          key={activeTab}
          className={`transition-transform duration-500 ease-in-out ${
            tabDirection === "right"
              ? "animate-slide-in-left"
              : "animate-slide-in-right"
          }`}
        >
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
