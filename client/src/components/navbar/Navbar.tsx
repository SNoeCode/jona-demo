"use client";

import { useState } from "react";
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
import { useAuth } from "@/context/AuthUserContext";

export default function NavbarAppRouter() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout, organization } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get user role from either user_metadata or app_metadata
  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  const isAdmin = role === "admin";
  const isTenantOwner = role === "tenant_owner";

  // Check organization role by converting enum to lowercase string
  const membershipRole = organization?.membership?.role;
  const membershipRoleStr = membershipRole?.toLowerCase();
  const isOrgOwner = role === "org_admin" || membershipRoleStr === "owner";
  const isOrgManager = role === "org_manager" || membershipRoleStr === "manager";
  const isOrgUser = role === "org_user" || membershipRoleStr === "member";

  const isAuthenticated = !!user;
  const isRegularUser = role === "user" || role === "unassigned_user";

  // Check if user is in an organization context
  const hasOrganization = !!organization?.organization;

  // Navigation handlers
  const handleProfileClick = () => {
    router.push("/profile");
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
    setIsMenuOpen(false);
  };

  const handleOrgDashboardClick = () => {
    router.push("/org/dashboard");
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

  const handleSettingsClick = () => {
    if (hasOrganization && (isOrgOwner || isOrgManager)) {
      router.push("/org/settings");
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
    await logout();
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

    if (hasOrganization && (isOrgOwner || isOrgManager || isOrgUser)) {
      return (
        <>
          <button
            onClick={handleOrgDashboardClick}
            className={navLinkClass("/org/dashboard")}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Organization
          </button>
          {(isOrgOwner || isOrgManager) && (
            <button
              onClick={handleSettingsClick}
              className={navLinkClass("/org/settings")}
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

    // Default for all other authenticated users (including regular users)
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
                  {organization.organization.name}
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
                  {isAdmin && <Shield className="w-4 h-4 text-red-500" />}
                  {hasOrganization && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({organization.membership?.role})
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








// "use client";

// import { useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import {
//   Search,
//   User,
//   LogOut,
//   Mail,
//   Info,
//   Shield,
//   Menu,
//   Settings,
//   Building2,
// } from "lucide-react";
// import { Switch } from "@headlessui/react";
// import { useTheme } from "@/context/ThemeContext";
// import { useAuth } from "@/context/AuthUserContext";
// import type { OrgRole } from "@/types/organization";
// export default function NavbarAppRouter() {
//   const { darkMode, toggleDarkMode } = useTheme();
//   const { user, logout, organization } = useAuth();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const router = useRouter();
//   const pathname = usePathname();

//   // Get user role from either user_metadata or app_metadata
//   const role = user?.user_metadata?.role || user?.app_metadata?.role;
//   const isAdmin = role === "admin";
//   const isTenantOwner = role === "tenant_owner";

//   const isOrgOwner =
//     role === "org_admin" || organization?.membership?.role === OrgRole.Owner;
//   const isOrgManager =
//     role === "org_manager" ||
//     organization?.membership?.role === OrgRole.Manager;
//   const isOrgUser =
//     role === "org_user" || organization?.membership?.role === OrgRole.Member;

//   const isAuthenticated = !!user;
//   const isRegularUser = role === "user" || role === "unassigned_user";

//   // Check if user is in an organization context
//   const hasOrganization = !!organization?.organization;

//   // Navigation handlers
//   const handleProfileClick = () => {
//     router.push("/profile");
//     setIsMenuOpen(false);
//   };

//   const handleDashboardClick = () => {
//     router.push("/dashboard");
//     setIsMenuOpen(false);
//   };

//   const handleOrgDashboardClick = () => {
//     router.push("/org/dashboard");
//     setIsMenuOpen(false);
//   };

//   const handleAdminDashboardClick = () => {
//     router.push("/admin/dashboard");
//     setIsMenuOpen(false);
//   };

//   const handleTenantDashboardClick = () => {
//     router.push("/tenant/dashboard");
//     setIsMenuOpen(false);
//   };

//   const handleSettingsClick = () => {
//     if (hasOrganization && (isOrgOwner || isOrgManager)) {
//       router.push("/org/settings");
//     } else if (isAdmin) {
//       router.push("/admin/settings");
//     }
//     setIsMenuOpen(false);
//   };

//   const handleAboutClick = () => {
//     router.push("/about");
//     setIsMenuOpen(false);
//   };

//   const handleContactClick = () => {
//     router.push("/contact");
//     setIsMenuOpen(false);
//   };

//   const handleLoginClick = () => {
//     router.push("/login");
//     setIsMenuOpen(false);
//   };

//   const handleSwitchOrgClick = () => {
//     router.push("/org/select");
//     setIsMenuOpen(false);
//   };

//   const handleLogout = async () => {
//     setIsMenuOpen(false);
//     await logout();
//   };

//   const isActive = (path: string) => pathname === path;

//   const navLinkClass = (path: string) =>
//     `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
//       isActive(path)
//         ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
//         : darkMode
//         ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
//         : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//     }`;

//   const handleLogoClick = () => {
//     if (isAuthenticated) {
//       if (isAdmin) {
//         handleAdminDashboardClick();
//       } else if (isTenantOwner) {
//         handleTenantDashboardClick();
//       } else if (hasOrganization) {
//         handleOrgDashboardClick();
//       } else {
//         handleDashboardClick();
//       }
//     } else {
//       handleLoginClick();
//     }
//   };

//   // Render navigation based on role and context
//   const renderNavItems = () => {
//     if (isAdmin) {
//       return (
//         <>
//           <button
//             onClick={handleAdminDashboardClick}
//             className={navLinkClass("/admin/dashboard")}
//           >
//             <Shield className="w-4 h-4 inline mr-2" />
//             Admin Dashboard
//           </button>
//           <button
//             onClick={handleSettingsClick}
//             className={navLinkClass("/admin/settings")}
//           >
//             <Settings className="w-4 h-4 inline mr-2" />
//             Settings
//           </button>
//         </>
//       );
//     }

//     if (isTenantOwner) {
//       return (
//         <>
//           <button
//             onClick={handleTenantDashboardClick}
//             className={navLinkClass("/tenant/dashboard")}
//           >
//             <Building2 className="w-4 h-4 inline mr-2" />
//             Tenant Dashboard
//           </button>
//         </>
//       );
//     }

//     if (hasOrganization && (isOrgOwner || isOrgManager || isOrgUser)) {
//       return (
//         <>
//           <button
//             onClick={handleOrgDashboardClick}
//             className={navLinkClass("/org/dashboard")}
//           >
//             <Building2 className="w-4 h-4 inline mr-2" />
//             Organization
//           </button>
//           {(isOrgOwner || isOrgManager) && (
//             <button
//               onClick={handleSettingsClick}
//               className={navLinkClass("/org/settings")}
//             >
//               <Settings className="w-4 h-4 inline mr-2" />
//               Settings
//             </button>
//           )}
//         </>
//       );
//     }

//     if (isAuthenticated && isRegularUser) {
//       return (
//         <>
//           <button
//             onClick={handleDashboardClick}
//             className={navLinkClass("/dashboard")}
//           >
//             <Search className="w-4 h-4 inline mr-2" />
//             Dashboard
//           </button>
//           <button
//             onClick={handleProfileClick}
//             className={navLinkClass("/profile")}
//           >
//             <User className="w-4 h-4 inline mr-2" />
//             Profile
//           </button>
//         </>
//       );
//     }

//     return null;
//   };

//   return (
//     <nav
//       style={{
//         backgroundColor: "var(--bg-color)",
//         color: "var(--text-color)",
//         width: "100%",
//       }}
//       className={`shadow-lg border-b transition-colors duration-200 ${
//         darkMode ? "border-gray-600" : "border-gray-200"
//       }`}
//     >
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex items-center">
//             <button
//               onClick={handleLogoClick}
//               className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
//             >
//               JobTracker
//             </button>
//             {hasOrganization && (
//               <div className="ml-4 flex items-center space-x-2">
//                 <Building2 className="w-4 h-4 text-gray-500" />
//                 <span className="text-sm text-gray-600 dark:text-gray-400">
//                   {organization.organization.name}
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex space-x-4">
//             {renderNavItems()}
//             <button
//               onClick={handleAboutClick}
//               className={navLinkClass("/about")}
//             >
//               <Info className="w-4 h-4 inline mr-2" />
//               About
//             </button>
//             <button
//               onClick={handleContactClick}
//               className={navLinkClass("/contact")}
//             >
//               <Mail className="w-4 h-4 inline mr-2" />
//               Contact
//             </button>
//           </div>

//           {/* Right Side: Mobile Menu + Theme + User */}
//           <div className="flex items-center space-x-4">
//             {/* Mobile menu toggle */}
//             <div className="md:hidden">
//               <button
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//                 className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform duration-200 hover:scale-110"
//                 aria-label="Toggle mobile menu"
//               >
//                 <Menu className="h-6 w-6" />
//               </button>
//             </div>

//             {/* Dark Mode Toggle */}
//             <div className="flex items-center space-x-2">
//               <span
//                 className={`text-sm ${
//                   darkMode ? "text-gray-300" : "text-gray-600"
//                 }`}
//               >
//                 Dark Mode
//               </span>
//               <Switch
//                 checked={darkMode}
//                 onChange={toggleDarkMode}
//                 className={`${
//                   darkMode ? "bg-blue-600" : "bg-gray-300"
//                 } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
//               >
//                 <span className="sr-only">Toggle Dark Mode</span>
//                 <span
//                   className={`${
//                     darkMode ? "translate-x-6" : "translate-x-1"
//                   } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
//                 />
//               </Switch>
//             </div>

//             {/* User Info and Auth */}
//             {user ? (
//               <>
//                 <div className="hidden md:flex items-center space-x-2">
//                   <User
//                     className={`w-5 h-5 ${
//                       darkMode ? "text-gray-400" : "text-gray-500"
//                     }`}
//                   />
//                   <span
//                     className={`text-sm ${
//                       darkMode ? "text-gray-300" : "text-gray-700"
//                     }`}
//                   >
//                     {user.user_metadata?.full_name || user.email}
//                   </span>
//                   {isAdmin && <Shield className="w-4 h-4 text-red-500" />}
//                   {hasOrganization && (
//                     <span className="text-xs text-gray-500 dark:text-gray-400">
//                       ({organization.membership?.role})
//                     </span>
//                   )}
//                 </div>
//                 {hasOrganization && (
//                   <button
//                     onClick={handleSwitchOrgClick}
//                     className={`hidden md:block text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
//                       darkMode
//                         ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
//                         : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                     }`}
//                   >
//                     Switch Org
//                   </button>
//                 )}
//                 <button
//                   onClick={handleLogout}
//                   className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
//                     darkMode
//                       ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
//                       : "text-red-600 hover:text-red-800 hover:bg-red-50"
//                   }`}
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>Logout</span>
//                 </button>
//               </>
//             ) : (
//               <button
//                 onClick={handleLoginClick}
//                 className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
//                   pathname === "/login"
//                     ? "bg-blue-600 text-white"
//                     : darkMode
//                     ? "text-blue-400 hover:text-blue-300"
//                     : "text-blue-600 hover:text-blue-800"
//                 }`}
//               >
//                 Login
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isMenuOpen && (
//           <div className="md:hidden flex flex-col space-y-2 pt-4 pb-4 border-t border-gray-300 dark:border-gray-700 animate-fade-in">
//             {renderNavItems()}
//             <button
//               onClick={handleAboutClick}
//               className={navLinkClass("/about")}
//             >
//               <Info className="w-4 h-4 inline mr-2" />
//               About
//             </button>
//             <button
//               onClick={handleContactClick}
//               className={navLinkClass("/contact")}
//             >
//               <Mail className="w-4 h-4 inline mr-2" />
//               Contact
//             </button>

//             {hasOrganization && (
//               <button
//                 onClick={handleSwitchOrgClick}
//                 className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
//                   darkMode
//                     ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
//                     : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                 }`}
//               >
//                 <Building2 className="w-4 h-4 inline mr-2" />
//                 Switch Organization
//               </button>
//             )}

//             {user && (
//               <button
//                 onClick={handleLogout}
//                 className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
//                   darkMode
//                     ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
//                     : "text-red-600 hover:text-red-800 hover:bg-red-50"
//                 }`}
//               >
//                 <LogOut className="w-4 h-4 inline mr-2" />
//                 Logout
//               </button>
//             )}

//             {!user && (
//               <button
//                 onClick={handleLoginClick}
//                 className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
//                   pathname === "/login"
//                     ? "bg-blue-600 text-white"
//                     : darkMode
//                     ? "text-blue-400 hover:text-blue-300"
//                     : "text-blue-600 hover:text-blue-800"
//                 }`}
//               >
//                 <User className="w-4 h-4 inline mr-2" />
//                 Login
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }
// // 'use client';

// // import { useState } from 'react';
// // import { useRouter, usePathname } from 'next/navigation';
// // import {
// //   Search,
// //   User,
// //   LogOut,
// //   Mail,
// //   Info,
// //   Shield,
// //   Menu,
// //   Settings,
// // } from 'lucide-react';
// // import { Switch } from '@headlessui/react';
// // import { useTheme } from '@/context/ThemeContext';
// // import { useAuth } from '@/context/AuthUserContext';

// // export default function NavbarAppRouter() {
// //   const { darkMode, toggleDarkMode } = useTheme();
// //   const { user, logout } = useAuth(); // Get user and logout from context
// //   const [isMenuOpen, setIsMenuOpen] = useState(false);
// //   const router = useRouter();
// //   const pathname = usePathname();

// //   // Get user role from either user_metadata or app_metadata
// //   const role = user?.user_metadata?.role || user?.app_metadata?.role;
// //   const isAdmin = role === 'admin';
// //   const isAuthenticated = !!user;
// //   const isRegularUser = role === 'user' || role === 'job_seeker';

// //   // Navigation handlers
// //   const handleProfileClick = () => {
// //     router.push('/profile');
// //     setIsMenuOpen(false);
// //   };

// //   const handleDashboardClick = () => {
// //     router.push('/dashboard');
// //     setIsMenuOpen(false);
// //   };

// //   const handleAdminDashboardClick = () => {
// //     router.push('/admin/dashboard');
// //     setIsMenuOpen(false);
// //   };

// //   const handleSettingsClick = () => {
// //     router.push('/admin/settings');
// //     setIsMenuOpen(false);
// //   };

// //   const handleAboutClick = () => {
// //     router.push('/about');
// //     setIsMenuOpen(false);
// //   };

// //   const handleContactClick = () => {
// //     router.push('/contact');
// //     setIsMenuOpen(false);
// //   };

// //   const handleLoginClick = () => {
// //     router.push('/login');
// //     setIsMenuOpen(false);
// //   };

// //   const handleLogout = async () => {
// //     setIsMenuOpen(false);
// //     await logout(); // This will redirect to /login automatically
// //   };

// //   // Check if current page matches the nav item
// //   const isActive = (path: string) => pathname === path;

// //   const navLinkClass = (path: string) =>
// //     `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
// //       isActive(path)
// //         ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
// //         : darkMode
// //         ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
// //         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
// //     }`;

// //   const handleLogoClick = () => {
// //     if (isAuthenticated) {
// //       if (isAdmin) {
// //         handleAdminDashboardClick();
// //       } else {
// //         handleDashboardClick();
// //       }
// //     } else {
// //       handleLoginClick();
// //     }
// //   };

// //   return (
// //     <nav
// //       style={{
// //         backgroundColor: 'var(--bg-color)',
// //         color: 'var(--text-color)',
// //         width: '100%',
// //       }}
// //       className={`shadow-lg border-b transition-colors duration-200 ${
// //         darkMode ? 'border-gray-600' : 'border-gray-200'
// //       }`}
// //     >
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //         <div className="flex justify-between items-center h-16">
// //           {/* Logo */}
// //           <div className="flex items-center">
// //             <button
// //               onClick={handleLogoClick}
// //               className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
// //             >
// //               JobTracker
// //             </button>
// //           </div>

// //           {/* Desktop Nav */}
// //           <div className="hidden md:flex space-x-4">
// //             {isAdmin ? (
// //               <>
// //                 <button
// //                   onClick={handleAdminDashboardClick}
// //                   className={navLinkClass('/admin/dashboard')}
// //                 >
// //                   <Shield className="w-4 h-4 inline mr-2" />
// //                   Admin Dashboard
// //                 </button>
// //                 <button
// //                   onClick={handleSettingsClick}
// //                   className={navLinkClass('/admin/settings')}
// //                 >
// //                   <Settings className="w-4 h-4 inline mr-2" />
// //                   Settings
// //                 </button>
// //                 <button
// //                   onClick={handleAboutClick}
// //                   className={navLinkClass('/about')}
// //                 >
// //                   <Info className="w-4 h-4 inline mr-2" />
// //                   About
// //                 </button>
// //                 <button
// //                   onClick={handleContactClick}
// //                   className={navLinkClass('/contact')}
// //                 >
// //                   <Mail className="w-4 h-4 inline mr-2" />
// //                   Contact
// //                 </button>
// //               </>
// //             ) : (isAuthenticated && (isRegularUser || !role)) ? (
// //               <>
// //                 <button
// //                   onClick={handleDashboardClick}
// //                   className={navLinkClass('/dashboard')}
// //                 >
// //                   <Search className="w-4 h-4 inline mr-2" />
// //                   Dashboard
// //                 </button>
// //                 <button
// //                   onClick={handleProfileClick}
// //                   className={navLinkClass('/profile')}
// //                 >
// //                   <User className="w-4 h-4 inline mr-2" />
// //                   Profile
// //                 </button>
// //                 <button
// //                   onClick={handleAboutClick}
// //                   className={navLinkClass('/about')}
// //                 >
// //                   <Info className="w-4 h-4 inline mr-2" />
// //                   About
// //                 </button>
// //                 <button
// //                   onClick={handleContactClick}
// //                   className={navLinkClass('/contact')}
// //                 >
// //                   <Mail className="w-4 h-4 inline mr-2" />
// //                   Contact
// //                 </button>
// //               </>
// //             ) : null}
// //           </div>

// //           {/* Right Side: Mobile Menu + Theme + User */}
// //           <div className="flex items-center space-x-4">
// //             {/* Mobile menu toggle */}
// //             <div className="md:hidden">
// //               <button
// //                 onClick={() => setIsMenuOpen(!isMenuOpen)}
// //                 className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform duration-200 hover:scale-110"
// //                 aria-label="Toggle mobile menu"
// //               >
// //                 <Menu className="h-6 w-6" />
// //               </button>
// //             </div>

// //             {/* Dark Mode Toggle */}
// //             <div className="flex items-center space-x-2">
// //               <span
// //                 className={`text-sm ${
// //                   darkMode ? 'text-gray-300' : 'text-gray-600'
// //                 }`}
// //               >
// //                 Dark Mode
// //               </span>
// //               <Switch
// //                 checked={darkMode}
// //                 onChange={toggleDarkMode}
// //                 className={`${
// //                   darkMode ? 'bg-blue-600' : 'bg-gray-300'
// //                 } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
// //               >
// //                 <span className="sr-only">Toggle Dark Mode</span>
// //                 <span
// //                   className={`${
// //                     darkMode ? 'translate-x-6' : 'translate-x-1'
// //                   } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
// //                 />
// //               </Switch>
// //             </div>

// //             {/* User Info and Auth */}
// //             {user ? (
// //               <>
// //                 <div className="hidden md:flex items-center space-x-2">
// //                   <User
// //                     className={`w-5 h-5 ${
// //                       darkMode ? 'text-gray-400' : 'text-gray-500'
// //                     }`}
// //                   />
// //                   <span
// //                     className={`text-sm ${
// //                       darkMode ? 'text-gray-300' : 'text-gray-700'
// //                     }`}
// //                   >
// //                     {user.user_metadata?.full_name || user.email}
// //                   </span>
// //                   {isAdmin && <Shield className="w-4 h-4 text-red-500" />}
// //                 </div>
// //                 <button
// //                   onClick={handleLogout}
// //                   className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
// //                     darkMode
// //                       ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
// //                       : 'text-red-600 hover:text-red-800 hover:bg-red-50'
// //                   }`}
// //                 >
// //                   <LogOut className="w-4 h-4" />
// //                   <span>Logout</span>
// //                 </button>
// //               </>
// //             ) : (
// //               <button
// //                 onClick={handleLoginClick}
// //                 className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
// //                   pathname === '/login'
// //                     ? 'bg-blue-600 text-white'
// //                     : darkMode
// //                     ? 'text-blue-400 hover:text-blue-300'
// //                     : 'text-blue-600 hover:text-blue-800'
// //                 }`}
// //               >
// //                 Login
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         {/* Mobile Menu */}
// //         {isMenuOpen && (
// //           <div className="md:hidden flex flex-col space-y-2 pt-4 pb-4 border-t border-gray-300 dark:border-gray-700 animate-fade-in">
// //             {isAdmin ? (
// //               <>
// //                 <button
// //                   onClick={handleAdminDashboardClick}
// //                   className={navLinkClass('/admin/dashboard')}
// //                 >
// //                   <Shield className="w-4 h-4 inline mr-2" />
// //                   Admin Dashboard
// //                 </button>
// //                 <button
// //                   onClick={handleSettingsClick}
// //                   className={navLinkClass('/admin/settings')}
// //                 >
// //                   <Settings className="w-4 h-4 inline mr-2" />
// //                   Settings
// //                 </button>
// //                 <button
// //                   onClick={handleAboutClick}
// //                   className={navLinkClass('/about')}
// //                 >
// //                   <Info className="w-4 h-4 inline mr-2" />
// //                   About
// //                 </button>
// //                 <button
// //                   onClick={handleContactClick}
// //                   className={navLinkClass('/contact')}
// //                 >
// //                   <Mail className="w-4 h-4 inline mr-2" />
// //                   Contact
// //                 </button>
// //               </>
// //             ) : (isAuthenticated && (isRegularUser || !role)) ? (
// //               <>
// //                 <button
// //                   onClick={handleDashboardClick}
// //                   className={navLinkClass('/dashboard')}
// //                 >
// //                   <Search className="w-4 h-4 inline mr-2" />
// //                   Dashboard
// //                 </button>
// //                 <button
// //                   onClick={handleProfileClick}
// //                   className={navLinkClass('/profile')}
// //                 >
// //                   <User className="w-4 h-4 inline mr-2" />
// //                   Profile
// //                 </button>
// //                 <button
// //                   onClick={handleAboutClick}
// //                   className={navLinkClass('/about')}
// //                 >
// //                   <Info className="w-4 h-4 inline mr-2" />
// //                   About
// //                 </button>
// //                 <button
// //                   onClick={handleContactClick}
// //                   className={navLinkClass('/contact')}
// //                 >
// //                   <Mail className="w-4 h-4 inline mr-2" />
// //                   Contact
// //                 </button>
// //               </>
// //             ) : null}

// //             {user && (
// //               <button
// //                 onClick={handleLogout}
// //                 className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
// //                   darkMode
// //                     ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
// //                     : 'text-red-600 hover:text-red-800 hover:bg-red-50'
// //                 }`}
// //               >
// //                 <LogOut className="w-4 h-4 inline mr-2" />
// //                 Logout
// //               </button>
// //             )}

// //             {!user && (
// //               <button
// //                 onClick={handleLoginClick}
// //                 className={`text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
// //                   pathname === '/login'
// //                     ? 'bg-blue-600 text-white'
// //                     : darkMode
// //                     ? 'text-blue-400 hover:text-blue-300'
// //                     : 'text-blue-600 hover:text-blue-800'
// //                 }`}
// //               >
// //                 <User className="w-4 h-4 inline mr-2" />
// //                 Login
// //               </button>
// //             )}
// //           </div>
// //         )}
// //       </div>
// //     </nav>
// //   );
// // }
