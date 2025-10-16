import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export async function POST(request: Request) {
  try {
  //  const supabase = await createClient();
  
  const supabaseAdmin = await getSupabaseAdmin()
    
    const body = await request.json();
    const {
      name,
      slug,
      industry,
      size,
      website,
      adminUserId,
      adminPosition,

    } = body;

    if (!adminUserId || !name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Create organization
    // const { data: org, error: orgError } = await supabase
    //   .from('organizations')
    //   .insert({
    //     name,
    //     slug,
    //     industry,
    //     size,
    //     website,
    //     settings: {},
    //     metadata: {},
    //   })
    //   .select()
    //   .single();
    const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert([
      {
        name,
        slug,
        // email,
        industry,
        size,         // ✅ comma was missing here
        website,
        settings: {},
        metadata: {},
      },
    ])
    .select()
    .single();
  
  if (orgError) {
    return NextResponse.json(
      { success: false, message: orgError.message },
      { status: 400 }
    );
  }
    // Add admin as owner
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: adminUserId,
        role: 'owner',
        position: adminPosition,
        invitation_accepted: true,
        is_active: true,
      });

    if (memberError) {
      await supabaseAdmin.from('organizations').delete().eq('id', org.id); // rollback
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
      .eq('id', adminUserId);

    if (userError) {
      console.error('Failed to update user organization:', userError);
    }

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      organization: org,
    });
 } catch (error: unknown) {
  console.error("Accept invitation error:", error);

  const message =
    error instanceof Error ? error.message : "Unexpected error occurred";

  return NextResponse.json(
    { success: false, message },
    { status: 500 }
  );
}
}