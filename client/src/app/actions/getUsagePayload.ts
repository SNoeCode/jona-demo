// // app/actions/getUsagePayload.ts
// "use server";

// import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import type { Database } from "@/types/database";
// import { isUserUsageSummary } from "@/types/user";
// import type { UsagePayload } from "@/types/user";

// export async function getUsagePayload(userId: string): Promise<UsagePayload | null> {
//   const supabase = createServerComponentClient<Database>({ cookies });

//   const { data: summary, error: summaryError } = await supabase
//     .from("user_usage_summary")
//     .select("*")
//     .eq("user_id", userId)
//     .maybeSingle();

//   if (summary && isUserUsageSummary(summary)) {
//     return summary;
//   }

//   if (summaryError && summaryError.code !== "PGRST116") {
//     console.warn("Usage summary fetch failed:", summaryError.message);
//   }

//   const { data: usageData, error: usageError } = await supabase
//     .from("user_usage")
//     .select("*")
//     .eq("user_id", userId)
//     .order("month_year", { ascending: false })
//     .limit(1);

//   if (usageError) {
//     console.warn("Usage data fetch failed:", usageError.message);
//     return null;
//   }

//   return usageData?.[0] ?? null;
// }


// app/actions/getUsagePayload.ts
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { isUserUsageSummary } from '@/types/user';
import type { UsagePayload } from '@/types/user';

export async function getUsagePayload(): Promise<UsagePayload | null> {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Step 1: Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    console.warn('Auth error in getUsagePayload:', authError?.message);
    return null;
  }

  // Step 2: Try to fetch from user_usage_summary
  const { data: summary, error: summaryError } = await supabase
    .from('user_usage_summary')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (summary && isUserUsageSummary(summary)) {
    return summary;
  }

  if (summaryError && summaryError.code !== 'PGRST116') {
    console.warn('Usage summary fetch failed:', summaryError.message);
  }

  // Step 3: Fallback to latest entry from user_usage
  const { data: usageData, error: usageError } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('month_year', { ascending: false })
    .limit(1);

  if (usageError) {
    console.warn('Usage data fetch failed:', usageError.message);
    return null;
  }

  return usageData?.[0] ?? null;
}