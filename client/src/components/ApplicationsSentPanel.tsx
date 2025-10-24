"use client";
import { useMemo } from "react";
import { useSentApplications } from "@/hooks/useSentApplications";
import { ApplicationsSentPanelProps, Job } from "@/types/user/index";

export default function ApplicationsSentPanel({
  jobs,
  user,
  darkMode,
}: ApplicationsSentPanelProps) {
  if (!user?.id) {
    return (
      <div className="p-4 text-center">
        <p>Please log in to view your applications.</p>
      </div>
    );
  }
  const { applications, loading, error } = useSentApplications(user.id);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    success: applications.filter((a) => a.status === "success").length,
    failed: applications.filter((a) => a.status === "error").length,
    thisMonth: applications.filter(
      (a) =>
        new Date(a.sentAt) >=
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ).length,
    thisWeek: applications.filter(
      (a) =>
        new Date(a.sentAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  const jobMap = useMemo(() => {
    const map = new Map<string, Job>();
    jobs.forEach((job) => map.set(job.id.toString(), job));
    return map;
  }, [jobs]);

  const getJobDetails = (jobId: string) => jobMap.get(jobId.toString());
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "America/New_York", // or whatever timezone you want
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return darkMode
          ? "text-green-400 bg-green-900/20"
          : "text-green-700 bg-green-100";
      case "error":
      case "failed":
        return darkMode
          ? "text-red-400 bg-red-900/20"
          : "text-red-700 bg-red-100";
      case "pending":
        return darkMode
          ? "text-yellow-400 bg-yellow-900/20"
          : "text-yellow-700 bg-yellow-100";
      default:
        return darkMode
          ? "text-gray-400 bg-gray-800"
          : "text-gray-700 bg-gray-100";
    }
  };
  return (
    <div
      className={`p-6 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      } rounded-lg shadow-sm`}
    >
      <h2 className="text-2xl font-semibold mb-6">Applications Sent</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading applications...</span>
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-green-900/20" : "bg-green-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.success}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-yellow-900/20" : "bg-yellow-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-red-900/20" : "bg-red-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-blue-900/20" : "bg-blue-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.thisMonth}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-purple-900/20" : "bg-purple-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.thisWeek}
              </p>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p
                className={`text-lg ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No applications sent yet
              </p>
              <p
                className={`text-sm mt-2 ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Start applying to jobs to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Recent Applications
              </h3>
              {applications.map((application) => {
                const jobDetails = getJobDetails(application.job_id);
                return (
                  <div
                    key={application.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-orange-500">
                            {jobDetails?.title ||
                              application.job_title ||
                              `Job ID: ${application.job_id}`}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              application.status
                            )}`}
                          >
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </span>
                        </div>

                        {jobDetails && (
                          <div
                            className={`text-sm space-y-1 ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <p>
                              <strong>Company:</strong>{" "}
                              {jobDetails.company || "N/A"}
                            </p>
                            <p>
                              <strong>Location:</strong>{" "}
                              {jobDetails.job_location || "N/A"}
                            </p>
                            {jobDetails.salary && (
                              <p>
                                <strong>Salary:</strong> {jobDetails.salary}
                              </p>
                            )}
                          </div>
                        )}
                        {/* https://brassring.com/ */}
                        <div
                          className={`text-xs mt-2 ${
                            darkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          <p>
                            <strong>Application Sent:</strong>{" "}
                            {formatDate(application.sentAt)}
                          </p>
                          {application.appliedVia && (
                            <p>
                              <strong>Applied Via:</strong>{" "}
                              {application.appliedVia}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {jobDetails?.url && (
                          <a
                            href={jobDetails.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm underline hover:no-underline transition-colors ${
                              darkMode
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            View Job
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
