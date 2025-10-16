"use client";

import { useAuth } from "@/context/AuthUserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  LogOut,
  UserPlus,
  Search,
} from "lucide-react";

export default function OrgOwnerDashboard() {
  const { user, organization, loading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [talents, setTalents] = useState([
    {
      id: 1,
      name: "Bob",
      applications: 3,
      savedJobs: 5,
      lastActive: "2 hours ago",
      resumeScore: 72,
    },
    {
      id: 2,
      name: "Alice",
      applications: 7,
      savedJobs: 12,
      lastActive: "1 day ago",
      resumeScore: 85,
    },
    {
      id: 3,
      name: "Charlie",
      applications: 2,
      savedJobs: 8,
      lastActive: "5 minutes ago",
      resumeScore: 68,
    },
  ]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.is_org_owner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Organization Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {organization?.organization?.name || "Your Organization"} •{" "}
                {user.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Access Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">
            <strong>Admin Access:</strong> You can run scrapers, manage users,
            and view all organization data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Talents Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Your Organization's Talents
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <UserPlus className="h-4 w-4" />
                  Add Talent
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Applications
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Resume Score
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Last Active
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {talents.map((talent) => (
                      <tr
                        key={talent.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {talent.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {talent.name.toLowerCase()}@demo.com
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {talent.applications}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              talent.resumeScore > 80
                                ? "bg-green-100 text-green-800"
                                : talent.resumeScore > 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {talent.resumeScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {talent.lastActive}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-6">
            {/* Organization Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Organization Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Active Career Specialists:
                  </span>
                  <span className="font-bold text-gray-900">3</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Total Applications This Month:
                  </span>
                  <span className="font-bold text-gray-900">47</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  Placement Success Rate:
                </span>
                <span className="font-bold text-green-600">23%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg"></div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Run Job Scraper
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition text-left">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    Manage Team
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    View Analytics
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-left">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">
                    Browse Jobs
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
