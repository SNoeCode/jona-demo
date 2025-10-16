"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  User,
  Calendar,
  //   BarChart3,
  ExternalLink,
  Filter,
  Star,
} from "lucide-react";
import {  } from "@/types/admin/admin_resume";

import {  AuthUser } from "@/types/user";
import { ResumeAdmin,AdminResume } from '@/types/admin/admin_resume'
import { getAllResumes, deleteResume } from "@/services/admin/admin_resume"
interface ResumeManagementProps {
  user: AuthUser | null;
  onStatsUpdate: () => void;
}


type SortOption = "date" | "match_score" | "user_name";
export const ResumeManagement: React.FC<ResumeManagementProps> = ({
  user,
  onStatsUpdate,
}) => {
  const [resumes, setResumes] = useState<AdminResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "match_score" | "user_name">(
    "date"
  );
  const [selectedResume, setSelectedResume] = useState<AdminResume | null>(
    null
  );

  useEffect(() => {
    fetchResumes();
  }, []);
useEffect(() => {
  if (!user) return;

  console.log('User loaded:', user);
}, [user]);


  const fetchResumes = async () => {
    setLoading(true);
    try {
      const resumesData = await getAllResumes();
      setResumes(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      await deleteResume(resumeId);
      setResumes(resumes.filter((resume) => resume.id !== resumeId));
      setSelectedResumes(selectedResumes.filter((id) => id !== resumeId));
      onStatsUpdate();
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  const handleViewResume = (resume: AdminResume) => {
    setSelectedResume(resume);
  };

  const handleCloseModal = () => {
    setSelectedResume(null);
  };

  const handleDownloadResume = async (resume: AdminResume) => {
    if (resume.file_url) {
      try {
        const response = await fetch(resume.file_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          resume.original_filename || `resume-${resume.user_name}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading resume:", error);
        alert("Failed to download resume");
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedResumes.length === sortedResumes.length) {
      setSelectedResumes([]);
    } else {
      setSelectedResumes(sortedResumes.map((resume) => resume.id));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatchScoreBadge = (score?: number) => {
    const textColor = getMatchScoreColor(score);
    const bgColor = !score
      ? "bg-gray-100"
      : score >= 80
      ? "bg-green-100"
      : score >= 60
      ? "bg-yellow-100"
      : "bg-red-100";

    return (
      <span className={`px-2 py-1 text-xs rounded ${bgColor} ${textColor}`}>
        {score ? `${score}%` : "N/A"}
      </span>
    );
  };
  // Filter and sort resumes
//   const filteredResumes = resumes.filter(
//     (resume) =>
//       resume.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       resume.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       resume.original_filename?.toLowerCase().includes(searchTerm.toLowerCase())
//   );
const safeSearchTerm = searchTerm?.toLowerCase() ?? "";

const filteredResumes = resumes.filter((resume) => {
  const nameMatch = resume.user_name?.toLowerCase().includes(safeSearchTerm) ?? false;
  const emailMatch = resume.user_email?.toLowerCase().includes(safeSearchTerm) ?? false;
  const filenameMatch = resume.original_filename?.toLowerCase().includes(safeSearchTerm) ?? false;

  return nameMatch || emailMatch || filenameMatch;
});


  const sortedResumes = [...filteredResumes].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return (
          new Date(b.uploaded_date || 0).getTime() -
          new Date(a.uploaded_date || 0).getTime()
        );
      case "match_score":
        return (b.match_score || 0) - (a.match_score || 0);
      case "user_name":
        return (a.user_name || "").localeCompare(b.user_name || "");
      default:
        return 0;
    }
  });

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
        <h2 className="text-2xl font-bold text-gray-900">Resume Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchResumes}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {selectedResumes.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(`Delete ${selectedResumes.length} selected resumes?`)
                ) {
                  selectedResumes.forEach((id) => handleDeleteResume(id));
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedResumes.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or filename..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortBy(e.target.value as SortOption)
            }
          >
            <option value="date">Sort by Date</option>
            <option value="match_score">Sort by Match Score</option>
            <option value="user_name">Sort by User Name</option>
          </select>
        </div>
      </div>

      {/* Resume Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {sortedResumes.length}
          </div>
          <div className="text-sm text-gray-600">Total Resumes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          {/* <div className="text-2xl font-bold text-blue-600">
            {Math.round(sortedResumes.reduce((sum, r) => sum + (r.match_score || 0), 0) / (sortedResumes.length || 1))}%
          </div> */}
          <div className="flex items-center text-2xl font-bold gap-2">
            {getMatchScoreBadge(
              Math.round(
                sortedResumes.reduce(
                  (sum, r) => sum + (r.match_score || 0),
                  0
                ) / (sortedResumes.length || 1)
              )
            )}
          </div>
          <div className="text-sm text-gray-600">Avg Match Score</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {sortedResumes.filter((r) => (r.match_score || 0) >= 80).length}
          </div>
          <div className="text-sm text-gray-600">High Match (80%+)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {sortedResumes.reduce(
              (sum, r) => sum + (r.applications_sent || 0),
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
      </div>

      {/* Resumes Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedResumes.length === sortedResumes.length &&
                      sortedResumes.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedResumes.includes(resume.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResumes([...selectedResumes, resume.id]);
                        } else {
                          setSelectedResumes(
                            selectedResumes.filter((id) => id !== resume.id)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 max-w-xs truncate">
                          {resume.original_filename || "Unnamed Resume"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.file_type || "PDF"} •{" "}
                          {resume.applications_sent || 0} applications
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {resume.user_name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.user_email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getMatchScoreBadge(resume.match_score)}
                      {resume.match_score && resume.match_score >= 80 && (
                        <Star className="w-4 h-4 text-yellow-400 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(resume.uploaded_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewResume(resume)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View resume content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadResume(resume)}
                        className="text-green-600 hover:text-green-900"
                        title="Download resume"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {resume.file_url && (
                        <a
                          href={resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-900"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete resume"
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

      {/* Empty State */}
      {sortedResumes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <FileText className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No resumes found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Resumes will appear here once users upload them."}
          </p>
        </div>
      )}

      {/* Resume Preview Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Resume Preview: {selectedResume.original_filename}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  User Information
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedResume.user_name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedResume.user_email}
                  </div>
                  <div>
                    <strong>Uploaded:</strong>{" "}
                    {formatDate(selectedResume.uploaded_date)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Resume Stats
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Match Score:</strong>{" "}
                    {getMatchScoreBadge(selectedResume.match_score)}
                  </div>
                  <div>
                    <strong>Applications:</strong>{" "}
                    {selectedResume.applications_sent || 0}
                  </div>
                  <div>
                    <strong>File Type:</strong>{" "}
                    {selectedResume.file_type || "PDF"}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Years:</strong>{" "}
                    {selectedResume.experience_years || "N/A"}
                  </div>
                  <div>
                    <strong>Education:</strong>{" "}
                    {selectedResume.education || "N/A"}
                  </div>
                  <div>
                    <strong>Skills:</strong>{" "}
                    {selectedResume.skills?.length || 0} listed
                  </div>
                </div>
              </div>
            </div>

            {selectedResume.parsed_content && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Resume Content
                </h4>
                <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {selectedResume.parsed_content}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => handleDownloadResume(selectedResume)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeManagement;
