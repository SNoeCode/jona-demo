// client/src/app/org/owner/[slug]/dashboard/OwnerDashboardClient.tsx
'use client';

import { useState } from 'react';
import { Users, Briefcase, FileText, TrendingUp, Settings, DollarSign, Activity } from 'lucide-react';

type Props = {
  organization: any;
  members: any[];
  stats: any;
  subscription: any;
  auditLogs: any[];
  usage: any[];
  userRole: string;
};

export default function OwnerDashboardClient({
  organization,
  members,
  stats,
  subscription,
  auditLogs,
  usage,
  userRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'usage' | 'activity'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Owner Dashboard • {organization.slug}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_members || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_jobs || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_applications || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_resumes || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['overview', 'members', 'usage', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 border-b-2 font-medium transition capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Subscription Info */}
            {subscription && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Subscription Details
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold capitalize">{subscription.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seats Used</p>
                    <p className="text-lg font-semibold">
                      {subscription.seats_used} / {subscription.seats_included}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Billing</p>
                    <p className="text-lg font-semibold">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Usage */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Usage
              </h3>
              {usage.length > 0 ? (
                <div className="space-y-3">
                  {usage.map((month) => (
                    <div key={month.month} className="flex items-center justify-between py-2 border-b">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex gap-6 text-sm">
                        <span>Jobs: {month.jobs_scraped}</span>
                        <span>Apps: {month.applications_sent}</span>
                        <span>Storage: {month.storage_used_mb} MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No usage data available</p>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {member.users?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.users?.full_name || member.users?.email}
                      </p>
                      <p className="text-sm text-gray-600">{member.users?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                      {member.role}
                    </span>
                    <span className="text-sm text-gray-600">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Usage Statistics</h3>
            {usage.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Month</th>
                    <th className="py-2">Jobs Scraped</th>
                    <th className="py-2">Resumes</th>
                    <th className="py-2">Applications</th>
                    <th className="py-2">API Calls</th>
                    <th className="py-2">Storage (MB)</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((month) => (
                    <tr key={month.month} className="border-b">
                      <td className="py-3">{month.month}</td>
                      <td className="py-3">{month.jobs_scraped}</td>
                      <td className="py-3">{month.resumes_processed}</td>
                      <td className="py-3">{month.applications_sent}</td>
                      <td className="py-3">{month.api_calls}</td>
                      <td className="py-3">{month.storage_used_mb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600">No usage data available</p>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600">
                          {log.entity_type && `${log.entity_type} • `}
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-6 text-gray-600">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}