import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sendInvitationEmail } from "@/helpers/sendInvitationEmail";

interface InvitePayload {
  organizationId: string;
  organizationName: string;
  email: string;
  role?: string;
  invitedBy: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: InvitePayload = await request.json();
    const { organizationId, organizationName, email, role, invitedBy } = body;
    const token = uuidv4();

    const { data: invitation, error } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        organization_name: organizationName, 
        email,
        role: role || "member",
        invited_by: invitedBy,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    await sendInvitationEmail(email, token, organizationName);

    return NextResponse.json({
      success: true,
      invitation,
      invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/org/join?token=${token}`,
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