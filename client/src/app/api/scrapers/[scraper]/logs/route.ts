// app/api/scrapers/logs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth, createAuthResponse } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse } from '@/utils/api-utils';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // ✅ Step 1: Authenticate admin
    const adminUser = await validateAdminAuth(request);
    if (!adminUser) {
      return createAuthResponse('Admin access required', 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const source = searchParams.get('source') || 'supabase'; // 'supabase' or 'fastapi'

    // ✅ Step 2: Choose source
    if (source === 'fastapi') {
      const response = await fetch(`${FASTAPI_BASE_URL}/api/scrapers/logs?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`FastAPI fetch failed: ${response.status}`);
      }
      const data = await response.json();
      return createSuccessResponse(data.logs || []);
    }

    // ✅ Step 3: Default to Supabase
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: logs, error } = await supabaseAdmin
      .from('scraping_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase fetch failed: ${error.message}`);
    }

    return createSuccessResponse(logs || []);

  } catch (error) {
    console.error('❌ Logs fetch error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch scraping logs'
    );
  }
}