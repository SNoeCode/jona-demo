
// app/api/admin/resumes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getResumes } from "@/app/services/server-admin/admin-server";
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerActionClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    const resumes = await getResumes(page, search);
    
    return NextResponse.json(resumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
