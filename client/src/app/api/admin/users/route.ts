
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/services/admin/admin_users"; 
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // First verify the requesting user is an admin using regular auth
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized - Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    if (user.user_metadata?.role !== "admin") {
      console.error("User is not admin:", user.email);
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Now use admin client to fetch all users
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const status = searchParams.get('status') ?? undefined;

    console.log("Fetching users with admin service...");
    const users = await getAllUsers({ search, status });
    
    console.log(`Successfully fetched ${users.length} users`);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in /api/admin/users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}