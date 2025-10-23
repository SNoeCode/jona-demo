// client/src/app/org/member/[slug]/dashboard/page.tsx
import { requireOrgAuth } from '@/lib/supabase/auth-org';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MemberDashboardClient from './MemberDashboardClient'; // ensure file exists and exports default
import { getOrgRole } from '@/services/organization/getOrgRole';

async function getMemberDashboardData(orgId: string, userId: string) {
  const supabase = await createClient();

  // Get organization details (basic info only)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    console.error('Error fetching organization:', orgError);
    return null;
  }

  // Get user's saved jobs
  const { data: savedJobs, error: savedError } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', orgId);

  // Get user's applications
  const { data: applications, error: appsError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .order('applied_at', { ascending: false });

  return {
    organization: org,
    savedJobs: savedJobs || [],
    applications: applications || [],
    userName: userId,
  };
}

export default async function MemberDashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const orgAuth = await requireOrgAuth(params.slug);

  // Normalize role safely
  const role = getOrgRole(orgAuth);

  // Guard: ensure role is allowed
  if (!['member', 'user'].includes(role)) {
    redirect(`/org/${params.slug}/dashboard`);
  }

  // Guard: ensure required ids are present before calling data loader
  const orgId = orgAuth?.organizationId;
  const userId = orgAuth?.user?.id;

  if (!orgId || !userId) {
    console.error('Missing orgId or userId on orgAuth', { orgAuth });
    redirect('/org/error');
  }

  const data = await getMemberDashboardData(orgId, userId);

  if (!data) {
    redirect('/org/error');
  }

  return (
    <MemberDashboardClient
      organization={data.organization}
      savedJobs={data.savedJobs}
      applications={data.applications}
      userName={data.userName}
    />
  );
}