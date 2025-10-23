// client/src/app/api/org/create/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const supabase = await createClient();
    
    console.log('Step 1: Getting authenticated user...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ User authenticated:', user.email);
    
    const body = await request.json();
    const { name, slug, industry, size, website, adminPosition } = body;
    
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Organization name and slug are required' },
        { status: 400 }
      );
    }
    
    console.log('Step 2: Checking slug availability...');
    // Check for slug collision
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();
    
    if (existingOrg) {
      console.error('❌ Slug already taken:', slug);
      return NextResponse.json(
        { success: false, message: 'Organization slug already taken' },
        { status: 400 }
      );
    }
    
    console.log('✅ Slug available');
    console.log('Step 3: Creating organization...');
    
    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug: slug.toLowerCase(),
        industry,
        size,
        website,
        owner_id: user.id, 
        created_by: user.id,
        settings: {},
        metadata: {},
        is_active: true,
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('❌ Organization creation error:', orgError);
      return NextResponse.json(
        { success: false, message: orgError.message },
        { status: 400 }
      );
    }
    
    console.log('✅ Organization created:', org.slug, 'ID:', org.id);
    
    console.log('Step 4: Adding user as organization owner...');
    // Add user as owner in organization_members
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        position: adminPosition || 'Owner',
        invitation_accepted: true,
        is_active: true,
        joined_at: new Date().toISOString(),
      });
    
    if (memberError) {
      console.error('❌ Member creation error:', memberError);
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      return NextResponse.json(
        { success: false, message: `Failed to add owner: ${memberError.message}` },
        { status: 400 }
      );
    }
    
    console.log('✅ Owner membership created');
    
    console.log('Step 5: Creating/updating user profile...');
    // Create or update user profile with organization context
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || name,
        role: 'employer',
        job_title: adminPosition || 'Owner',
        company: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id' 
      });
    
    if (profileError) {
      console.warn('⚠️ Failed to create user profile (non-critical):', profileError);
    } else {
      console.log('✅ User profile created/updated');
    }
    
    console.log('Step 6: Updating user record...');
    // Update user record with organization context
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        current_organization_id: org.id,
        is_org_owner: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });
    
    if (userError) {
      console.warn('⚠️ Failed to update user organization (non-critical):', userError);
    } else {
      console.log('✅ User record updated');
    }
    
    console.log('🎉 Organization registration complete!');
    
    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organizationSlug: org.slug,
      organization: org,
      message: 'Organization created successfully',
    });
    
  } catch (error: unknown) {
    console.error('❌ Create organization error:', error);
    const message =
      error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 }); 
  }
}