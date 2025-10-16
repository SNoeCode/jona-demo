"use client";

import React, { useState, useMemo, useEffect } from "react";
import { type Job, type JobFilterState } from "@/types/user/index";
import { JobService } from "@/services/user-services/job-service";
import { ApplicationService } from "@/services/user-services/application-service"; // Add this import
import JobFilter from "@/components/job-filter/JobFilter"

export interface JobTrackerTabProps {
  jobs: Job[];
  onJobUpdateAction: (jobId: string, update: Partial<Job>) => void;
  onApplyStatusChangeAction: (jobId: string, applied: boolean) => void;
  onToggleSavedAction: (jobId: string, currentSaved: boolean) => Promise<void>;
  darkMode: boolean;
  userId: string;
  userEmail: string; // Add this line
}

export const JobTrackerTab: React.FC<JobTrackerTabProps> = ({
  jobs,
  onJobUpdateAction,
  onApplyStatusChangeAction,
  onToggleSavedAction,
  darkMode,
  userId,
}) => {
  const [filters, setFilters] = useState<JobFilterState>({
    filter: "all",
    category: "all",
    priority: "all",
    status: "all",
    searchTerm: "",
    fromDate: undefined,
    toDate: undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 20;
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString("en-US") : "n/a";

  const newest = useMemo(() => {
    return [...jobs].sort(
      (a, b) =>
        new Date(b.inserted_at ?? "").getTime() -
        new Date(a.inserted_at ?? "").getTime()
    )[0];
  }, [jobs]);

  useEffect(() => {
    // console.log("📦 Jobs received:", jobs.length);
    // console.log("📅 Top job date:", formatDate(newest?.date));
    // console.log("📥 Most recent job inserted:", formatDate(newest?.inserted_at));
  }, [jobs, newest]);

  useEffect(() => {
    const stored = localStorage.getItem("pendingApplicationJobId");
    if (stored) {
      setPendingJobId(stored);
      setShowConfirmModal(true);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const persistJobsForUser = (updatedJobs: Job[]) => {
    localStorage.setItem(`jobs_${userId}`, JSON.stringify(updatedJobs));
  };

  // Updated function to handle both job status and application creation
  const handleApplyStatusChange = async (jobId: string, applied: boolean) => {
    try {
      // First update the job status
      onApplyStatusChangeAction(jobId, applied);
      
      // If marking as applied, create an application record
      if (applied) {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
          // Create application record
          const applicationData = {
            job_id: jobId,
            job_title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            status: 'pending' as const,
            submitted_at: new Date().toISOString(),
            user_email: '', // You'll need to get this from your auth context
            resume_id: '', // You might want to let user select or use default resume
          };

          const result = await ApplicationService.createApplication(applicationData);
          if (result.success) {
            console.log('✅ Application record created successfully');
          } else {
            console.error('❌ Failed to create application record:', result.error);
            // Optionally show a toast notification to user
          }
        }
      }
      
      const updated = jobs.map((j) =>
        j.id === jobId ? { ...j, applied } : j
      );
      persistJobsForUser(updated);
      
    } catch (error) {
      console.error('❌ Failed to handle apply status change:', error);
    }
  };

  const handleConfirmApplied = () => {
    if (pendingJobId) {
      handleApplyStatusChange(pendingJobId, true); // Use the updated function
      localStorage.removeItem("pendingApplicationJobId");
      setShowConfirmModal(false);
      setPendingJobId(null);
    }
  };

  const handleSkipApplied = () => {
    localStorage.removeItem("pendingApplicationJobId");
    setShowConfirmModal(false);
    setPendingJobId(null);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const { status, category, searchTerm, fromDate, toDate } = filters;

      if (status !== "all") {
        switch (status) {
          case "applied":
            if (!job.applied) return false;
            break;
          case "saved":
            if (!job.saved) return false;
            break;
          case "pending":
            if (job.applied) return false;
            break;
          case "interview":
          case "offer":
          case "rejected":
            if (job.status !== status) return false;
            break;
        }
      }

      // console.log("🔍 Current filters:", filters);
      // console.log("🧪 Checking job:", job.title);
      
      if (category !== "all") {
        const combinedFields = [
          job.title,
          job.search_term,
          job.job_description,
          job.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!combinedFields.includes(category.toLowerCase())) return false;
      }

      if (searchTerm?.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          job.title?.toLowerCase().includes(q) ||
          job.company?.toLowerCase().includes(q) ||
          job.job_location?.toLowerCase().includes(q);
        if (!match) return false;
      }

      const jobDate = job.date ? new Date(job.date) : null;
      if (fromDate && jobDate && jobDate < new Date(fromDate)) return false;
      if (toDate && jobDate && jobDate > new Date(toDate)) return false;

      return true;
    });
  }, [jobs, filters]);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(start, start + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const dashboardStats = {
    totalJobs: jobs.length,
    appliedJobs: jobs.filter((j) => j.applied).length,
    savedJobs: jobs.filter((j) => j.saved).length,
    pendingJobs: jobs.filter((j) => !j.applied).length,
    interviewJobs: jobs.filter((j) => j.status === "interview").length,
    offerJobs: jobs.filter((j) => j.status === "offer").length,
    totalUsers: 0,
    rejectedJobs: 0,
    matchRate: 0,
    matchScore: 0,
    activeUsers: 0,
    totalResumes: 0,
    avgMatchScore: 0,
    totalApplications: 0,
  };

  return (
    <>
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className={`p-6 rounded-lg shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              darkMode ? "bg-blue-800" : "bg-blue-100"
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                Total Jobs
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                {dashboardStats.totalJobs}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              darkMode ? "bg-green-800" : "bg-green-100"
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? "text-green-400" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                Applied
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                {dashboardStats.appliedJobs}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              darkMode ? "bg-blue-800" : "bg-blue-100"
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                Saved
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                {dashboardStats.savedJobs}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              darkMode ? "bg-orange-800" : "bg-orange-100"
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? "text-orange-400" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828a1.414 1.414 0 011.414 0L12 10.586l5.758-5.758a1.414 1.414 0 011.414 0l1.414 1.414a1.414 1.414 0 010 1.414L14.828 13l5.758 5.758a1.414 1.414 0 010 1.414l-1.414 1.414a1.414 1.414 0 01-1.414 0L12 15.828l-5.758 5.758a1.414 1.414 0 01-1.414 0L3.414 20a1.414 1.414 0 010-1.414L9.172 13 3.414 7.242a1.414 1.414 0 010-1.414l1.414-1.414z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                Pending
              </h3>
              <p className={`text-2xl font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                {dashboardStats.pendingJobs}
              </p>
            </div>
          </div>
        </div>
      </div>

      <JobFilter
        filters={filters}
        onFilterChange={setFilters}
        darkMode={darkMode}
      />

      <div className="mt-6 space-y-4">
        {paginatedJobs.length === 0 ? (
          <p className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            No jobs match your filters.
          </p>
        ) : (
          paginatedJobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 rounded-lg shadow-sm transition-all hover:shadow-md ${
                darkMode
                  ? "bg-gray-800 text-gray-100 border border-gray-700"
                  : "bg-white border border-gray-200 text-black"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-orange-500 dark:text-orange-400">
                    {job.title}
                  </h2>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {job.company} — {job.job_location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleSavedAction(job.id, job.saved ?? false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      job.saved
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {job.saved ? "★ Saved" : "☆ Save"}
                  </button>

                  <button
                    onClick={() => handleApplyStatusChange(job.id, !job.applied)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      job.applied
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {job.applied ? "✅ Applied" : "Apply"}
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm underline hover:no-underline transition-colors ${
                    darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  View Posting
                </a>
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Posted on: {job.date}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-3 text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:hover:bg-gray-200"
            }`}
          >
            Previous
          </button>
          <span className={`font-medium px-3 py-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:hover:bg-gray-200"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {showConfirmModal && pendingJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-lg p-6 shadow-lg ${
              darkMode
                ? "bg-gray-800 text-gray-100 border border-gray-700"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-orange-500 dark:text-orange-400">
              Did you apply?
            </h2>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              You clicked "Apply" on a job but didn't confirm. Would you like to mark it as applied now?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSkipApplied}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  darkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Not Yet
              </button>
              <button
                onClick={handleConfirmApplied}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Yes, I Applied
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};