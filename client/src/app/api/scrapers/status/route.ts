import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse, checkRateLimit } from '@/utils/api-utils';
import { scraperApiClient } from '@/services/scraperApiClient'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { ScraperRequest } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await validateAdminAuth(request);
    if (!adminUser) {
      return createAuthResponse('Admin access required', 403);
    }

    const status = await scraperApiClient.getScraperStatus();
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: runningScrapers } = await supabaseAdmin
      .from('scraping_logs')
      .select('id, status, scraper_type')
      .eq('status', 'running');

    return createSuccessResponse({
      ...status,
      running_scrapers: runningScrapers?.length || 0,
      available_scrapers: ['indeed', 'careerbuilder', 'dice', 'ziprecruiter', 'teksystems'],
      database_running: runningScrapers || [],
    });

  } catch (error) {
    console.error('Status check error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get scraper status'
    );
  }
}
