// app/(auth)/admin/resumes/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ResumeManagement from "@/components/adminDashboard/ResumeManagement";
import { toSerializableAuthUser } from "@/types/user/authUser";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
 
  // ✅ Use getUser() instead of getSession() for security
  const { data: { user: rawUser }, error } = await supabase.auth.getUser();
 
  if (error || !rawUser) {
    console.error('Auth error:', error);
    redirect("/login");
  }

  // Convert to serializable format
  const user = toSerializableAuthUser(rawUser);

  // Check admin role
  if (!user || user.user_metadata?.role !== "admin") {
    console.error('User is not admin:', user.email);
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6">
      <ResumeManagement
        user={user}
        onStatsUpdate={() => console.log("Stats updated")}
      />
    </div>
  );
}