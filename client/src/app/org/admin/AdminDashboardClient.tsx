// src/app/org/admin/[slug]/dashboard/AdminDashboardClient.tsx

interface Props {
    slug: string;
  }
  
  export default function AdminDashboardClient({ slug }: Props) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <p>Organization slug: <strong>{slug}</strong></p>
        <p>Welcome, Admin! This is your dashboard.</p>
        {/* Add widgets, charts, or links here */}
      </div>
    );
  }