// client/src/app/org/manager/[slug]/dashboard/ManagerDashboardClient.tsx
'use client';

import { useState } from 'react';
import { Users, Briefcase, FileText, TrendingUp, UserPlus, Search } from 'lucide-react';

type Props = {
  organization: any;
  members: any[];
  stats: any;
  recentApplications: any[];
};

export default function ManagerDashboardClient({
  organization,
  members,
  stats,
  recentApplications,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-sm text-gray-600 mt-1">Manager Dashboard</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
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
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_applications > 0 
                      ? Math.round((stats.total_resumes / stats.total_applications) * 100) 
                      : 0}%
                  </p>
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
            {['overview', 'team', 'analytics'].map((tab) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Members</span>
                    <span className="font-semibold">{members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Managers</span>
                    <span className="font-semibold">
                      {members.filter(m => m.role === 'manager').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Members</span>
                    <span className="font-semibold">
                      {members.filter(m => ['member', 'user'].includes(m.role)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recruiters</span>
                    <span className="font-semibold">
                      {members.filter(m => m.role === 'recruiter').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Applications
                </h3>
                <div className="space-y-3">
                  {recentApplications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium text-sm">{app.job_title || 'Job Application'}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        app.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
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
                      {member.department && (
                        <span className="text-sm text-gray-600">{member.department}</span>
                      )}
                      <span className="text-sm text-gray-600">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No members found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_applications}</p>
                  <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_jobs}</p>
                  <p className="text-sm text-blue-600 mt-1">→ Stable</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Team Size</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_members}</p>
                  <p className="text-sm text-green-600 mt-1">↑ 2 new members</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
              <div className="space-y-3">
                {['pending', 'reviewing', 'accepted', 'rejected'].map((status) => {
                  const count = recentApplications.filter(app => app.status === status).length;
                  const percentage = recentApplications.length > 0 
                    ? (count / recentApplications.length) * 100 
                    : 0;
                  
                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{status}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            status === 'accepted' ? 'bg-green-500' :
                            status === 'rejected' ? 'bg-red-500' :
                            status === 'reviewing' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}