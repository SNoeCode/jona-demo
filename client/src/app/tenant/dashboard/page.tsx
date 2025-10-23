// client/src/app/tenant/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TenantDashboardClient from './TenantDashboardClient';
import React from 'react';
import { Organization } from "@/types";
export type TenantDashboardProps = {
  tenant: any;
  organizations: Organization[];
};
async function getTenantDashboardData() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify tenant owner
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_tenant_owner")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.is_tenant_owner) {
    redirect("/dashboard");
  }

  // Get tenant info
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (tenantError || !tenant) {
    redirect("/dashboard");
  }

  // Get all organizations (NO USER DATA - just org stats)
  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      industry,
      size,
      is_active,
      created_at
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (orgError) {
    console.error("Error fetching organizations:", orgError);
  }

  // Get member counts for each org (NO individual user data)
  const orgIds = organizations?.map(org => org.id) || [];
  const { data: memberCounts, error: countError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .in("organization_id", orgIds)
    .eq("is_active", true);

  // Get subscription info for each org
  const { data: subscriptions, error: subError } = await supabase
    .from("organization_subscriptions")
    .select("organization_id, status, seats_included, seats_used")
    .in("organization_id", orgIds);

  // Aggregate member counts
  const memberCountMap: Record<string, number> = {};
  memberCounts?.forEach(m => {
    memberCountMap[m.organization_id] = (memberCountMap[m.organization_id] || 0) + 1;
  });

  // Aggregate subscription data
  const subscriptionMap: Record<string, any> = {};
  subscriptions?.forEach(s => {
    subscriptionMap[s.organization_id] = s;
  });

  // Combine data (NO USER DATA INCLUDED)
  const enrichedOrgs = organizations?.map(org => ({
    ...org,
    memberCount: memberCountMap[org.id] || 0,
    subscription: subscriptionMap[org.id] || null,
  })) || [];

  return {
    user,
    tenant,
    organizations: enrichedOrgs,
  };
}

export default async function TenantDashboardPage() {
  const data = await getTenantDashboardData();

  return (
    <TenantDashboardClient 
      tenant={data.tenant}
      organizations={data.organizations}
    />
  );
}