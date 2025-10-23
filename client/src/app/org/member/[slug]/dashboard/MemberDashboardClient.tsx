// client/src/app/org/member/[slug]/dashboard/MemberDashboardClient.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, FileText, Briefcase } from 'lucide-react';

type SavedJob = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  posted_at?: string;
  url?: string;
};

type Application = {
  id: string;
  job_id?: string;
  job_title?: string;
  company?: string;
  status?: string;
  applied_at?: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
};

type Props = {
  organization: Organization;
  savedJobs: SavedJob[];
  applications: Application[];
  userName?: string;
};

export default function MemberDashboardClient({
  organization,
  savedJobs,
  applications,
  userName,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{organization?.name}</h1>
              <p className="text-sm text-gray-600">Member dashboard • {organization?.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Signed in as</span>
            <div className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-900">
              {userName ?? 'Member'}
            </div>
            <Link
              href={`/org/${organization.slug}/jobs`}
              className="ml-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Jobs */}
          <section className="col-span-1 lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-medium text-gray-900">Saved Jobs</h2>
              </div>
              <Link href={`/org/${organization.slug}/saved`} className="text-sm text-blue-600">
                View all
              </Link>
            </div>

            {savedJobs.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-600">No saved jobs</div>
            ) : (
              <ul className="space-y-3">
                {savedJobs.slice(0, 6).map((job) => (
                  <li key={job.id} className="p-3 rounded-md hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {job.company ?? 'Unknown company'} • {job.location ?? 'Remote'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : ''}</div>
                    </div>
                    {job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600"
                      >
                        Open job
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Applications */}
          <section className="col-span-1 lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-medium text-gray-900">Applications</h2>
              </div>
              <Link href={`/org/${organization.slug}/applications`} className="text-sm text-blue-600">
                View all
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-600">
                You have not applied to any jobs yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="py-2">Job</th>
                      <th className="py-2">Company</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Applied</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b last:border-b-0">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{app.job_title ?? 'Unknown role'}</div>
                        </td>
                        <td className="py-3 text-gray-600">{app.company ?? '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status ?? 'pending'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/org/${organization.slug}/jobs/${app.job_id ?? ''}`}
                            className="text-sm text-blue-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Quick links / utilities */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/org/${organization.slug}/profile`}
            className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Company Profile</p>
              <p className="text-xs text-gray-500">View organization details</p>
            </div>
          </Link>

          <Link
            href={`/org/${organization.slug}/applications`}
            className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">All Applications</p>
              <p className="text-xs text-gray-500">Manage your job applications</p>
            </div>
          </Link>

          <Link
            href={`/org/${organization.slug}/saved`}
            className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Saved Jobs</p>
              <p className="text-xs text-gray-500">Quick access to your saved listings</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}