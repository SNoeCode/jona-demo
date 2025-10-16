// app/actions/executeTransaction.ts
"use server";

import { runTransactionWithRetry } from "@/app/services/supabaseTransaction";

export async function executeTransaction(userId: string) {
  return await runTransactionWithRetry(userId);
}