import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
  const supabase = await createClient(); 
    const body = await request.json();
    
    const { token, userId } = body;

    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .select('*, organizations(name, slug)')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation' },
        { status: 400 }
      );
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Invitation has expired' },
        { status: 400 }
      );
    }
    if (invitation.accepted_at) {
      return NextResponse.json(
        { success: false, message: 'Invitation already accepted' },
        { status: 400 }
      );
    }
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invitation_accepted: true,
        invitation_token: token,
        is_active: true,
      });

    if (memberError) {
      return NextResponse.json(
        { success: false, message: memberError.message },
        { status: 400 }
      );
    }

    await supabase
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    await supabase
      .from('users')
      .update({ current_organization_id: invitation.organization_id })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      organization: invitation.organizations,
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