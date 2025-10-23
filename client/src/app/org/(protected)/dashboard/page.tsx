// jona-demo\client\src\app\org\(protected)\[role]\[slug]\dashboard\page.tsx
import { requireOrgAuth } from '@/lib/supabase/auth-org';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation'; // ✅ Add this import
import OrgDashboardClient from './OrgDashboardClient';

async function getOrgData(orgId: string, userId: string) {
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
    .eq("is_active", true);

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  const { data: stats, error: statsError } = await supabase.rpc(
    "get_organization_stats",
    { org_uuid: orgId }
  );

  if (statsError) {
    console.error("Error fetching stats:", statsError);
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
  };
}

export default async function OrgDashboardPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // This automatically checks auth and membership, redirects if unauthorized
  const orgAuth = await requireOrgAuth(params.slug);
  
  // Fetch additional org data
  const data = await getOrgData(orgAuth.organizationId, orgAuth.user.id);
  
  if (!data) {
    redirect("/org/error");
  }
  
  return (
    <OrgDashboardClient 
      organization={data.organization}
      members={data.members}
      stats={data.stats}
      userRole={orgAuth.memberRole}
      membership={orgAuth.membership}
      organizationSlug={orgAuth.organizationSlug}
    />
  );
}