// jona-demo\client\src\app\org\owner\[slug]\dashboard\page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { requireOrgAuth } from '@/lib/supabase/auth-org';
import { getOrgRole } from '@/services/organization/getOrgRole';
import OwnerDashboardClient from './OwnerDashboardClient';
import { createClient } from '@/lib/supabase/server';

async function getOwnerDashboardData(orgId: string) {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    console.error('Error fetching organization:', orgError);
    return null;
  }

  const { data: members, error: membersError } = await supabase
    .from('organization_members')
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
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('joined_at', { ascending: false });

  if (membersError) console.error('Error fetching members:', membersError);

  const { data: stats, error: statsError } = await supabase.rpc(
    'get_organization_stats',
    { org_uuid: orgId }
  );
  if (statsError) console.error('Error fetching stats:', statsError);

  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  if (subError) console.error('Error fetching subscription:', subError);

  const { data: auditLogs, error: auditError } = await supabase
    .from('organization_audit_logs')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (auditError) console.error('Error fetching audit logs:', auditError);

  const { data: usage, error: usageError } = await supabase
    .from('organization_usage')
    .select('*')
    .eq('organization_id', orgId)
    .order('month', { ascending: false })
    .limit(3);
  if (usageError) console.error('Error fetching usage:', usageError);

  return {
    organization: org,
    members: members || [],
    stats: stats?.[0] || {
      total_members: 0,
      total_jobs: 0,
      total_applications: 0,
      total_resumes: 0,
    },
    subscription: subscription || null,
    auditLogs: auditLogs || [],
    usage: usage || [],
  };
}

export default async function OwnerDashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const orgSlug = params.slug;

  const orgAuth = await requireOrgAuth(orgSlug);
  if (!orgAuth) redirect(`/org/${orgSlug}/login`);

  // Normalize role and guard
  const role = getOrgRole(orgAuth); // guaranteed string from helper

  if (!['owner', 'admin'].includes(role)) {
    redirect(`/org/${orgSlug}/dashboard`);
  }

  // Validate IDs exist before calling data loader
  const orgId = orgAuth.organizationId;
  const userId = orgAuth.user?.id;

  if (!orgId || !userId) {
    console.error('Missing orgId or userId on orgAuth', { orgAuth });
    redirect('/org/error');
  }

  const data = await getOwnerDashboardData(orgId);
  if (!data) redirect('/org/error');

  return (
    <OwnerDashboardClient
      organization={data.organization}
      members={data.members}
      stats={data.stats}
      subscription={data.subscription}
      auditLogs={data.auditLogs}
      usage={data.usage}
      userRole={role} // role is a string, not string | undefined
    />
  );
}