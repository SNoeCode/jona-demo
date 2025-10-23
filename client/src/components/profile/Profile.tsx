"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  BarChart3,
  Calendar,
  Loader2,
  X,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building,
  Edit2,
  Check,
  Camera,
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

// Enhanced Profile Tab Component with Real Data Integration
const EnhancedProfileTab = ({
  profile,
  authUser,
  subscription,
  loading,
  setLoading,
  setError,
}: {
  profile: EnhancedUserProfile;
  authUser: AuthUser;
  subscription: CurrentSubscription | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    email: authUser?.email || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    company: profile?.company || "",
    website: profile?.website || "",
    avatar_url: profile?.avatar_url || "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to update profile would go here
      // await updateUserProfile(editedProfile);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                `${editedProfile.firstName[0] || 'U'}${editedProfile.lastName[0] || ''}`
              )}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600">
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editedProfile.firstName} {editedProfile.lastName}
            </h2>
            <p className="text-gray-500">{authUser?.email}</p>
            {subscription && (
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {subscription.plan_name} Plan
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            <>
              <Check className="w-4 h-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Extended Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={editedProfile.firstName}
            onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={editedProfile.lastName}
            onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="inline w-4 h-4 mr-1" />
            Email Address
          </label>
          <input
            type="email"
            value={editedProfile.email}
            disabled={true}
            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="inline w-4 h-4 mr-1" />
            Phone Number
          </label>
          <input
            type="tel"
            value={editedProfile.phone}
            onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
            disabled={!isEditing}
            placeholder="+1 (555) 000-0000"
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1" />
            Location
          </label>
          <input
            type="text"
            value={editedProfile.location}
            onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
            disabled={!isEditing}
            placeholder="City, Country"
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building className="inline w-4 h-4 mr-1" />
            Company
          </label>
          <input
            type="text"
            value={editedProfile.company}
            onChange={(e) => setEditedProfile({...editedProfile, company: e.target.value})}
            disabled={!isEditing}
            placeholder="Your company name"
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="inline w-4 h-4 mr-1" />
            Website
          </label>
          <input
            type="url"
            value={editedProfile.website}
            onChange={(e) => setEditedProfile({...editedProfile, website: e.target.value})}
            disabled={!isEditing}
            placeholder="https://yourwebsite.com"
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={editedProfile.bio}
            onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
            disabled={!isEditing}
            rows={4}
            placeholder="Tell us about yourself..."
            className={`w-full px-3 py-2 border rounded-md ${
              isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Account Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Account Created</p>
            <p className="font-semibold">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-semibold">
              {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Account Status</p>
            <p className="font-semibold text-green-600">Active</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-mono text-sm">{authUser?.id || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Profile Component with Real Data Integration
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account, subscription, and preferences</p>
          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-lg font-semibold text-blue-600">
                {subscription?.plan_name || 'Free'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Jobs This Month</p>
              <p className="text-lg font-semibold">
                {usageStats?.current_month.jobs_scraped || 0} / {usageStats?.limits.jobs_per_month || '∞'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Applications Today</p>
              <p className="text-lg font-semibold">
                {usageStats?.current_month.applications_sent || 0} / {usageStats?.limits.applications_per_day || '∞'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
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

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <EnhancedProfileTab
                profile={enhancedUserProfile}
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
