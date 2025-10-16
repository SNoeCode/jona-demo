// ===== NOTIFICATION TYPES =====
export interface AdminNotification {
  id: string;
  // type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}