"use client";

import React, { useState } from "react";
import { Crown, Zap, Check, Loader2, ExternalLink } from "lucide-react";
import { createCheckoutSession } from "@/services/user-services/billing-service";
import type {
  CurrentSubscription,
  SubscriptionPlan,
  AuthUser,
  BillingCycle,
} from "@/types/user/index";

interface SubscriptionTabProps {
  subscription: CurrentSubscription | null;
  subscriptionPlans: SubscriptionPlan[];
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  authUser: AuthUser;
  onSubscriptionUpdate: () => void;
}

export default function SubscriptionTab({
  subscription,
  subscriptionPlans,
  loading,
  setLoading,
  setError,
  authUser,
  onSubscriptionUpdate,
}: SubscriptionTabProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // const handleSubscriptionUpgrade = async (planId: string) => {
  //   if (!authUser?.id) {
  //     setError("User not authenticated");
  //     return;
  //   }

  //   setUpgrading(planId);
  //   setError(null);

  //   try {
  //     const result = await createCheckoutSession(
  //       authUser.id,
  //       planId,
  //       billingCycle
  //     );

  //     if (result.success && result.url) {
  //       // Redirect to Stripe checkout
  //       window.location.href = result.url;
  //     } else {
  //       throw new Error(result.error || "Failed to create checkout session");
  //     }
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Failed to upgrade subscription"
  //     );
  //   } finally {
  //     setUpgrading(null);
  //   }
  // };

  const handleManageSubscription = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      alert("Subscription management portal coming soon!");
    } catch (err) {
      setError("Failed to open subscription management");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  const getCurrentPlanPrice = () => {
    if (!subscription || subscription.plan_name === "Free") return "Free";
    return subscription.price_paid
      ? formatCurrency(subscription.price_paid)
      : "N/A";
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.name === "Free") return 0;
    return billingCycle === "monthly"
      ? plan.price_monthly ?? plan.price
      : plan.price_yearly ?? plan.price;
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return subscription?.plan_name === plan.name;
  };

  const parsePlanFeatures = (plan: SubscriptionPlan): string[] => {
    if (!plan.features) return [];

    if (typeof plan.features === "string") {
      try {
        return JSON.parse(plan.features);
      } catch {
        return [plan.features];
      }
    }

    if (Array.isArray(plan.features)) {
      return plan.features;
    }

    return Object.values(plan.features);
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              Current Plan: {subscription?.plan_name || "Free"}
            </h3>
            <p className="text-blue-700 mt-1">
              {subscription?.status === "active" &&
              subscription?.current_period_end
                ? `Active until ${new Date(
                    subscription.current_period_end
                  ).toLocaleDateString()}`
                : "No active subscription"}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              {subscription?.auto_scrape_enabled && (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  Auto-scraping
                </span>
              )}
              {subscription?.priority_support && (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3" />
                  Priority support
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {getCurrentPlanPrice()}
              {subscription?.billing_cycle &&
                subscription.plan_name !== "Free" && (
                  <span className="text-sm font-normal">
                    /
                    {subscription.billing_cycle === "monthly"
                      ? "month"
                      : "year"}
                  </span>
                )}
            </div>
            {subscription?.status === "active" && (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Limits */}
      {subscription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Your Plan Limits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {subscription.max_jobs_per_month === -1
                  ? "∞"
                  : subscription.max_jobs_per_month || "10"}
              </div>
              <div className="text-sm text-gray-600">Jobs per month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {subscription.max_applications_per_day === -1
                  ? "∞"
                  : subscription.max_applications_per_day || "1"}
              </div>
              <div className="text-sm text-gray-600">Applications per day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {subscription.max_resumes === -1
                  ? "∞"
                  : subscription.max_resumes || "1"}
              </div>
              <div className="text-sm text-gray-600">Resume storage</div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-600 font-semibold">
              (Save 17%)
            </span>
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans
          .filter((plan) => plan.active)
          .map((plan) => {
            const planFeatures = parsePlanFeatures(plan);
            const planPrice = getPlanPrice(plan);
            const isUpgrading = upgrading === plan.id;
            const isCurrent = isCurrentPlan(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white border-2 rounded-lg p-6 transition-all duration-200 ${
                  plan.popular
                    ? "border-blue-500 shadow-lg ring-1 ring-blue-500 ring-opacity-25"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  isCurrent
                    ? "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-gray-600 mt-2 text-sm">
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.name?.toLowerCase() !== "free" && billingCycle && (
                        <span className="text-gray-600 text-sm">
                          /{billingCycle === "monthly" ? "month" : "year"}
                        </span>
                      )}
                    </span>
                    {plan.name !== "Free" && (
                      <span className="text-gray-600 text-sm">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>

                  {billingCycle === "yearly" &&
                    plan.price_yearly &&
                    plan.price_monthly && (
                      <div className="text-sm text-green-600 mt-1">
                        Save{" "}
                        {formatCurrency(
                          plan.price_monthly * 12 - plan.price_yearly
                        )}{" "}
                        annually
                      </div>
                    )}
                </div>

                <ul className="mt-6 space-y-3">
                  {planFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <button
                    // onClick={() => handleSubscriptionUpgrade(plan.id)}
                    disabled={isCurrent || isUpgrading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrent
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                        : "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400"
                    }`}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : isUpgrading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `${
                        plan.name === "Free" ? "Downgrade to" : "Upgrade to"
                      } ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>
            All plans include secure payment processing and can be canceled
            anytime.
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Pro and Premium plans include priority customer support.</span>
        </div>
      </div>
    </div>
  );
}
