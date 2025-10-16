'use server';

import {
  EnhancedUserProfile,
  AuthUser,
  PublicUser,
  SubmittedJob,
  JobApplication,
  ApplicationRecord,
  JobStats,
  UserJobStatus,
  UserSettings,
} from '@/types/user';
import { toAuthUser } from '@/types/user/authUser';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { safeSelect, safeSingle } from '@/lib/safeFetch';

function getServerClient() {
  return createServerComponentClient<Database>({
    cookies: () => cookies(),
  });
}

export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    const supabase = getServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user && user.id === userId) {
      return toAuthUser(user);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function createUserProfile(userData: Partial<AuthUser>): Promise<AuthUser | null> {
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser | null> {
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('user_settings fetch failed:', error.message);
    return null;
  }

  if (!data || data.length === 0) return null;
  if (data.length > 1) {
    console.warn(`Multiple user_settings rows found for user_id=${userId}. Returning first one.`);
  }

  return data[0] as UserSettings;
}

export async function getSubmittedJobs(userId: string): Promise<SubmittedJob[]> {
  const supabase = getServerClient();

  const response = await supabase
    .from('submitted_jobs')
    .select('*')
    .eq('user_id', userId);

  return safeSelect<SubmittedJob[]>(response, 'submitted_jobs');
}

export async function getJobApplications(userId: string): Promise<JobApplication[]> {
  const supabase = getServerClient();

  const response = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId);

  return safeSelect<JobApplication[]>(response, 'job_applications');
}

export async function getApplicationRecords(userId: string): Promise<ApplicationRecord[]> {
  const supabase = getServerClient();

  const response = await supabase
    .from('application_records')
    .select('*')
    .eq('user_id', userId);

  return safeSelect<ApplicationRecord[]>(response, 'application_records');
}

export async function getJobStats(userId: string): Promise<JobStats> {
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc('get_user_job_stats', {
    user_id_input: userId,
  });

  if (error) {
    console.error('Error fetching job stats:', error.message);
    return {};
  }

  return data as JobStats;
}

export async function getJobStatuses(userId: string): Promise<UserJobStatus[]> {
  const supabase = getServerClient();

  const response = await supabase
    .from('user_job_statuses')
    .select('*')
    .eq('user_id', userId);

  return safeSelect<UserJobStatus[]>(response, 'user_job_statuses');
}

export async function getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile> {
  const supabase = getServerClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) throw userError || new Error('User not found');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: applicationCountData } = await supabase
    .from('user_job_status')
    .select('user_id')
    .eq('user_id', userId)
    .eq('applied', true);

  const { data: resumeCountData } = await supabase
    .from('resumes')
    .select('user_id')
    .eq('user_id', userId);

  return {
    ...user,
    full_name: profile?.full_name || user.name,
    email: profile?.email || 'Unknown',
    joined_date: profile?.created_at || new Date().toISOString(),
    last_login: new Date().toISOString(),
    status: 'active',
    applications_sent: applicationCountData?.length || 0,
    resumes_uploaded: resumeCountData?.length || 0,
    profile_completed: !!profile?.full_name,
    subscription_type: 'free',
    location: profile?.location || 'Unknown',
  };
}

export async function ensureUserProfileExists(user: AuthUser): Promise<void> {
  if (!user?.id) {
    console.error('No valid AuthUser provided');
    return;
  }

  const supabase = getServerClient();

  const { id, email, role, user_metadata } = user;
  const name = user_metadata?.full_name ?? email;

  const response = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  const existingUser = safeSingle<{ id: string }>(response, 'users');

  if (!existingUser) {
    const newUser: PublicUser = {
      id,
      email,
      name,
      role: role ?? 'user',
    };

    const { error: insertError } = await supabase.from('users').insert(newUser);

    if (insertError) {
      console.error('Failed to insert user profile:', insertError.message);
    } else {
      console.log('User profile inserted into public.users');
    }
  }
}

export async function getAllJobs(userId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return [];
  }

  return data;
}

export async function getJobStatistics(userId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc('get_job_statistics', {
    user_id_input: userId,
  });

  if (error) {
    console.error('Error fetching job statistics:', error.message);
    return {};
  }

  return data;
}

export async function getUserResumes(userId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching resumes:', error.message);
    return [];
  }

  return data;
}