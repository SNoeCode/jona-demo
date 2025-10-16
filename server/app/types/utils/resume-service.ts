// client\src\utils\resume-service.ts
"use client";
import { supabase } from "@/lib/supabaseClient";
import type { Resume, AuthUser, Job } from "@/types/index";
import { useAuth } from "@/hooks/useAuth";

export class ResumeService {
  // 📤 Upload resume file to Supabase Storage
  // 📤 Upload resume file to Supabase Storage
  static async uploadResume(
    file: File,
    userId: string,
    accessToken: string
  ): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `user_${userId}/${safeName}`;

    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(path, file, {
        upsert: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

    if (error) throw new Error("Upload failed: " + error.message);
    if (!data?.path) throw new Error("Upload succeeded but no path returned");

    return data.path;
  }

  // 🌐 Get public URL for a resume file
  static getResumePublicUrl(userId: string, fileName: string): string {
    const { data } = supabase.storage
      .from("resumes")
      .getPublicUrl(`user_${userId}/${fileName}`);

    return data.publicUrl;
  }

  static async insertResumeMetadata(
    userId: string,
    file: File,
    filePath: string,
    resumeText: string
  ): Promise<boolean> {
    const sanitizedText = resumeText.replace(/\s+/g, " ").trim();

    const { error } = await supabase.from("resumes").insert({
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      resume_type: "general",
      active: true,
      resume_text: sanitizedText,
    });

    if (error) throw new Error("Insert failed: " + error.message);

    return true;
  }

  // 🧱 Build a complete Resume object
  static async buildResumeObject(
    file: File,
    user: AuthUser,
    resumeText: string,
    accessToken: string
  ): Promise<Resume> {
    const filePath = await this.uploadResume(file, user.id, accessToken);
    const fileUrl = this.getResumePublicUrl(user.id, file.name);
    await this.insertResumeMetadata(user.id, file, filePath, resumeText);

    return {
      id: crypto.randomUUID(),
      user_id: user.id,
      file_path: filePath,
      file_name: file.name,
      file_url: fileUrl,
      resume_text: resumeText.replace(/\s+/g, " ").trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_default: true,
    };
  }

  static async getDefaultResume(userId: string): Promise<Resume | null> {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    if (error) {
      console.error("❌ Failed to fetch resume:", error.message);
      return null;
    }

    return data as Resume | null;
  }

  static async getUserResumes(userId: string): Promise<Resume[]> {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch resumes:", error.message);
      return [];
    }

    return data as Resume[];
  }

  static async updateResume(
    resume: Partial<Resume> & { id: string }
  ): Promise<boolean> {
    const { error } = await supabase
      .from("resumes")
      .update({
        file_name: resume.file_name,
        clean_text: resume.clean_text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resume.id);

    if (error) {
      console.error("❌ Error updating resume:", error.message);
      return false;
    }

    await supabase.from("admin_logs").insert({
      action: "resume_updated",
      user_id: resume.user_id,
      details: {
        resume_id: resume.id,
        file_name: resume.file_name,
        updated_fields: ["file_name", "clean_text"],
      },
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
