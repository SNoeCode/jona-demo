"use client";
import React, { useState, useEffect, useCallback,useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit,
  RefreshCw,
  ExternalLink,
  MapPin,
  Building,
  Calendar,
  DollarSign,
} from "lucide-react";
import { AuthUser,UserJobStatus } from "@/types/user/index"
import { getAllJobs,deleteJob,exportJobsToCSV} from "@/services/admin/admin_jobs";
import {bulkDeleteJobs} from "@/services/admin/admin_bulk";
import { AdminJob } from "@/types/admin/admin_jobs";
import { useUserJobStatus } from "@/hooks/useUserJobStatus";
interface JobManagementProps {
  user: AuthUser;
  onStatsUpdate: () => void;
}
interface BaseJob {
  id: string;
  title: string;
  company?: string;
  job_location?: string;
  salary?: number;
  status?:
    | "pending"
    | "applied"
    | "interview"
    | "rejected"
    | "offer"
    | "submitted"
    | null;
  date?: string;
  link?: string | null;
}

interface Job extends BaseJob {
  saved?: boolean;
  applied?: boolean;
}
type JobWithoutStatus = Omit<Job, "status">;
export type JobStatus =
  | "new"
  | "open"
  | "closed"
  | "pending"
  | "applied"
  | "interview"
  | "rejected"
  | "offer"
  | null;

export interface ExtendedAdminJob extends JobWithoutStatus {
  status?: string | null;
  applications_count?: number;
  views_count?: number;
  posted_date?: string;
  site?: string;
  link?: string | null;
}
export const normalize = <T extends string | number | boolean | object>(
  value: T | null
): T | undefined => {
  return value === null ? undefined : value;
};

export const JobManagement: React.FC<JobManagementProps> = ({
  user,
  onStatsUpdate,
}) => {
  const [jobs, setJobs] = useState<ExtendedAdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
const { statusMap, loading: statusLoading } = useUserJobStatus();

  const itemsPerPage = 20;

  const transformAdminJob = (job: AdminJob): ExtendedAdminJob => ({
    ...job,
    company: job.company ?? undefined,
    job_location: job.job_location ?? undefined,
    salary: job.salary != null ? Number(job.salary) : undefined,
    status: job.status ?? null,
    date: job.date ?? undefined,
    link: job.site ?? undefined,
    saved: job.saved ?? false,
    applied: job.applied ?? false,
    applications_count: job.application_count ?? 0,
    // views_count: job.views_count ?? 0,
    posted_date: job.inserted_at ?? undefined,
    site: job.site ?? undefined,
  });

  
  const fetchJobs = useCallback(async () => {
  setLoading(true);
  try {
    const jobsData = await getAllJobs({
      search: searchTerm || undefined,
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    });

    const transformedJobs = jobsData.map(transformAdminJob);
const enrichedJobs = transformedJobs.map((job) => {
// const enrichedJobs = jobs.map((job) => {
  const status = statusMap.get(job.id) ?? {};
  return {
    ...job,
    ...status,
  };
});
    // Enrich with user-specific status
    // const enrichedJobs = transformedJobs.map((job) => {
    //   const status = statusMap.get(job.id) ?? {};
    //   return {
    //     ...job,
    //     ...status, // includes fields like `status`, `match_score`, etc.
    //   };
    // });

    setJobs(enrichedJobs);

    const allJobs = await getAllJobs();
    setTotalPages(Math.ceil(allJobs.length / itemsPerPage));
  } catch (error) {
    console.error("Error fetching jobs:", error);
  } finally {
    setLoading(false);
  }
}, [currentPage, searchTerm, filterStatus, statusMap]);

const enrichedJobs = useMemo(() => {
  return jobs.map((job) => {
    const status = statusMap.get(job.id) ?? {};
    return {
      ...job,
      ...status,
    };
  });
}, [jobs, statusMap]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!user) return;

    console.log("User loaded:", user);
    // Or trigger some logic based on user.role, user.id, etc.
  }, [user]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await deleteJob(jobId);
      setJobs(jobs.filter((job) => job.id !== jobId));
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
      onStatsUpdate();
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;
    if (
      !confirm(`Are you sure you want to delete ${selectedJobs.length} jobs?`)
    )
      return;

    try {
      await bulkDeleteJobs(selectedJobs);
      setJobs(jobs.filter((job) => !selectedJobs.includes(job.id)));
      setSelectedJobs([]);
      onStatsUpdate();
    } catch (error) {
      console.error("Error bulk deleting jobs:", error);
    }
  };

  const handleExportJobs = async () => {
    try {
      const csvContent = await exportJobsToCSV();
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting jobs:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((job) => job.id));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary?: number): string => {
    if (salary == null) return "N/A";
    return `$${salary.toLocaleString()}`;
  };
  const getStatusBadge = (status?: string) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      closed: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800",
    };

    const statusClass =
      statusClasses[status as keyof typeof statusClasses] ||
      "bg-gray-100 text-gray-800";

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
        {status || "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportJobs}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {selectedJobs.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedJobs.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedJobs.length === jobs.length && jobs.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Posted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobs([...selectedJobs, job.id]);
                        } else {
                          setSelectedJobs(
                            selectedJobs.filter((id) => id !== job.id)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">
                        {job.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.applied && (
                          <span className="text-green-600">Applied • </span>
                        )}
                        {job.saved && (
                          <span className="text-blue-600">Saved • </span>
                        )}
                        Site: {job.site}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-y-1 flex-col">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building className="w-4 h-4 mr-1 text-gray-400" />
                        {job.company || "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {job.job_location || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      {formatSalary(job.salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(job.status || undefined)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(job.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {job.link && (
                        <a
                          href={job.link ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          title="View original job posting"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          /* TODO: Implement view job details */
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          /* TODO: Implement edit job */
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit job"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, jobs.length)} of results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm border border-gray-300 rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No jobs found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Jobs will appear here once they are scraped or added."}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobManagement;

