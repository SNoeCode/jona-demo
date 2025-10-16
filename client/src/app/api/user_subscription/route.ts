import { getSubscriptionPlans } from '@/app/actions/getSubscriptionPlans';
// client\src\app\api\user_subscription\route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/admin/admin_index';

export async function GET() {
  try {
    const plans = await getSubscriptionPlans(); // You’ll define this method
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 });
  }
}