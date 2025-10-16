
import { supabase } from "@/lib/supabaseClient";
import type { Resume, AuthUser } from "@/types/user/index";

export class ResumeService {
  // 📤 Upload resume file to Supabase Storage
  static async uploadResume(file: File, userId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `user_${userId}/${safeName}`;

    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(path, file);

    if (error) throw new Error("Upload failed: " + error.message);

    return data.path;
  }

  // 🌐 Get public URL for a resume file
  static getResumePublicUrl(userId: string, fileName: string): string {
    const { data } = supabase.storage
      .from("resumes")
      .getPublicUrl(`user_${userId}/${fileName}`);

    return data.publicUrl;
  }

  // 📝 Insert resume metadata into Supabase DB
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
    resumeText: string
  ): Promise<Resume> {
    const filePath = await this.uploadResume(file, user.id);
    const fileUrl = this.getResumePublicUrl(user.id, file.name);
    await this.insertResumeMetadata(user.id, file, filePath, resumeText);

    return {
      id: crypto.randomUUID(), // Optional: replace with Supabase-generated ID
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

  // 📄 Fetch the default resume for a user
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

  // 📚 Fetch all resumes for a user
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

  // 🛠️ Update resume metadata
  static async updateResume(resume: Partial<Resume> & { id: string }): Promise<boolean> {
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

    // Optional: log admin action
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