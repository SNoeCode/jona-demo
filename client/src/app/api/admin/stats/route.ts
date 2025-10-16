
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleAdminError } from '@/utils/baseUrl';



export async function POST(request: NextRequest) {
  console.log('🔄 Manual stats refresh requested');
  return GET(request); // Reuse the GET logic
}


export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: jobsData, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id, applied, saved, status');
    if (jobsError) throw jobsError;

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: resumesData, error: resumesError } = await supabaseAdmin
      .from('resumes')
      .select('id');
    if (resumesError) throw resumesError;

    const { data: applicationsData, error: applicationsError } = await supabaseAdmin
      .from('user_job_status')
      .select('applied')
      .eq('applied', true);
    if (applicationsError) throw applicationsError;

    const { data: comparisonsData, error: comparisonsError } = await supabaseAdmin
      .from('resume_comparisons')
      .select('match_score');
    if (comparisonsError) throw comparisonsError;

    const { data: subsData, error: subsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('price_paid, status');
    if (subsError) throw subsError;

    const totalJobs = jobsData?.length || 0;
    const appliedJobs = jobsData?.filter(j => j.applied).length || 0;
    const savedJobs = jobsData?.filter(j => j.saved).length || 0;
    const pendingJobs = jobsData?.filter(j => j.status === 'pending').length || 0;
    const rejectedJobs = jobsData?.filter(j => j.status === 'rejected').length || 0;

    const totalUsers = authUsers?.users?.length || 0;
    const totalResumes = resumesData?.length || 0;
    const totalApplications = applicationsData?.length || 0;

    const matchScores = (comparisonsData || [])
      .map(c => c.match_score)
      .filter(score => typeof score === 'number');
    const avgMatchScore =
      matchScores.length > 0
        ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
        : 0;

    const activeSubs = subsData?.filter(s => s.status === 'active') || [];
    const totalRevenue = subsData?.reduce((sum, s) => sum + (s.price_paid || 0), 0) || 0;
    const monthlyRecurringRevenue = activeSubs.reduce((sum, s) => sum + (s.price_paid || 0), 0);
    const activeSubscriptions = activeSubs.length;

    const stats = {
      totalJobs,
      appliedJobs,
      savedJobs,
      pendingJobs,
      interviewJobs: 0,
      offerJobs: 0,
      rejectedJobs,
      matchRate: matchScores.length > 0 ? Math.round((avgMatchScore / 100) * 100) : 0,
      matchScore: avgMatchScore,
      totalUsers,
      activeUsers: totalUsers,
      totalResumes,
      avgMatchScore,
      totalApplications,
      totalRevenue,
      monthlyRecurringRevenue,
      activeSubscriptions,
    };

    await supabaseAdmin
      .from('admin_dashboard_stats')
      .insert({ ...stats, recorded_at: new Date().toISOString() });

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    const message = await handleAdminError(error);
    console.error('Error fetching dashboard stats:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


