'use client';
import {getSupabaseAdmin} from '@/lib/supabaseAdmin';

let _baseURL = '';

export async function setBaseURL(url: string): Promise<void> {
  _baseURL = url;
}

export async function getBaseURL(): Promise<string> {
  if (!_baseURL) {
    _baseURL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || '/api/admin';
  }
  return _baseURL;
}

export function handleAdminError(error: unknown): string {
  console.error("Admin error:", error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function getAdminSupabaseClient() {
  return getSupabaseAdmin;
}