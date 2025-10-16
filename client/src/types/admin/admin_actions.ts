
// ===== ACTION TYPES =====
export interface AdminAction {
  type: 'cancel_subscription' | 'refund_payment' | 'activate_user' | 'deactivate_user' | 'delete_job';
  target_id: string;
  performed_by: string;
  performed_at: string;
  details?: Record<string, unknown>;
}
