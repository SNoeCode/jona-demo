import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
    role: string;
  };
}

export default function OrgRolePage({ params }: PageProps) {
  // Redirect to the dashboard
  redirect(`/org/${params.slug}/${params.role}/dashboard`);
}
