"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function runTransactionWithRetry(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase.rpc("your_transaction_function", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error.code === "40P01") {
        console.warn("Deadlock detected, retrying...");
        continue;
      }
      throw error;
    }
  }

  throw new Error("Transaction failed after 3 attempts");
}