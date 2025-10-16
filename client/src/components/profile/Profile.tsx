"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  BarChart3,
  Calendar,
  Loader2,
  X,
} from "lucide-react";
import ProfileTab from "./ProfileTab";
import SubscriptionTab from "./SubscriptionProfileTab";
import UsageTab from "@/components/profile/UsageTab";
import ProfileBillingTab from "@/components/profile/ProfileBillingTab";
import { calculateUsageStats } from "@/utils/calculateUserUsageStats";
import type {
  EnhancedUserProfile,
  CurrentSubscription,
  UserUsage,
  SubscriptionPlan,
  AuthUser,
} from "@/types/user/index";

type TabId = "profile" | "subscription" | "usage" | "billing";

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

export default function Profile({
  user,
  enhancedUserProfile,
  subscriptionPlans,
  subscription,
  usage,
}: {
  user: AuthUser;
  enhancedUserProfile: EnhancedUserProfile;
  subscriptionPlans: SubscriptionPlan[];
  subscription: CurrentSubscription | null;
  usage: UserUsage | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    const stats = calculateUsageStats(usage, subscription);
    setUsageStats(stats);
  }, [usage, subscription]);

  const tabs = [
    { id: "profile" as TabId, label: "Profile", icon: User },
    { id: "subscription" as TabId, label: "Subscription", icon: CreditCard },
    { id: "usage" as TabId, label: "Usage & Limits", icon: BarChart3 },
    { id: "billing" as TabId, label: "Billing", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account, subscription, and preferences</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "profile" && (
              <ProfileTab
                profile={enhancedUserProfile}
                setProfile={() => {}}
                authUser={user}
                subscription={subscription}
                loading={loading}
                setLoading={setLoading}
                setError={setError}
              />
            )}
            {activeTab === "subscription" && (
              <SubscriptionTab
                subscription={subscription}
                subscriptionPlans={subscriptionPlans}
                loading={loading}
                setLoading={setLoading}
                setError={setError}
                authUser={user}
                onSubscriptionUpdate={() => {}}
              />
            )}
            {activeTab === "usage" && usageStats && (
              <UsageTab
                usageStats={usageStats}
                subscription={subscription}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === "billing" && (
              <ProfileBillingTab
                subscription={subscription}
                loading={loading}
                setLoading={setLoading}
                setError={setError}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
