// client/src/services/admin/admin_subscription.ts
import { AdminSubscriptionData, AdminSubscriptionStats } from "@/types/admin/admin_subscription";

const API_BASE_URL = '/api/admin';

export async function getSubscriptions(
  page: number = 1,
  search: string = '',
  status: string = 'all',
  plan: string = 'all'
): Promise<{ subscriptions: AdminSubscriptionData[]; total: number; limit: number }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      ...(search && { search }),
      ...(status !== 'all' && { status }),
      ...(plan !== 'all' && { plan })
    });

    const response = await fetch(`${API_BASE_URL}/subscriptions?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      subscriptions: data.subscriptions || [],
      total: data.total || 0,
      limit: data.limit || 50
    };
  } catch (error) {
    console.error('Error in getSubscriptions:', error);
    throw error;
  }
}

export async function getSubscriptionStats(): Promise<AdminSubscriptionStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/stats`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      totalRevenue: data.totalRevenue || 0,
      monthlyRecurringRevenue: data.monthlyRecurringRevenue || 0,
      activeSubscriptions: data.activeSubscriptions || 0,
      churnRate: data.churnRate || 0,
      averageRevenuePerUser: data.averageRevenuePerUser || 0,
      payment_history: data.payment_history || [],
      planDistribution: data.planDistribution || {
        free: 0,
        pro: 0,
        enterprise: 0
      }
    };
  } catch (error) {
    console.error('Error in getSubscriptionStats:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function refundSubscription(
  subscriptionId: string,
  amount: number
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process refund');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

export async function exportSubscriptions(format: 'csv' | 'json' = 'csv'): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/export?format=${format}`);

    if (!response.ok) {
      throw new Error('Failed to export subscriptions');
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting subscriptions:', error);
    throw error;
  }
}