import type { OrgAuthResult } from '@/lib/supabase/auth-org';

export function getOrgRole(auth?: OrgAuthResult | null): string {
  if (!auth) return 'user';
  if (typeof auth.memberRole === 'string' && auth.memberRole) return auth.memberRole;
  if (typeof auth.role === 'string' && auth.role) return auth.role;
  const metaRole = (auth.user as any)?.user_metadata?.role;
  if (typeof metaRole === 'string' && metaRole) return metaRole;
  return 'user';
}

// export function getOrgRole(auth?: OrgAuthResult | null): string {
//   if (!auth) return 'user';
//   const memberRole = typeof auth.memberRole === 'string' ? auth.memberRole.toLowerCase() : '';

//   if (memberRole) return memberRole;
//   const globalRole = typeof auth.role === 'string' ? auth.role.toLowerCase() : '';
//   if (globalRole) return globalRole;
//   const metaRole = (auth.user as any)?.user_metadata?.role;
//   if (typeof metaRole === 'string' && metaRole) return metaRole.toLowerCase();

//   // Default fallback
//   return 'user';
// }