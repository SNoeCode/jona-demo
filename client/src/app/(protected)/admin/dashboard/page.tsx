// // client\src\app\(protected)\admin\dashboard\page.tsx
// "use client";
'use server'
import { AdminDashboard } from "@/components/adminDashboard/AdminDashboard";
import { requireAdminAuth } from "@/lib/supabase/auth-server";
import {
  getDashboardStats,
  getAllJobs,
} from "@/app/services/server-admin/admin-server";
import { getAllUsers } from "@/services/admin/admin_users";
import { mapToAdminDashboardStats } from "@/helpers/dashboardStats";
import { AdminDashboardStats } from "@/types/admin";
import type { Job } from "@/types/user";
import type { AdminUser } from "@/types/admin";
import type { FilterOptions } from "@/types/admin";
import type { AuthUser } from "@/types/user/authUser";
import type { JobApplication } from "@/types/user/application";
import type { Resume } from "@/types/user/resume";
export interface AdminDashboardProps {
  initialJobs: Job[];
  initialUsers: AdminUser[];
  initialStats: AdminDashboardStats;
  initialFilters: FilterOptions;
  user: AuthUser;
  role: "admin";
  applications: JobApplication[]; // ✅ required
}
export default async function AdminPage() {
  const authUser = await requireAdminAuth();

  const page = 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const jobParams = { search: "", status: "open", limit, offset };
  const userParams = { search: "", limit, offset };

  const [statsRaw, jobs, users] = await Promise.all([
    getDashboardStats(),
    getAllJobs(),
    getAllUsers(userParams),
  ]);

  // If you have applications and resumes, fetch and pass them here
  const applications: JobApplication[] = [];
  const resumes: Resume[] = [];
  const initialStats = mapToAdminDashboardStats(
    statsRaw,
    applications,
    resumes,
    users,
    jobs
  );

  const initialFilters: FilterOptions = { status: "open" };
  return (
    <AdminDashboard
      initialJobs={jobs}
      initialUsers={users}
      initialStats={initialStats}
      initialFilters={initialFilters}
      user={authUser}
      role="admin"
      applications={applications}
    />
  );
}
