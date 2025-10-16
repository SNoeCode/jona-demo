"use server";

import { getSupabaseAdmin } from "../supabaseAdmin";
import { cookies } from "next/headers";
import { decode } from "jsonwebtoken";
import { z } from "zod";

const JwtPayloadSchema = z.object({
  sub: z.string(), // user ID
  email: z.string().email(),
  user_metadata: z.object({
    role: z.string().optional(),
  }).optional(),
});


export async function getScopedSupabaseClient() {
  const token = cookies().get("sb-access-token")?.value;
  const decoded = token ? decode(token) : null;

  const parsed = JwtPayloadSchema.safeParse(decoded);
  const user = parsed.success ? parsed.data : null;

  const supabase = await getSupabaseAdmin();

  return { supabase, user };
}