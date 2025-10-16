import { z } from "zod";

export const ResumeRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  file_name: z.string().nullable(),
  file_path: z.string().nullable(),
  created_at: z.string(),
  raw_text: z.string().nullable().optional(),
  users: z.array(
    z.object({
      name: z.string().optional(),
      email: z.string().optional(),
    })
  ).optional(),
  user_profile: z.object({
    full_name: z.string(),
    email: z.string(),
  }).optional(),
  total_matches: z.number().optional(),
});