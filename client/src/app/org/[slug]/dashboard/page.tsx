import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthUserContext';


interface Props {
  slug: string;
}


interface PageProps {
  params: {
    slug: string;
    role: string;
  };
}

export default function OrgRoleDashboardPage({ params }: PageProps) {
  // This will be handled by the client component
  return <OrgRoleDashboardClient slug={params.slug} role={params.role} />;
}

function OrgRoleDashboardClient({ slug, role }: { slug: string; role: string }) {
  // Import the appropriate dashboard component based on role
  switch (role) {
    case 'owner':
      return <OwnerDashboardClient slug={slug} />;
    case 'admin':
      return <AdminDashboardClient slug={slug} />;
    case 'manager':
      return <ManagerDashboardClient slug={slug} />;
    case 'member':
    case 'user':
      return <MemberDashboardClient slug={slug} />;
    default:
      return <div>Invalid role: {role}</div>;
  }
}

// Import the dashboard components
// import OwnerDashboardClient from '@/app/org/[slug]/[role]/dashboard/owner/OwnerDashboardClient';
// import OwnerDashboardClient from '@/app/org/[slug]/dashboard/OwnerDashboardClient';
import AdminDashboardClient from '@/app/org/admin/AdminDashboardClient';
import OwnerDashboardClient from '@/app/org/[slug]/[role]/dashboard/owner/AdminDashboardClient';

import ManagerDashboardClient from '@/app/org/[slug]/manager/dashboard/ManagerDashboardClient';
import MemberDashboardClient from '@/app/org/[slug]/member/dashboard/MemberDashboardClient';
