// client/src/app/(protected)/admin/dashboard/page.tsx

"use server";

import { AdminDashboard } from "@/components/adminDashboard/AdminDashboard";
import { requireAdminAuth } from "@/lib/supabase/auth-server";
import {
  getDashboardStats,
  getAllJobs,
} from "@/app/services/server-admin/admin-server";
import { getAllUsers } from "@/services/admin/admin_users";
import { mapToAdminDashboardStats } from "@/helpers/dashboardStats";
import type { AdminDashboardStats } from "@/types/admin";
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
  applications: JobApplication[];
}

export default async function AdminPage() {
  const authUser = await requireAdminAuth();

  const page = 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const jobParams = { search: "", status: "open", limit, offset };
  const userParams = { search: "", limit, offset };

  const [statsRaw, jobsRaw, usersRaw] = await Promise.all([
    getDashboardStats(),
    getAllJobs(jobParams),
    getAllUsers(userParams),
  ]);

  const applications: JobApplication[] = [];
  const resumes: Resume[] = [];

  const initialStats = mapToAdminDashboardStats(
    statsRaw,
    applications,
    resumes,
    usersRaw,
    jobsRaw
  );

  const initialFilters: FilterOptions = { status: "open" };

  // ✅ Sanitize all props before passing to Client Component
  const safeJobs = JSON.parse(JSON.stringify(jobsRaw));
  const safeUsers = JSON.parse(JSON.stringify(usersRaw));
  const safeStats = JSON.parse(JSON.stringify(initialStats));
  const safeUser = JSON.parse(JSON.stringify(authUser));

  return (
    <AdminDashboard
      initialJobs={safeJobs}
      initialUsers={safeUsers}
      initialStats={safeStats}
      initialFilters={initialFilters}
      user={safeUser}
      role="admin"
      applications={applications}
    />
  );
}
