import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getTenantDashboardContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_tenant_owner")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.is_tenant_owner) redirect("/dashboard");

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (tenantError || !tenant) redirect("/dashboard");

  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select(`
      *,
      organization_members(count),
      organization_subscriptions (
        status,
        plan_id,
        seats_used
      )
    `)
    .eq("tenant_id", tenant.id);

  if (orgError) redirect("/dashboard");

  return {
    user,
    tenant,
    organizations: organizations ?? [],
  };
}