// client\src\lib\auth\userRoleSetup.ts
'use client'
import { supabase } from '@/lib/supabaseClient';

type Role = 'admin' | 'user' | 'job_seeker' | 'org';

export async function ensureUserRole(email: string, role: Role = 'user'): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || typeof user.email !== 'string') {
      console.error('Error getting user or invalid email:', userError);
      return false;
    }

    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : user.email.split('@')[0] || 'Unknown';

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        role,
        full_name: fullName,
      },
    });

    if (updateError || !data?.user) {
      console.error('Error updating user role:', updateError);
      return false;
    }

    console.log('✅ User role updated successfully:', {
      email: user.email,
      role,
      metadata: data.user.user_metadata,
    });

    return true;
  } catch (err) {
    console.error('Unhandled error in ensureUserRole:', err);
    return false;
  }
}

export async function setAdminRole(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || typeof user.email !== 'string') {
      console.error('Cannot set admin role: missing or invalid email');
      return false;
    }

    return ensureUserRole(user.email, 'admin');
  } catch (err) {
    console.error('Unhandled error in setAdminRole:', err);
    return false;
  }
}