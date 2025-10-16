// import { z } from "zod";
// import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// import type { AdminResume } from "@/types/admin/admin_resume";
// import { getResumeById } from "@/services/admin/admin_resume";

// export const ResumeAdminSchema = z.object({
//   id: z.string(),
//   user_id: z.string(),
//   file_name: z.string().nullable(),
//   file_path: z.string().nullable(),
//   created_at: z.string(),
//   raw_text: z.string().nullable().optional(),
//   users: z.array(
//     z.object({
//       name: z.string().optional(),
//       email: z.string().optional(),
//     })
//   ).optional(),
//   user_profile: z.object({
//     full_name: z.string(),
//     email: z.string(),
//   }).optional(),
//   total_matches: z.number().optional(),
//   content: z.string().optional(),
// });



// export const UpdateResumeSchema = ResumeAdminSchema.partial();
// export type ResumeAdmin = z.infer<typeof ResumeAdminSchema>;
// // ✅ JWT shape
// type JwtUser = {
//   sub: string;
//   email: string;
//   user_metadata?: {
//     role?: string;
//   };
// };
// export async function updateResume(
//   id: string,
//   updates: unknown,
//   user: JwtUser
// ): Promise<AdminResume | null> {
//   if (!user || user.user_metadata?.role !== "admin") {
//     console.warn("Unauthorized update attempt by:", user?.email ?? "unknown");
//     throw new Error("Unauthorized");
//   }

//   const parsed = UpdateResumeSchema.safeParse(updates);
//   if (!parsed.success) {
//     console.warn("Invalid resume update payload:", parsed.error.format());
//     throw new Error("Invalid update payload");
//   }

//   const supabase = await getSupabaseAdmin();
//   const { error } = await supabase
//     .from("resumes")
//     .update(parsed.data)
//     .eq("id", id);

//   if (error) {
//     console.error(`Error updating resume ${id}:`, error);
//     throw error;
//   }

//   return await getResumeById(id);
// }
//   export type { AdminResume };