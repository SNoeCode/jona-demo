import { getSupabaseWithToken } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized - No token' }, { status: 401 });
    }

    const supabase = await getSupabaseWithToken(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in user-organizations:', authError);
      return NextResponse.json({ success: false, message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('Fetching organizations for user:', user.id);

    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role, joined_at')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (memberError) {
      console.error('Membership query error:', memberError);
      return NextResponse.json({ success: false, message: 'Failed to fetch memberships', error: memberError.message }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ success: true, organizations: [] });
    }

    const orgIds = memberships.map(m => m.organization_id);
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .in('id', orgIds);

    if (orgsError) {
      console.error('Organizations query error:', orgsError);
      return NextResponse.json({ success: false, message: 'Failed to fetch organizations', error: orgsError.message }, { status: 500 });
    }

    const orgData = await Promise.all(
      (organizations || []).map(async (org) => {
        const membership = memberships.find(m => m.organization_id === org.id);
        const { count: memberCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true);

        return {
          organization_id: org.id,
          organization_name: org.name,
          organization_slug: org.slug,
          user_role: membership?.role || 'member',
          joined_at: membership?.joined_at,
          member_count: memberCount || 0,
          active_jobs: 0,
        };
      })
    );

    console.log(`Found ${orgData.length} organizations`);
    return NextResponse.json({ success: true, organizations: orgData });

  } catch (error: unknown) {
    console.error('Get user organizations error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}