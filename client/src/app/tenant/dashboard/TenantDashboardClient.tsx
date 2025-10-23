'use client';

import React, { useState } from 'react';
import { Building2, Users, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';

type Organization = {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  size?: string;
  is_active: boolean;
  created_at: string;
  memberCount: number;
  subscription: {
    status: string;
    seats_included: number;
    seats_used: number;
  } | null;
};

type Props = {
  tenant: { id: string; name: string } | any;
  organizations: Organization[];
};

export default function TenantDashboardClient({ tenant, organizations }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = organizations.reduce((sum, org) => sum + (org.memberCount || 0), 0);
  const activeOrgs = organizations.filter(org => org.is_active).length;
  const totalSeats = organizations.reduce((sum, org) =>
    sum + (org.subscription?.seats_included || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tenant Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{tenant?.name}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Settings className="w-5 h-5" />
              Tenant Settings
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Orgs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeOrgs}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Seats</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSeats}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <div key={org.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-600">{org.slug}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Members</p>
                          <p className="text-lg font-semibold text-gray-900">{org.memberCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Industry</p>
                          <p className="text-lg font-semibold text-gray-900">{org.industry || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Size</p>
                          <p className="text-lg font-semibold text-gray-900">{org.size || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            org.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {org.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {org.subscription && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Subscription</span>
                            <span className="text-sm font-medium capitalize">{org.subscription.status}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Seats</span>
                            <span className="text-sm font-medium">
                              {org.subscription.seats_used} / {org.subscription.seats_included}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/org/owner/${org.slug}/dashboard`}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No organizations found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}