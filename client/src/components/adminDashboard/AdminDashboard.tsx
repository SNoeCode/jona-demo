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
  CreditCard
} from "lucide-react";
import { AdminUser, JobApplication } from "@/types/admin";
import { AuthUser} from "@/types/user/authUser";
import { AdminDashboardStats} from "@/types/admin/index";
import {  UserJobStatus} from "@/types/user/index";

import {Job}  from "@/types/user/index";
// import { getInitialAdminDashboardStats } from "@/utils/dashboardStats";

import {JobManagement} from "@/components/adminDashboard/JobsManagement";
import {UserManagement} from "@/components/adminDashboard/UserManagement";
import{ ResumeManagement} from "@/components/adminDashboard/ResumeManagement"
import ScraperTabs from "../ScraperTab";
// import AdminSubscriptionManagement from "./SubscriptionManagement";
// import {SubscriptionService} from "../../app/service-actions/subscription-server";
// import {  } from "@/services/user-services/subscription-service"; 
import {getInitialUserDashboardStats} from '@/types/user/dashboard'
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


// Update the TabId type to include subscriptions
type TabId = "overview" | "jobs" | "users" | "resumes" | "scraper" | "subscriptions";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({  initialJobs,
  initialUsers,
  initialStats,
  initialFilters,
    applications,
  user,
  role,
 }) => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

const [stats, setStats] = useState<AdminDashboardStats>(getInitialAdminDashboardStats());
 const [loading, setLoading] = useState(true);

  // Add subscription stats
  const [subscriptionStats, setSubscriptionStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyRecurringRevenue: 0
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
      count: subscriptionStats.activeSubscriptions
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
    // setSubscriptionStats({
    //   totalRevenue: dashboardStats.totalRevenue || 0,
    //   activeSubscriptions: dashboardStats.activeSubscriptions || 0,
    //   monthlyRecurringRevenue: dashboardStats.monthlyRecurringRevenue || 0
    // });
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

  // ✅ Only return early after hooks are declared
  if (user.user_metadata.role !== "admin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied. Admins only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage jobs, users, resumes, subscriptions and scraping operations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards - Only shown on overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalJobs}
                  </p>
                  <p className="text-sm text-green-600">
                    {stats.appliedJobs} applied
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Users className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                  <p className="text-sm text-green-600">
                    {stats.activeUsers} active
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalResumes}
                  </p>
                  <p className="text-sm text-blue-600">
                    Avg match: {stats.avgMatchScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalApplications}
                  </p>
                  <p className="text-sm text-gray-600">Total sent</p>
                </div>
              </div>
            </div>

            {/* New Subscription Stats Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${subscriptionStats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600">
                    {subscriptionStats.activeSubscriptions} active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b border-gray-200">
              <nav
                className="flex space-x-8 px-6"
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 focus:outline-none ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({tab.count})
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab("jobs")}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Briefcase className="w-5 h-5 text-blue-500 mr-3" />
                          <div>
                            <div className="font-medium">Manage Jobs</div>
                            <div className="text-sm text-gray-600">
                              {stats.totalJobs} total jobs
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("users")}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-green-500 mr-3" />
                          <div>
                            <div className="font-medium">Manage Users</div>
                            <div className="text-sm text-gray-600">
                              {stats.totalUsers} registered users
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("resumes")}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-purple-500 mr-3" />
                          <div>
                            <div className="font-medium">Manage Resumes</div>
                            <div className="text-sm text-gray-600">
                              {stats.totalResumes} resumes uploaded
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 text-emerald-500 mr-3" />
                          <div>
                            <div className="font-medium">Manage Subscriptions</div>
                            <div className="text-sm text-gray-600">
                              ${subscriptionStats.totalRevenue.toLocaleString()} total revenue
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("scraper")}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Play className="w-5 h-5 text-orange-500 mr-3" />
                          <div>
                            <div className="font-medium">Job Scraper</div>
                            <div className="text-sm text-gray-600">
                              Configure and run job scraper
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      System Status
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Jobs Applied</div>
                            <div className="text-sm text-gray-600">
                              Application rate
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {stats.appliedJobs}
                            </div>
                            <div className="text-sm text-gray-500">
                              {stats.totalJobs > 0
                                ? Math.round(
                                    (stats.appliedJobs / stats.totalJobs) * 100
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              Average Match Score
                            </div>
                            <div className="text-sm text-gray-600">
                              Resume compatibility
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {stats.avgMatchScore}%
                            </div>
                            <div className="text-sm text-green-600">Good</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Monthly Revenue</div>
                            <div className="text-sm text-gray-600">
                              Subscription income
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              ${subscriptionStats.monthlyRecurringRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-emerald-600">MRR</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">User Activity</div>
                            <div className="text-sm text-gray-600">
                              Active users
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {stats.activeUsers}
                            </div>
                            <div className="text-sm text-blue-600">
                              {stats.totalUsers > 0
                                ? Math.round(
                                    (stats.activeUsers / stats.totalUsers) * 100
                                  )
                                : 0}
                              %
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
                user={{
                  ...user,
                  user_metadata: {
                    ...user.user_metadata,
                    role: user.user_metadata.role ?? "admin", // fallback if undefined
                  },
                }}
                onStatsUpdate={refreshData}
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
            {activeTab === "subscriptions" && (
              <AdminSubscriptionTab />

            )}
        {activeTab === "subscriptions" && (
              
              <AdminSubscriptionTab />
            )}  
            {/* Scraper Tab */}
            {activeTab === "scraper" && <ScraperTabs user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;