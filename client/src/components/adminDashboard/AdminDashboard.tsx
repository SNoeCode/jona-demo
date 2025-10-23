"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Briefcase,
  RefreshCw,
  BarChart3,
  Play,
  Activity,
  CreditCard,
} from "lucide-react";
import { AdminUser, JobApplication } from "@/types/admin";
import { AuthUser } from "@/types/user/authUser";
import { AdminDashboardStats } from "@/types/admin/index";
import { UserJobStatus } from "@/types/user/index";
import { Job } from "@/types/user/index";
import { JobManagement } from "@/components/adminDashboard/JobsManagement";
import { UserManagement } from "@/components/adminDashboard/UserManagement";
import { ResumeManagement } from "@/components/adminDashboard/ResumeManagement";
import ScraperTabs from "./ScraperTab";
import { getInitialUserDashboardStats } from "@/types/user/dashboard";
import { useUserJobStatus } from "@/hooks/useUserJobStatus";
import AdminSubscriptionTab from "@/components/adminDashboard/SubscriptionTabs";
import { FilterOptions } from "@/types/admin";
import { getInitialAdminDashboardStats } from "@/utils/dashboardStats";
export interface AdminDashboardProps {
  initialJobs: Job[];
  initialUsers: AdminUser[];
  initialStats: AdminDashboardStats;
  initialFilters: FilterOptions;
  user: AuthUser;
  role: "admin";
  applications: JobApplication[];
}
type TabId =
  | "overview"
  | "jobs"
  | "users"
  | "resumes"
  | "scraper"
  | "subscriptions";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialJobs,
  initialUsers,
  initialStats,
  initialFilters,
  applications,
  user,
  role,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [stats, setStats] = useState<AdminDashboardStats>(
    getInitialAdminDashboardStats()
  );
  const [loading, setLoading] = useState(true);

  const [subscriptionStats, setSubscriptionStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyRecurringRevenue: 0,
  });

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: stats.totalJobs },
    { id: "users", label: "Users", icon: Users, count: stats.totalUsers },
    {
      id: "resumes",
      label: "Resumes",
      icon: FileText,
      count: stats.totalResumes,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: CreditCard,
      count: subscriptionStats.activeSubscriptions,
    },
    { id: "scraper", label: "Scraper", icon: Play },
  ];

  const statusMap = useUserJobStatus();

  useEffect(() => {
    let isMounted = true;
    fetchStats().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fix: Change the path to match your actual API route
      const res = await fetch("/api/admin/stats"); // Remove /dashboard from path
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const dashboardStats: AdminDashboardStats = await res.json();

      console.log("📊 Fetched dashboard stats:", dashboardStats); // Debug log

      setStats(dashboardStats);

      // If your API route returns subscription data, uncomment this:
      setSubscriptionStats({
        totalRevenue: dashboardStats.totalRevenue || 0,
        activeSubscriptions: dashboardStats.activeSubscriptions || 0,
        monthlyRecurringRevenue: dashboardStats.monthlyRecurringRevenue || 0,
      });
    } catch (error) {
      console.error("❌ Error fetching stats:", error);

      // Fallback to server action if API route fails
      try {
        console.log("🔄 Trying server action fallback...");
        const fallbackStats = getInitialAdminDashboardStats();
        setStats(fallbackStats);
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchStats();
    // fetchSubscriptionStats();
  };
if (user.user_metadata.role !== "admin") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-red-500">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">Admin privileges required.</p>
      </div>
    </div>
  );
}

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Header */}
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A57] dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Manage jobs, users, resumes, subscriptions and scraping
            </p>
          </div>
          <button
            onClick={refreshData}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF5722] dark:bg-[#FF8C5A] dark:hover:bg-[#FF6B35] text-white rounded-lg transition-colors shadow-md text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Enhanced Stats Cards - Only shown on overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-[#FF6B35]/10">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B35]" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalJobs}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats.appliedJobs} applied
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats.activeUsers} active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Resumes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalResumes}
                </p>
                <p className="text-xs text-[#00A6A6]">
                  {stats.avgMatchScore}% avg
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Applications</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalApplications}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total sent</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  ${subscriptionStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {subscriptionStats.activeSubscriptions} active
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Scrollable on mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav
            className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max"
            role="tablist"
            aria-label="Admin dashboard sections"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap focus:outline-none transition-colors ${
                  activeTab === tab.id
                    ? "border-[#FF6B35] text-[#FF6B35] dark:text-[#FF8C5A]"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Quick Actions - Mobile optimized */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={() => setActiveTab("jobs")}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center">
                        <Briefcase className="w-5 h-5 text-[#FF6B35] mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Manage Jobs</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {stats.totalJobs} total jobs
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("users")}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Manage Users</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {stats.totalUsers} registered users
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("resumes")}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Manage Resumes</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {stats.totalResumes} resumes uploaded
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("subscriptions")}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                            Manage Subscriptions
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            ${subscriptionStats.totalRevenue.toLocaleString()} total revenue
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("scraper")}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center">
                        <Play className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Job Scraper</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            Configure and run job scraper
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* System Status - Mobile optimized */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    System Status
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Jobs Applied</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Application rate
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.appliedJobs}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {stats.totalJobs > 0
                              ? Math.round((stats.appliedJobs / stats.totalJobs) * 100)
                              : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                            Average Match Score
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Resume compatibility
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.avgMatchScore}%
                          </div>
                          <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Good</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Monthly Revenue</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Subscription income
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            ${subscriptionStats.monthlyRecurringRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">MRR</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">User Activity</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Active users
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.activeUsers}
                          </div>
                          <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                            {stats.totalUsers > 0
                              ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                              : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Management */}
          {activeTab === "jobs" && (
            <JobManagement
              user={user}
              initialJobs={initialJobs}
              totalJobs={initialStats.totalJobs}
              onStatsUpdate={() => {
                console.log("Stats updated");
                refreshData();
              }}
            />
          )}

          {/* Users Management */}
          {activeTab === "users" && (
            <UserManagement user={user} onStatsUpdate={refreshData} />
          )}

          {/* Resumes Management */}
          {activeTab === "resumes" && (
            <ResumeManagement user={user} onStatsUpdate={refreshData} />
          )}

          {/* Subscriptions Management */}
          {activeTab === "subscriptions" && <AdminSubscriptionTab />}

          {/* Scraper Tab */}
          {activeTab === "scraper" && <ScraperTabs user={user} />}
        </div>
      </div>
    </div>
  </div>
);
}