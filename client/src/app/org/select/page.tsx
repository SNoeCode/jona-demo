// client/src/app/org/select/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Plus,
  Users,
  Calendar,
  Activity,
  Settings,
} from "lucide-react";

interface UserOrganization {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  user_role: string;
  joined_at: string;
  member_count?: number;
  active_jobs?: number;
}

export default function OrganizationSelectPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectOrganization = useCallback(
    async (orgId: string) => {
      setSelectedOrg(orgId);
      setError(null);

      try {
        const response = await fetch("/api/user/update-current-org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: orgId }),
        });

        const data = await response.json();

        if (response.ok) {
          // Small delay to ensure session is updated
          await new Promise(resolve => setTimeout(resolve, 300));
          router.push("/org/dashboard");
        } else {
          setError(data.message || "Failed to select organization");
          setSelectedOrg(null);
        }
      } catch (error) {
        console.error("Error selecting organization:", error);
        setError("Failed to select organization. Please try again.");
        setSelectedOrg(null);
      }
    },
    [router]
  );

  const fetchUserOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/org/user-organizations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch organizations");
      }

      if (!data.organizations || data.organizations.length === 0) {
        router.push("/org/register");
        return;
      }

      if (data.organizations.length === 1) {
        await selectOrganization(data.organizations[0].organization_id);
        return;
      }

      setOrganizations(data.organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load organizations"
      );
    } finally {
      setLoading(false);
    }
  }, [router, selectOrganization]);

  useEffect(() => {
    fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading organizations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
              Error Loading Organizations
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => fetchUserOrganizations()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Select Organization
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose which organization you want to work with
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organizations.map((org) => (
            <div
              key={org.organization_id}
              onClick={() => selectOrganization(org.organization_id)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                selectedOrg === org.organization_id
                  ? "border-blue-500 ring-2 ring-blue-200 opacity-75"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    org.user_role === "owner" || org.user_role === "org_admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : org.user_role === "admin" ||
                        org.user_role === "org_manager"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {org.user_role}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {org.organization_name}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                @{org.organization_slug}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{org.member_count || 0} members</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Activity className="h-4 w-4 mr-2" />
                  <span>{org.active_jobs || 0} active jobs</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Joined {new Date(org.joined_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectOrganization(org.organization_id);
                  }}
                  disabled={selectedOrg === org.organization_id}
                >
                  {selectedOrg === org.organization_id ? (
                    "Selecting..."
                  ) : (
                    <>
                      Select
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
                {["owner", "admin", "org_admin", "org_manager"].includes(
                  org.user_role
                ) && (
                  <button
                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/org/settings?id=${org.organization_id}`);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Create New Organization Card */}
          <Link
            href="/org/register"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 flex flex-col items-center justify-center text-center min-h-[280px]"
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Plus className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Create New Organization
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set up a new workspace for your team
            </p>
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center"
          >
            Continue with personal account
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}