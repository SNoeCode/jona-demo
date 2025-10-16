import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const logAdminAction = async (
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown> | null,
  oldValues?: Record<string, unknown> | null
) => {
  console.log(`[ADMIN ACTION] ${action} by ${userId}`, {
    entityType,
    entityId,
    newValues,
    oldValues,
  });

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin.from("admin_audit_log").insert([
      {
        user_id: userId,
        user_email: userEmail,
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: newValues,
        old_values: oldValues ?? null,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("Failed to log admin action to Supabase:", err);
  }
};

// ─────────────────────────────────────────────────────────────
// Example Usage: Bulk Job Update Logging
// ─────────────────────────────────────────────────────────────

export async function logBulkJobUpdate(
  user: { id: string; email?: string },
  ids: string[],
  status: string
): Promise<boolean> {
  await logAdminAction(
    user.id,
    user.email || "",
    "bulk_update",
    "jobs",
    ids.join(","),
    { status, count: ids.length },
    null
  );

  return true;
}