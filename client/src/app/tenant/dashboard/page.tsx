import { redirect } from "next/navigation";
import TenantDashboardClient from "./TenantDashboardClient";
import { getTenantDashboardContext } from "@/services/organization/tenant";

export default async function TenantDashboardPage() {
  const { user, tenant, organizations } = await getTenantDashboardContext();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <TenantDashboardClient
      user={{ ...user, email: user.email }}
      tenant={tenant}
      organizations={organizations}
    />
  );
}