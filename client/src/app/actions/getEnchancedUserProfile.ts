// app/actions/getEnhancedUserProfile.ts
"use server";

import { getEnhancedUserProfile } from "@/app/services/server-user/server_user";

export async function fetchEnhancedProfile(userId: string) {
  return await getEnhancedUserProfile(userId);
}