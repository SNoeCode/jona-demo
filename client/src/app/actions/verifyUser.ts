// app/actions/verifyUser.ts
"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function verifyUser(userId: string): Promise<boolean> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("verifyUser error:", error);
    return false;
  }

  return !!data?.id;
}