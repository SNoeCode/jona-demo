import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

let _baseURL: string = '';

export async function setBaseURL(url: string): Promise<void> {
  _baseURL = url;
}

export async function getBaseURL(): Promise<string> {
  if (!_baseURL) {
    _baseURL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || '/api/admin';
  }
  return _baseURL;
}

export async function handleAdminError(error: unknown): Promise<string> {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function getAdminSupabaseClient() {
  return getSupabaseAdmin(); // ✅ actually returns the client
}