// client/src/app/tenant/dashboard/TenantDashboardClient.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2,
  Users,
  DollarSign,
  // TrendingUp,
  Activity,
  // Settings,
  Plus,
  Search,
  // BarChart3,
  // Globe
} from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

interface OrganizationMember {
  count?: number;
}

interface OrganizationSubscription {
  status: string;
  seats_used?: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  organization_members?: OrganizationMember[];
  organization_subscriptions?: OrganizationSubscription[];
}

interface Tenant {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

interface TenantDashboardProps {
  user: User;
  tenant: Tenant;
  organizations: Organization[];
}

export default function TenantDashboardClient({
  // user,
  tenant,
  organizations
}: TenantDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter(o => o.is_active).length,
    totalUsers: organizations.reduce((acc, org) => 
      acc + (org.organization_members?.[0]?.count || 0), 0
    ),
    monthlyRevenue: organizations.reduce((acc, org) => {
      const sub = org.organization_subscriptions?.[0];
      return acc + (sub?.status === 'active' ? 100 * (sub.seats_used || 0) : 0);
    }, 0),
  };

  const filteredOrgs = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar  />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tenant Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all organizations under {tenant?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-sm text-green-600">+2</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalOrganizations}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organizations</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-green-600" />
              <span className="text-sm text-green-600">+18%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalUsers}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-purple-600" />
              <span className="text-sm text-green-600">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeOrganizations}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Orgs</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-sm text-green-600">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.monthlyRevenue}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Organizations
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Organization</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {org.organization_members?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {org.organization_subscriptions?.[0]?.status || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        org.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/tenant/organizations/${org.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        View
                      </Link>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
