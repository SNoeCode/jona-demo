// client/src/app/api/org/register/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      industry,
      size,
      website,
      adminPosition,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Organization name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug.toLowerCase())
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { success: false, message: 'Organization slug already taken' },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug: slug.toLowerCase(),
        industry,
        size,
        website,
        settings: {},
        metadata: {},
        is_active: true,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return NextResponse.json(
        { success: false, message: orgError.message },
        { status: 400 }
      );
    }

    // Add user as owner with org_admin role
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',  // This should match your org_role enum
        position: adminPosition,
        invitation_accepted: true,
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Rollback organization creation
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      return NextResponse.json(
        { success: false, message: memberError.message },
        { status: 400 }
      );
    }

    // Update user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        current_organization_id: org.id,
        is_org_owner: true,
      })
      .eq('id', user.id);

    if (userError) {
      console.error('Failed to update user organization:', userError);
    }

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationSlug: org.slug,
      organization: org,
      redirectUrl: `/org/${org.slug}/dashboard`,
    });
  } catch (error: unknown) {
    console.error('Register organization error:', error);
    const message =
      error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}