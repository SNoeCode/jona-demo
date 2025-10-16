// import { NextRequest, NextResponse } from 'next/server';
// import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
// import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/app/services/api-utils';

// import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
// import type { ScraperRequest } from '@/types/admin';

// // client/src/app/api/scrapers/logs/route.ts
// export async function GET(request: NextRequest) {
//   try {
//     const adminUser = await validateAdminAuth(request);
//     if (!adminUser) {
//       return createAuthResponse('Admin access required', 403);
//     }

//     const supabaseAdmin = await getSupabaseAdmin();
//     const { data: logs, error } = await supabaseAdmin
//       .from('scraping_logs')
//       .select('*')
//       .order('started_at', { ascending: false })
//       .limit(50);

//     if (error) {
//       throw new Error(`Failed to fetch logs: ${error.message}`);
//     }

//     return createSuccessResponse(logs || []);

//   } catch (error) {
//     console.error('Logs fetch error:', error);
//     return createErrorResponse(
//       error instanceof Error ? error.message : 'Failed to fetch scraping logs'
//     );
//   }
// }