// import { NextRequest, NextResponse } from 'next/server';
// import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
// import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/app/services/api-utils';

// import { scraperApiClient } from '@/app/services/scraperApiClient'

// import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
// import type { ScraperRequest } from '@/types/admin';

// // client/src/app/api/scrapers/stats/route.ts
// export async function GET(request: NextRequest) {
//   try {
//     const adminUser = await validateAdminAuth(request);
//     if (!adminUser) {
//       return createAuthResponse('Admin access required', 403);
//     }

//     const supabaseAdmin = await getSupabaseAdmin();
    
//     // Get aggregate stats from database
//     const { data: stats, error } = await supabaseAdmin
//       .from('scraping_logs')
//       .select('jobs_found, jobs_saved, duration_seconds, status')
//       .not('completed_at', 'is', null);

//     if (error) {
//       throw new Error(`Failed to fetch stats: ${error.message}`);
//     }

//     const totalSessions = stats?.length || 0;
//     const totalJobsFound = stats?.reduce((sum, log) => sum + (log.jobs_found || 0), 0) || 0;
//     const completedSessions = stats?.filter(log => log.status === 'completed') || [];
//     const averageDuration = completedSessions.length > 0 
//       ? completedSessions.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) / completedSessions.length 
//       : 0;
//     const successRate = totalSessions > 0 
//       ? Math.round((completedSessions.length / totalSessions) * 100) 
//       : 0;

//     return createSuccessResponse({
//       totalSessions,
//       totalJobsFound,
//       averageDuration,
//       successRate,
//     });

//   } catch (error) {
//     console.error('Stats fetch error:', error);
//     return createErrorResponse(
//       error instanceof Error ? error.message : 'Failed to fetch scraper stats'
//     );
//   }
// }