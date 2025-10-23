// jona-demo\client\src\app\org\manager\[slug]\dashboard\page.tsx
import { requireOrgAuth } from '@/lib/supabase/auth-org';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ManagerDashboardClient from './ManagerDashboardClient';

async function getManagerDashboardData(orgId: string, userId: string) {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    console.error("Error fetching organization:", orgError);
    return null;
  }

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select(`
      *,
      users:user_id (
        id,
        email,
        full_name,
        avatar_url,
        created_at
      )
    `)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("joined_at", { ascending: false });

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  // Get basic stats
  const { data: stats, error: statsError } = await supabase.rpc(
    "get_organization_stats",
    { org_uuid: orgId }
  );

  if (statsError) {
    console.error("Error fetching stats:", statsError);
  }

  // Get recent applications (for analytics)
  const { data: recentApps, error: appsError } = await supabase
    .from("job_applications")
    .select("*")
    .eq("organization_id", orgId)
    .order("applied_at", { ascending: false })
    .limit(10);

  if (appsError) {
    console.error("Error fetching applications:", appsError);
  }

  return {
    organization: org,
    members: members || [],
    stats: stats?.[0] || {
      total_members: 0,
      total_jobs: 0,
      total_applications: 0,
      total_resumes: 0,
    },
    recentApplications: recentApps || [],
  };
}

export default async function ManagerDashboardPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const orgAuth = await requireOrgAuth(params.slug);
  
  // Verify user is a manager
  if (orgAuth.role !== 'manager') {
    redirect(`/org/${params.slug}/dashboard`);
  }
  
  const data = await getManagerDashboardData(orgAuth.organizationId, orgAuth.user.id);
  
  if (!data) {
    redirect("/org/error");
  }
  
  return (
    <ManagerDashboardClient 
      organization={data.organization}
      members={data.members}
      stats={data.stats}
      recentApplications={data.recentApplications}
    />
  );
}