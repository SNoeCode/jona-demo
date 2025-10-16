'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function getSubscriptionPlans() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error.message);
    return [];
  }

  return data ?? [];
}