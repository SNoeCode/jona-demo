'use client'

import React from 'react';
import { 
  FileText,
  BarChart3,
  Zap,
  Crown,
  Check,
  X
} from 'lucide-react';
import type { CurrentSubscription } from '@/types/user/index';

interface UsageStats {
  current_month: {
    jobs_scraped: number;
    applications_sent: number;
    resumes_uploaded: number;
  };
  limits: {
    jobs_per_month: number;
    applications_per_day: number;
    resumes: number;
    auto_scrape_enabled: boolean;
    priority_support: boolean;
  };
  percentage_used: {
    jobs: number;
    applications: number;
    resumes: number;
  };
}

interface UsageTabProps {
  usageStats: UsageStats;
  subscription: CurrentSubscription | null;
  setActiveTab: (tab: 'profile' | 'subscription' | 'usage' | 'billing') => void;
}

export default function UsageTab({ usageStats, subscription, setActiveTab }: UsageTabProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jobs Scraped */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Jobs Scraped</h3>
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {usageStats.current_month.jobs_scraped} / {usageStats.limits.jobs_per_month === -1 ? '∞' : usageStats.limits.jobs_per_month}
              </span>
              <span className="text-gray-600">
                {usageStats.percentage_used.jobs}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(usageStats.percentage_used.jobs)}`}
                style={{ width: `${Math.min(usageStats.percentage_used.jobs, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Resets monthly on billing date
            </p>
          </div>
        </div>

        {/* Applications Sent */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Applications</h3>
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {usageStats.current_month.applications_sent} / {usageStats.limits.applications_per_day === -1 ? '∞' : usageStats.limits.applications_per_day}
              </span>
              <span className="text-gray-600">
                {usageStats.percentage_used.applications}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(usageStats.percentage_used.applications)}`}
                style={{ width: `${Math.min(usageStats.percentage_used.applications, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Resets daily at midnight
            </p>
          </div>
        </div>

        {/* Resumes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resume Storage</h3>
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {usageStats.current_month.resumes_uploaded} / {usageStats.limits.resumes === -1 ? '∞' : usageStats.limits.resumes}
              </span>
              <span className="text-gray-600">
                {usageStats.percentage_used.resumes}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(usageStats.percentage_used.resumes)}`}
                style={{ width: `${Math.min(usageStats.percentage_used.resumes, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total resume storage limit
            </p>
          </div>
        </div>
      </div>

      {/* Features Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Auto-scraping</span>
            </div>
            {usageStats.limits.auto_scrape_enabled ? (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Enabled
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                Disabled
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Priority Support</span>
            </div>
            {usageStats.limits.priority_support ? (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Enabled
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(!subscription || subscription?.plan_name === 'Free') && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ready to unlock more features?
            </h3>
            <p className="text-gray-600 mb-4">
              Upgrade to Pro or Premium for unlimited job scraping, auto-applications, and priority support.
            </p>
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Upgrade Options
            </button>
          </div>
        </div>
      )}
    </div>
  );
}