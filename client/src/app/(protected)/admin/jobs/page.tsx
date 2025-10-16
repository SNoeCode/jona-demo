// app/(auth)/admin/jobs/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {JobManagement} from "@/components/adminDashboard/JobsManagement";
import { toSerializableAuthUser } from "@/types/user/authUser";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data: { user: rawUser }, error } = await supabase.auth.getUser();

  if (error || !rawUser) {
    console.error('Auth error:', error);
    redirect("/login");
  }

  const user = toSerializableAuthUser(rawUser);

  if (!user || user.user_metadata?.role !== "admin") {
    console.error('User is not admin:', user.email);
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6">
      <JobManagement 
        user={user}
        onStatsUpdate={() => console.log("Stats updated")}
      />
    </div>
  );
}