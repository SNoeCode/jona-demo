// import type { OrgAuthResult } from '@/lib/supabase/auth-org';

// export function getOrgRole(auth?: OrgAuthResult | null): string {
//   if (!auth) return 'user';
//   if (typeof auth.memberRole === 'string' && auth.memberRole) return auth.memberRole;
//   if (typeof auth.role === 'string' && auth.role) return auth.role;
//   const metaRole = (auth.user as any)?.user_metadata?.role;
//   if (typeof metaRole === 'string' && metaRole) return metaRole;
//   return 'user';
// }
import type { OrgAuthResult } from '@/lib/supabase/auth-org';

/**
 * Resolves the user's effective role within the organization context.
 * Prioritizes organization membership role, then global role, then metadata fallback.
 */
export function getOrgRole(auth?: OrgAuthResult | null): string {
  if (!auth) return 'user';

  // Normalize and prioritize membership role
  const memberRole = typeof auth.memberRole === 'string' ? auth.memberRole.toLowerCase() : '';

  if (memberRole) return memberRole;

  // Fallback to global role
  const globalRole = typeof auth.role === 'string' ? auth.role.toLowerCase() : '';
  if (globalRole) return globalRole;

  // Fallback to user metadata role
  const metaRole = (auth.user as any)?.user_metadata?.role;
  if (typeof metaRole === 'string' && metaRole) return metaRole.toLowerCase();

  // Default fallback
  return 'user';
}