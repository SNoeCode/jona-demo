// client\src\utils\admin-log-service.ts
'use server'
// import { supabase } from "@/app/api/auth/auth";
import { supabase } from "@/lib/supabaseClient";
export const logAdminAction = async (
  action: string,
  payload: Record<string, unknown>,
  userId: string
) => {
  console.log(`[ADMIN ACTION] ${action} by ${userId}`, payload);

  try {
    await supabase.from("admin_audit_log").insert([
      {
        action,
        payload,
        user_id: userId,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("Failed to log admin action to Supabase:", err);
  }
};
