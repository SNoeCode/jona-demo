export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getCurrentSubscription } from '@/services/user-services/subscription-service';
import { requireUserAuth } from '@/lib/supabase/auth-server';

export async function GET() {
  try {
    const user = await requireUserAuth(); // ✅ replaces getServerAuth()

    const subscription = await getCurrentSubscription(user.id);
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized or unknown error' }, { status: 401 });
  }
}