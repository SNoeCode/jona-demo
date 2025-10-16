// // client\src\app\(auth)\admin\subscriptions\stats\route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {getSupabaseAdmin} from "@/lib/supabaseAdmin";

// export async function GET() {
//   try {
//     const supabaseAdmin = await getSupabaseAdmin();

//     const [subscriptionsResult, paymentsResult, usageResult] = await Promise.all([
//       supabaseAdmin
//         .from("user_subscriptions")
//         .select(`
//           status,
//           subscription_plans!user_subscriptions_plan_id_fkey (
//             name,
//             price_monthly
//           )
//         `),
//       supabaseAdmin
//         .from("subscription_payments")
//         .select("amount, created_at"),
//       supabaseAdmin
//         .from("users")
//         .select("id", { count: "exact" })
//     ]);

//     const subscriptions = subscriptionsResult.data || [];
//     const payments = paymentsResult.data || [];
//     const totalUsers = usageResult.count || 0;

//     // Calculate stats
//     const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
//     const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

//     // Calculate MRR (last 30 days)
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     const recentPayments = payments.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
//     const monthlyRecurringRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);

//     // Calculate churn rate (simplified)
//     const canceledSubscriptions = subscriptions.filter(s => s.status === "canceled").length;
//     const churnRate =
//       activeSubscriptions > 0
//         ? (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100
//         : 0;

//     // Average revenue per user
//     const averageRevenuePerUser =
//       activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

//     // Plan distribution
//     const planCounts = subscriptions.reduce((acc, sub) => {
//       const plan = Array.isArray(sub.subscription_plans)
//         ? sub.subscription_plans[0]
//         : sub.subscription_plans;

//       const planName = plan?.name?.toLowerCase() || "free";
//       acc[planName] = (acc[planName] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);

//     // Add free users
//     const paidUsers = subscriptions.length;
//     const freeUsers = totalUsers - paidUsers;
//     planCounts.free = (planCounts.free || 0) + freeUsers;

//     const stats = {
//       totalRevenue,
//       monthlyRecurringRevenue,
//       activeSubscriptions,
//       churnRate: Math.round(churnRate * 100) / 100,
//       averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
//       planDistribution: {
//         free: planCounts.free || 0,
//         pro: planCounts.pro || 0,
//         enterprise: planCounts.enterprise || 0
//       }
//     };

//     return NextResponse.json(stats, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching subscription stats:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// client\src\app\api\admin\dashboard\stats\route.ts
// 'use server'
// import { NextRequest, NextResponse } from "next/server";
// import {setBaseURL,handleAdminError} from "@/utils/baseUrl";
// import { supabase } from "@/lib/supabaseClient";

// export async function GET(request: NextRequest) {
//   try {
    
//     // const supabase = AdminServiceBase["supabase"]; // protected getter
//     const { data: jobsData, error: jobsError } = await supabase
//       .from("jobs")
//       .select("id, applied, saved, status");

//     if (jobsError) throw jobsError;

//     const { data: usersData } = await supabase.from("users").select("id");
//     const { data: resumesData } = await supabase.from("resumes").select("id");
//     const { data: applicationsData } = await supabase
//       .from("user_job_status")
//       .select("applied")
//       .eq("applied", true);
//     const { data: comparisonsData } = await supabase
//       .from("resume_comparisons")
//       .select("match_score");

//     const totalJobs = jobsData?.length || 0;
//     const appliedJobs = jobsData?.filter(j => j.applied).length || 0;
//     const savedJobs = jobsData?.filter(j => j.saved).length || 0;
//     const pendingJobs = jobsData?.filter(j => j.status === "pending").length || 0;
//     const rejectedJobs = jobsData?.filter(j => j.status === "rejected").length || 0;

//     const totalUsers = usersData?.length || 0;
//     const totalResumes = resumesData?.length || 0;
//     const totalApplications = applicationsData?.length || 0;

//     const matchScores = (comparisonsData || [])
//       .map(c => c.match_score)
//       .filter(score => score !== null) as number[];

//     const avgMatchScore =
//       matchScores.length > 0
//         ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
//         : 0;

//     const stats = {
//       totalJobs,
//       appliedJobs,
//       savedJobs,
//       pendingJobs,
//       interviewJobs: 0,
//       offerJobs: 0,
//       rejectedJobs,
//       matchRate: 0,
//       matchScore: 0,
//       totalUsers,
//       activeUsers: totalUsers,
//       totalResumes,
//       avgMatchScore,
//       totalApplications,
//     };

//     return NextResponse.json(stats, { status: 200 });
//   } catch (error) {
//     const message = handleAdminError(error);
//     console.error("Error fetching dashboard stats:", message);
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import { getDashboardStats } from '@/lib/services/admin-services/dashboard';

// export async function GET(request: NextRequest) {
//   try {
//     const stats = await getDashboardStats();
//     return NextResponse.json(stats);
//   } catch (error) {
//     console.error('Error fetching dashboard stats:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch dashboard stats' },
//       { status: 500 }
//     );
//   }
// }