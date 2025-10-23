// client/src/app/(protected)/org/[slug]/dashboard/OrgDashboardClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  LogOut,
  UserPlus,
  Search,
} from "lucide-react";

interface OrgDashboardClientProps {
  organization: any;
  members: any[];
  stats: {
    total_members: number;
    total_jobs: number;
    total_applications: number;
    total_resumes: number;
  };
  userRole: string;
  membership: {
    id: string;
    role: string;
    department: string | null;
    position: string | null;
    joined_at: string;
  };
  organizationSlug: string;
}

export default function OrgDashboardClient({
  organization,
  members,
  stats,
  userRole,
  membership,
  organizationSlug,
}: OrgDashboardClientProps) {
  const router = useRouter();
  const [talents, setTalents] = useState(members);

  const handleSignOut = async () => {
    // Your sign out logic
    router.push("/login");
  };

  const isAdmin = userRole === "admin" || userRole === "owner";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Your Role: <span className="font-medium">{userRole}</span>
                {membership.department && ` • ${membership.department}`}
                {membership.position && ` • ${membership.position}`}
              </p>
            </div>
            <button
              onClick={handleSignOut}
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
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-yellow-800">
              <strong>Admin Access:</strong> You can run scrapers, manage users,
              and view all organization data
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Talents Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Organization Members
                </h2>
                {isAdmin && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Joined
                      </th>
                      {isAdmin && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {member.users?.full_name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.users?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {member.department || "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Manage
                            </button>
                          </td>
                        )}
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
                  <span className="text-sm text-gray-600">Total Members:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_members}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Active Jobs:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_jobs}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Total Applications:
                  </span>
                  <span className="font-bold text-gray-900">
                    {stats.total_applications}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Resumes:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_resumes}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {isAdmin && (
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Run Job Scraper
                    </span>
                  </button>
                )}
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition text-left">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    View Team
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