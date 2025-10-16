// lib/jobService.ts
'use server';
 
import {supabase} from '@/lib/supabaseClient';

export async function getJobApplications(userId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}