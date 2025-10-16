
// client\src\lib\auth-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRole } from '@/lib/auth/userRoleSetup';

function safeRedirect(path: string, reason?: string): never {
  redirect(reason ? `${path}?reason=${encodeURIComponent(reason)}` : path);
}

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    console.error(`Invalid or missing field: ${key}`);
    safeRedirect('/error', `invalid-${key}`);
  }
  return value;
}

async function getVerifiedUserEmail(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user || typeof user.email !== 'string') {
    console.error('Missing user or email:', error);
    safeRedirect('/error', 'session-missing');
  }

  return user.email;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = getStringField(formData, 'email');
  const password = getStringField(formData, 'password');

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login error:', error);
    safeRedirect('/error', 'invalid-login');
  }

  const verifiedEmail = await getVerifiedUserEmail();
  await ensureUserRole(verifiedEmail, 'user');

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const firstName = getStringField(formData, 'first-name');
  const lastName = getStringField(formData, 'last-name');
  const email = getStringField(formData, 'email');
  const password = getStringField(formData, 'password');
  const fullName = `${firstName} ${lastName}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email,
      },
    },
  });

  if (error) {
    console.error('Signup error:', error);
    safeRedirect('/error', 'signup-failed');
  }

  const verifiedEmail = await getVerifiedUserEmail();
  await ensureUserRole(verifiedEmail, 'user');

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Signout error:', error);
    safeRedirect('/error', 'signout-failed');
  }

  redirect('/logout');
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  const url = data?.url;
  if (typeof url !== 'string') {
    console.error('OAuth error:', error);
    safeRedirect('/error', 'oauth-failed');
  }

  redirect(url);
}

