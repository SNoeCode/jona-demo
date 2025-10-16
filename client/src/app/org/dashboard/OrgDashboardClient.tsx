// client/src/app/(protected)/org/[slug]/dashboard/OrgDashboardClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  LogOut,
  UserPlus,
  Search,
} from "lucide-react";

interface OrgDashboardClientProps {
  organization: any;
  members: any[];
  stats: {
    total_members: number;
    total_jobs: number;
    total_applications: number;
    total_resumes: number;
  };
  userRole: string;
  membership: {
    id: string;
    role: string;
    department: string | null;
    position: string | null;
    joined_at: string;
  };
  organizationSlug: string;
}

export default function OrgDashboardClient({
  organization,
  members,
  stats,
  userRole,
  membership,
  organizationSlug,
}: OrgDashboardClientProps) {
  const router = useRouter();
  const [talents, setTalents] = useState(members);

  const handleSignOut = async () => {
    // Your sign out logic
    router.push("/login");
  };

  const isAdmin = userRole === "admin" || userRole === "owner";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Your Role: <span className="font-medium">{userRole}</span>
                {membership.department && ` • ${membership.department}`}
                {membership.position && ` • ${membership.position}`}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Access Notice */}
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-yellow-800">
              <strong>Admin Access:</strong> You can run scrapers, manage users,
              and view all organization data
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Talents Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Organization Members
                </h2>
                {isAdmin && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Joined
                      </th>
                      {isAdmin && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {member.users?.full_name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.users?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {member.department || "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Manage
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-6">
            {/* Organization Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Organization Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Members:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_members}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Active Jobs:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_jobs}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Total Applications:
                  </span>
                  <span className="font-bold text-gray-900">
                    {stats.total_applications}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Resumes:</span>
                  <span className="font-bold text-gray-900">
                    {stats.total_resumes}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {isAdmin && (
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Run Job Scraper
                    </span>
                  </button>
                )}
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition text-left">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    View Team
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    View Analytics
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-left">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">
                    Browse Jobs
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}// // client/src/app/org/dashboard/OrgDashboardClient.tsx
// "use client";

// import { useState } from "react";
// import {
//   Building2,
//   Users,
//   Briefcase,
//   FileText,
//   // TrendingUp,
//   Settings,
//   // Plus,
//   Search,
//   // Filter,
//   // Calendar,
//   Activity,
//   DollarSign,
//   UserPlus,
// } from "lucide-react";
// import Link from "next/link";
// import { format } from "date-fns";
// type Organization = {
//   id: string;
//   name: string;
//   slug: string;
//   created_at?: string;
//   updated_at?: string;
// };

// type Member = {
//   id: string;
//   user_id: string;
//   organization_id: string;
//   role: string;
//   is_active: boolean;
//   joined_at?: string;
//   department?: string;
//   position?: string;
//   user?: {
//     id: string;
//     email: string;
//     name?: string;
//   };
// };
// interface OrgDashboardProps {
//   organization: Organization;
//   members: Member[];
//   stats: {
//     total_members: number;
//     total_jobs: number;
//     total_applications: number;
//     total_resumes: number;
//   };
//   userRole: string;
// }
// export default function OrgDashboardClient({
//   organization,
//   members,
//   stats,
//   userRole,
// }: OrgDashboardProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedDepartment, setSelectedDepartment] = useState("all");
//   // const [timeRange, setTimeRange] = useState('month');

//   const canManageOrg = ["owner", "admin"].includes(userRole);

//   const filteredMembers = members.filter((member) => {
//     const matchesSearch =
//       member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesDepartment =
//       selectedDepartment === "all" || member.department === selectedDepartment;
//     return matchesSearch && matchesDepartment;
//   });

//   const departments = [
//     ...new Set(members.map((m) => m.department).filter(Boolean)),
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Header */}
//       <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-6">
//             <div className="flex items-center space-x-4">
//               <Building2 className="h-8 w-8 text-blue-600" />
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {organization?.name}
//                 </h1>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   Organization Dashboard
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-4">
//               {canManageOrg && (
//                 <Link
//                   href="/org/settings"
//                   className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
//                 >
//                   <Settings className="h-5 w-5" />
//                   <span>Settings</span>
//                 </Link>
//               )}
//               <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
//                 <UserPlus className="h-5 w-5" />
//                 <span>Invite Member</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Stats Grid */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-4">
//               <Users className="h-8 w-8 text-blue-600" />
//               <span className="text-sm text-green-600 dark:text-green-400">
//                 +12%
//               </span>
//             </div>
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
//               {stats.total_members}
//             </h3>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Team Members
//             </p>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-4">
//               <Briefcase className="h-8 w-8 text-green-600" />
//               <span className="text-sm text-green-600 dark:text-green-400">
//                 +8%
//               </span>
//             </div>
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
//               {stats.total_jobs}
//             </h3>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Active Jobs
//             </p>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-4">
//               <FileText className="h-8 w-8 text-purple-600" />
//               <span className="text-sm text-green-600 dark:text-green-400">
//                 +23%
//               </span>
//             </div>
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
//               {stats.total_applications}
//             </h3>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Applications
//             </p>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-4">
//               <Activity className="h-8 w-8 text-orange-600" />
//               <span className="text-sm text-green-600 dark:text-green-400">
//                 +5%
//               </span>
//             </div>
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
//               {stats.total_resumes}
//             </h3>
//             <p className="text-sm text-gray-500 dark:text-gray-400">Resumes</p>
//           </div>
//         </div>

//         {/* Team Members Section */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
//           <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 Team Members
//               </h2>

//               <div className="flex items-center space-x-4 mt-4 sm:mt-0">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search members..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//                   />
//                 </div>

//                 <select
//                   value={selectedDepartment}
//                   onChange={(e) => setSelectedDepartment(e.target.value)}
//                   className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//                 >
//                   <option value="all">All Departments</option>
//                   {departments.map((dept) => (
//                     <option key={dept} value={dept}>
//                       {dept}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Members Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50 dark:bg-gray-700/50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Member
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Role
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Department
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Position
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Joined
//                   </th>
//                   {canManageOrg && (
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredMembers.map((member) => (
//                   <tr
//                     key={member.id}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         {/* <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
//                           {member?.full_name?.[0] || member.users?.email?.[0]}
//                         </div>
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900 dark:text-white">
//                             {member.users?.full_name || 'Unknown'}
//                           </div>
//                           <div className="text-sm text-gray-500 dark:text-gray-400">
//                             {member.users?.email}
//                           </div>
//                         </div> */}
//                         <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
//                           {member.user?.name?.[0] || member.user?.email?.[0]}
//                         </div>

//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900 dark:text-white">
//                             {member.user?.name || "Unknown"}
//                           </div>
//                           <div className="text-sm text-gray-500 dark:text-gray-400">
//                             {member.user?.email}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                           member.role === "owner"
//                             ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
//                             : member.role === "admin"
//                             ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
//                             : member.role === "manager"
//                             ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
//                             : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
//                         }`}
//                       >
//                         {member.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
//                       {member.department || "-"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
//                       {member.position || "-"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
//                       {member.joined_at
//                         ? format(new Date(member.joined_at), "MMM d, yyyy")
//                         : "-"}
//                     </td>
//                     {canManageOrg && (
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
//                           Edit
//                         </button>
//                         <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
//                           Remove
//                         </button>
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         {canManageOrg && (
//           <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
//             <Link
//               href="/org/members/invite"
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-center space-x-4">
//                 <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//                   <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-gray-900 dark:text-white">
//                     Invite Team Members
//                   </h3>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     Add new members to your organization
//                   </p>
//                 </div>
//               </div>
//             </Link>

//             <Link
//               href="/org/settings"
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-center space-x-4">
//                 <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
//                   <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-gray-900 dark:text-white">
//                     Organization Settings
//                   </h3>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     Manage org preferences and details
//                   </p>
//                 </div>
//               </div>
//             </Link>

//             <Link
//               href="/org/billing"
//               className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-center space-x-4">
//                 <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
//                   <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-gray-900 dark:text-white">
//                     Billing & Subscription
//                   </h3>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     Manage billing and plan details
//                   </p>
//                 </div>
//               </div>
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
