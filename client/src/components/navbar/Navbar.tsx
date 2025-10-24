"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  User,
  LogOut,
  Mail,
  Info,
  Shield,
  Menu,
  Settings,
  Building2,
} from "lucide-react";
import { Switch } from "@headlessui/react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth} from "@/context/AuthUserContext";
import { getOrgRole } from "@/services/organization/getOrgRole";
import type { Organization } from "@/types/org/organization";
import type { AuthUser } from "@/types/user/authUser";
interface OrgAuthResult {
  user: AuthUser;  
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  memberRole: string;
  role?: string;
  membership: {
    id: string;
    role: string;
    department: string | null;
    position: string | null;
    joined_at: string;
  };
}
export default function NavbarAppRouter() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut, organization, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
 const role = getOrgRole(
    user && organization
      ? {
          user: {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              role: user.user_metadata?.role as import("@/types/user/authUser").UserRole | undefined,
            },
          },
          organizationId: organization.organization.id,
          organizationSlug: organization.organization.slug,
          organizationName: organization.organization.name,
          memberRole: organization.membership.role,
          role: organization.membership.role,
          membership: {
            id: organization.membership.id,
            role: organization.membership.role,
            department: organization.membership.department || null,
            position: organization.membership.position || null,
            joined_at: organization.membership.joined_at
          }
        }
      : null
  );
