
// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "@/services/admin/admin_users"; 
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await getUserById(params.id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();
    const updatedUser = await updateUser(params.id, updates);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUser(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}