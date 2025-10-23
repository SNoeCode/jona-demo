import { getSupabaseWithToken } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized - No token' }, { status: 401 });
    }

    const supabase = await getSupabaseWithToken(token);
    const body = await request.json();
    const { organizationId } = body;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json({ success: false, message: 'Not a member of this organization' }, { status: 403 });
    }

    const { error } = await supabase
      .from('users')
      .update({ current_organization_id: organizationId })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Update current org error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}