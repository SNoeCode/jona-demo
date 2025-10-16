
'use server'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserManagement } from '@/components/adminDashboard/UserManagement';
import { requireAdminAuth } from '@/lib/supabase/auth-server'; 
export default async function AdminUsersPage() {
    const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const authUser = await requireAdminAuth(); // returns AuthUser

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserManagement user={authUser} onStatsUpdate={() => {}} />
    </div>
  );
}