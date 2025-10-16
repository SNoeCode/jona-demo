// "use client";
"use client";

import React, { useState } from "react";
import { Settings, FileText, X, AlertTriangle } from "lucide-react";

import type { CurrentSubscription } from "@/types/user/index";
import { cancelSubscription } from "@/services/user-services/billing-service"

interface BillingTabProps {
  subscription: CurrentSubscription | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveTab: (tab: "profile" | "subscription" | "usage" | "billing") => void;
}

export default function ProfileBillingTab({
  subscription,
  loading,
  setLoading,
  setError,
  setActiveTab,
}: BillingTabProps) {
  const [success, setSuccess] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    if (!subscription?.subscription_id) return;

    const confirmed = confirm(
      "Are you sure you want to cancel your subscription? You will lose access to Enterprise features at the end of your current billing period."
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await cancelSubscription(
        subscription.subscription_id
      );

      setSuccess(
        "Subscription canceled successfully. You will retain access until the end of your billing period."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = () => {
    // In a real app, this would open the Stripe customer portal
    alert(
      "Opening billing portal... (This would redirect to Stripe in a real app)"
    );
  };

  const downloadInvoices = () => {
    // In a real app, this would download or show invoices
    alert(
      "Downloading invoices... (This would fetch invoices from Stripe in a real app)"
    );
  };
// ?******************billing prfile 
  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Current Subscription
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">
                  {subscription?.plan_name || "Free"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    subscription?.status === "active"
                      ? "text-green-600"
                      : subscription?.status === "canceled"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {subscription?.status || "Free"}
                </span>
              </div>
              {subscription?.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next billing date:</span>
                  <span className="font-medium">
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
            <div className="space-y-2">
              <button
                onClick={openBillingPortal}
                disabled={
                  !subscription || subscription.plan_name === "Free" || loading
                }
                className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span>Manage Billing</span>
                </div>
              </button>

              <button
                onClick={downloadInvoices}
                disabled={
                  !subscription || subscription.plan_name === "Free" || loading
                }
                className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span>Download Invoices</span>
                </div>
              </button>

              {subscription?.status === "active" &&
                subscription?.plan_name !== "Free" && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="w-full text-left px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      <span>
                        {loading ? "Canceling..." : "Cancel Subscription"}
                      </span>
                    </div>
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Canceled Subscription Notice */}
        {subscription?.status === "canceled" && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  Subscription Canceled
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your subscription has been canceled and will expire on{" "}
                  {subscription.current_period_end &&
                    new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  . You can reactivate it anytime before the expiration date.
                </p>
                <button
                  onClick={() => setActiveTab("subscription")}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  Reactivate Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Free Plan Notice */}
        {(!subscription || subscription?.plan_name === "Free") && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 text-lg">💡</div>
              <div>
                <h4 className="font-medium text-blue-800">
                  You're on the Free Plan
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Upgrade to a paid plan to access advanced features like
                  unlimited job scraping, auto-applications, and priority
                  support.
                </p>
                <button
                  onClick={() => setActiveTab("subscription")}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