const isAdmin = role === "admin";
const isTenantOwner = role === "tenant_owner";
const isOrgOwner = role === "owner";
const isOrgManager = role === "manager";
const isOrgUser = role === "member";
const isRegularUser = role === "user" || role === "unassigned_user";
const isRecruiter = role === "recruiter";

  const hasOrganization = !!user?.organizations?.length;

  const handleProfileClick = () => {
    router.push("/profile");
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
    setIsMenuOpen(false);
  };

  const handleOrgDashboardClick = () => {
    // Get the current organization and role to build the correct URL
    if (organization && user) {
      const orgSlug = organization.organization.slug;
      const userRole = organization.membership.role;
      router.push(`/org/${orgSlug}/${userRole}/dashboard`);
    } else {
      router.push("/org/select");
    }
    setIsMenuOpen(false);
  };

  const handleAdminDashboardClick = () => {
    router.push("/admin/dashboard");
    setIsMenuOpen(false);
  };

  const handleTenantDashboardClick = () => {
    router.push("/tenant/dashboard");
    setIsMenuOpen(false);
  };

  const handleRecruiterDashboardClick = () => {
    router.push("/recruit");
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    if (hasOrganization && (isOrgOwner || isOrgManager)) {
      // Use the correct organization settings URL
      if (organization) {
        const orgSlug = organization.organization.slug;
        const userRole = organization.membership.role;
        router.push(`/org/${orgSlug}/${userRole}/settings`);
      } else {
        router.push("/org/select");
      }
    } else if (isAdmin) {
      router.push("/admin/settings");
    }
    setIsMenuOpen(false);
  };

  const handleAboutClick = () => {
    router.push("/about");
    setIsMenuOpen(false);
  };

  const handleContactClick = () => {
    router.push("/contact");
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    router.push("/login");
    setIsMenuOpen(false);
  };

  const handleSwitchOrgClick = () => {
    router.push("/org/select");
    setIsMenuOpen(false);
  };
  const handleLogout = async () => {
    setIsMenuOpen(false);
    if (typeof signOut === "function") {
      try {
        await signOut();
        router.push("/login");
      } catch (err) {
        console.error(
          `Failed to sign out user: ${
            err instanceof Error ? err.message : JSON.stringify(err)
          }`,
          err
        );
        router.push("/login");
      }
    } else {
      console.warn("signOut missing on Auth context; redirecting to login");
      router.push("/login");
    }
  };

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
      isActive(path)
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        : darkMode
        ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  const handleLogoClick = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        handleAdminDashboardClick();
      } else if (isTenantOwner) {
        handleTenantDashboardClick();
      } else if (isRecruiter) {
        handleRecruiterDashboardClick();
      } else if (hasOrganization) {
        handleOrgDashboardClick();
      } else {
        handleDashboardClick();
      }
    } else {
      handleLoginClick();
    }
  };

  // Render navigation based on role and context
  const renderNavItems = () => {
    // System Admin
    if (isAdmin) {
      return (
        <>
          <button
            onClick={handleAdminDashboardClick}
            className={navLinkClass("/admin/dashboard")}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Admin Dashboard
          </button>
          <button
            onClick={handleSettingsClick}
            className={navLinkClass("/admin/settings")}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </>
      );
    }

    // Tenant Owner
    if (isTenantOwner) {
      return (
        <>
          <button
            onClick={handleTenantDashboardClick}
            className={navLinkClass("/tenant/dashboard")}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Tenant Dashboard
          </button>
        </>
      );
    }

    // Recruiter
    if (isRecruiter) {
      return (
        <>
          <button
            onClick={handleRecruiterDashboardClick}
            className={navLinkClass("/recruit")}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Recruiter Dashboard
          </button>
          <button
            onClick={handleProfileClick}
            className={navLinkClass("/profile")}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
        </>
      );
    }

    // Organization Users (Owner, Manager, Member)
    if (hasOrganization && (isOrgOwner || isOrgManager || isOrgUser)) {
      return (
        <>
          <button
            onClick={handleOrgDashboardClick}
            className={navLinkClass(organization ? `/org/${organization.organization.slug}/${organization.membership.role}/dashboard` : "/org/dashboard")}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Organization
          </button>
          {(isOrgOwner || isOrgManager) && (
            <button
              onClick={handleSettingsClick}
              className={navLinkClass(organization ? `/org/${organization.organization.slug}/${organization.membership.role}/settings` : "/org/settings")}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          )}
          <button
            onClick={handleProfileClick}
            className={navLinkClass("/profile")}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
        </>
      );
    }

    // Regular authenticated users (no organization)
    if (isAuthenticated) {
      return (
        <>
          <button
            onClick={handleDashboardClick}
            className={navLinkClass("/dashboard")}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={handleProfileClick}
            className={navLinkClass("/profile")}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
        </>
      );
    }

    // Not authenticated
    return null;
  };

  return (
    <nav
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        width: "100%",
      }}
      className={`shadow-lg border-b transition-colors duration-200 ${
        darkMode ? "border-gray-600" : "border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              JobTracker
            </button>
            {hasOrganization && (
              <div className="ml-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.organizations?.[0]?.organizations?.name ??
                    user?.organizations?.[0]?.organizations?.slug ??
                    "Organization"}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-4">
            {renderNavItems()}
            <button
              onClick={handleAboutClick}
              className={navLinkClass("/about")}
            >
              <Info className="w-4 h-4 inline mr-2" />
              About
            </button>
            <button
              onClick={handleContactClick}
              className={navLinkClass("/contact")}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Contact
            </button>
          </div>

          {/* Right Side: Mobile Menu + Theme + User */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform duration-200 hover:scale-110"
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Dark Mode
              </span>
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                className={`${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">Toggle Dark Mode</span>
                <span
                  className={`${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            {/* User Info and Auth */}
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <User
                    className={`w-5 h-5 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  {/* Role indicators */}
                  {isAdmin && <Shield className="w-4 h-4 text-red-500" title="System Admin" />}
                  {isTenantOwner && <Building2 className="w-4 h-4 text-purple-500" title="Tenant Owner" />}
                  {isRecruiter && <Search className="w-4 h-4 text-green-500" title="Recruiter" />}
                  {hasOrganization && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.organizations?.[0]?.organizations?.name ??
                        user?.organizations?.[0]?.organizations?.slug ??
                        "Organization"}
                      {organization && (
                        <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">
                          {organization.membership.role}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {hasOrganization && (
                  <button
                    onClick={handleSwitchOrgClick}
                    className={`hidden md:block text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
                      darkMode
                        ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    Switch Org
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                    darkMode
                      ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      : "text-red-600 hover:text-red-800 hover:bg-red-50"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === "/login"
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col space-y-2 pt-4 pb-4 border-t border-gray-300 dark:border-gray-700 animate-fade-in">
            {renderNavItems()}
            <button
              onClick={handleAboutClick}
              className={navLinkClass("/about")}
            >
              <Info className="w-4 h-4 inline mr-2" />
              About
            </button>
            <button
              onClick={handleContactClick}
              className={navLinkClass("/contact")}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Contact
            </button>

            {hasOrganization && (
              <button
                onClick={handleSwitchOrgClick}
                className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  darkMode
                    ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                Switch Organization
              </button>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  darkMode
                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    : "text-red-600 hover:text-red-800 hover:bg-red-50"
                }`}
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Logout
              </button>
            )}

            {!user && (
              <button
                onClick={handleLoginClick}
                className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === "/login"
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
