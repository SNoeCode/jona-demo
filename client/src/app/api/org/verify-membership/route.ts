// client/src/app/api/org/verify-membership/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, message: "Authentication failed: " + authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error("No user found in session");
      return NextResponse.json(
        { success: false, message: "No authenticated user found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationSlug } = body;

    console.log("Verifying membership for user:", user.id, "org:", organizationSlug);

    // Rest of your code...
    
  } catch (error: unknown) {
    console.error("Verify membership error:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}