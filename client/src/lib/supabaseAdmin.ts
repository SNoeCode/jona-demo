// client/src/lib/supabaseAdmin.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}